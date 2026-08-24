import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, gruposTable, participantesTable, despesasTable, divisoesTable } from "@workspace/db";
import {
  CreateGrupoBody,
  GetGrupoParams,
  GetGrupoPorConviteParams,
  GetSaldoParams,
  GetResumoGrupoParams,
} from "@workspace/api-zod";
import { calcularTransferencias } from "../lib/saldo";

const router: IRouter = Router();

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

async function getGrupoDetalhado(id: number) {
  const [grupo] = await db.select().from(gruposTable).where(eq(gruposTable.id, id));
  if (!grupo) return null;
  const participantes = await db.select().from(participantesTable).where(eq(participantesTable.grupoId, id));
  return {
    ...grupo,
    participantes,
  };
}

router.post("/grupos", async (req, res): Promise<void> => {
  const parsed = CreateGrupoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let codigoConvite = generateInviteCode();
  // Ensure uniqueness
  let attempts = 0;
  while (attempts < 10) {
    const existing = await db.select().from(gruposTable).where(eq(gruposTable.codigoConvite, codigoConvite));
    if (existing.length === 0) break;
    codigoConvite = generateInviteCode();
    attempts++;
  }

  const [grupo] = await db
    .insert(gruposTable)
    .values({ nome: parsed.data.nome, codigoConvite })
    .returning();

  res.status(201).json({
    id: grupo.id,
    nome: grupo.nome,
    codigoConvite: grupo.codigoConvite,
    criadoEm: grupo.criadoEm,
  });
});

router.get("/grupos/convite/:codigo", async (req, res): Promise<void> => {
  const params = GetGrupoPorConviteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [grupo] = await db
    .select()
    .from(gruposTable)
    .where(eq(gruposTable.codigoConvite, params.data.codigo.toUpperCase()));

  if (!grupo) {
    res.status(404).json({ error: "Grupo não encontrado" });
    return;
  }

  const detalhado = await getGrupoDetalhado(grupo.id);
  res.json(detalhado);
});

router.get("/grupos/:id", async (req, res): Promise<void> => {
  const params = GetGrupoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const detalhado = await getGrupoDetalhado(params.data.id);
  if (!detalhado) {
    res.status(404).json({ error: "Grupo não encontrado" });
    return;
  }

  res.json(detalhado);
});

router.get("/grupos/:grupoId/saldo", async (req, res): Promise<void> => {
  const params = GetSaldoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { grupoId } = params.data;

  const participantes = await db
    .select()
    .from(participantesTable)
    .where(eq(participantesTable.grupoId, grupoId));

  const despesas = await db
    .select()
    .from(despesasTable)
    .where(eq(despesasTable.grupoId, grupoId));

  const todasDivisoes = await db
    .select({
      id: divisoesTable.id,
      despesaId: divisoesTable.despesaId,
      participanteId: divisoesTable.participanteId,
      valorDevido: divisoesTable.valorDevido,
      quitado: divisoesTable.quitado,
    })
    .from(divisoesTable)
    .innerJoin(despesasTable, eq(divisoesTable.despesaId, despesasTable.id))
    .where(eq(despesasTable.grupoId, grupoId));

  const despesaMap = new Map(despesas.map((d) => [d.id, d]));

  const divisoesComPagador = todasDivisoes.map((d) => ({
    participanteId: d.participanteId,
    valorDevido: parseFloat(d.valorDevido),
    pagoPorId: despesaMap.get(d.despesaId)?.pagoPorId ?? 0,
    quitado: d.quitado,
  }));

  const totalGasto = despesas.reduce((sum, d) => sum + parseFloat(d.valor), 0);

  // Per-participant stats
  const participanteStats = participantes.map((p) => {
    const totalPago = despesas
      .filter((d) => d.pagoPorId === p.id)
      .reduce((sum, d) => sum + parseFloat(d.valor), 0);
    const totalDevido = divisoesComPagador
      .filter((d) => d.participanteId === p.id && d.pagoPorId !== p.id)
      .reduce((sum, d) => sum + d.valorDevido, 0);
    return {
      participante: p,
      totalPago: Math.round(totalPago * 100) / 100,
      totalDevido: Math.round(totalDevido * 100) / 100,
      saldoLiquido: Math.round((totalPago - totalDevido) * 100) / 100,
    };
  });

  const transferenciasIds = calcularTransferencias(participantes, divisoesComPagador);
  const participanteMap = new Map(participantes.map((p) => [p.id, p]));

  const transferencias = transferenciasIds.map((t) => ({
    de: participanteMap.get(t.fromId)!,
    para: participanteMap.get(t.toId)!,
    valor: t.valor,
  }));

  res.json({
    totalGasto: Math.round(totalGasto * 100) / 100,
    participantes: participanteStats,
    transferencias,
  });
});

router.get("/grupos/:grupoId/resumo", async (req, res): Promise<void> => {
  const params = GetResumoGrupoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { grupoId } = params.data;

  const participantes = await db
    .select()
    .from(participantesTable)
    .where(eq(participantesTable.grupoId, grupoId));

  const despesas = await db
    .select()
    .from(despesasTable)
    .where(eq(despesasTable.grupoId, grupoId));

  const totalGasto = despesas.reduce((sum, d) => sum + parseFloat(d.valor), 0);
  const totalParticipantes = participantes.length;
  const despesasPorParticipante =
    totalParticipantes > 0 ? Math.round((totalGasto / totalParticipantes) * 100) / 100 : 0;

  // Last 3 expenses with details
  const ultimasDespesas3 = despesas
    .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())
    .slice(0, 3);

  const participanteMap = new Map(participantes.map((p) => [p.id, p]));

  const ultimasDespesas = await Promise.all(
    ultimasDespesas3.map(async (d) => {
      const divisoes = await db
        .select()
        .from(divisoesTable)
        .where(eq(divisoesTable.despesaId, d.id));
      const divisoesComPart = divisoes.map((div) => ({
        ...div,
        valorDevido: parseFloat(div.valorDevido),
        participante: participanteMap.get(div.participanteId)!,
      }));
      return {
        ...d,
        valor: parseFloat(d.valor),
        pagoPor: participanteMap.get(d.pagoPorId)!,
        divisoes: divisoesComPart,
      };
    }),
  );

  res.json({
    totalDespesas: despesas.length,
    totalGasto: Math.round(totalGasto * 100) / 100,
    totalParticipantes,
    despesasPorParticipante,
    ultimasDespesas,
  });
});

export default router;

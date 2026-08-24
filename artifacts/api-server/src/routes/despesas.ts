import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, despesasTable, divisoesTable, participantesTable } from "@workspace/db";
import {
  CreateDespesaParams,
  CreateDespesaBody,
  ListDespesasParams,
  DeleteDespesaParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/grupos/:grupoId/despesas", async (req, res): Promise<void> => {
  const params = ListDespesasParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const despesas = await db
    .select()
    .from(despesasTable)
    .where(eq(despesasTable.grupoId, params.data.grupoId))
    .orderBy(desc(despesasTable.criadoEm));

  const participantes = await db
    .select()
    .from(participantesTable)
    .where(eq(participantesTable.grupoId, params.data.grupoId));

  const participanteMap = new Map(participantes.map((p) => [p.id, p]));

  const result = await Promise.all(
    despesas.map(async (d) => {
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

  res.json(result);
});

router.post("/grupos/:grupoId/despesas", async (req, res): Promise<void> => {
  const pathParams = CreateDespesaParams.safeParse(req.params);
  if (!pathParams.success) {
    res.status(400).json({ error: pathParams.error.message });
    return;
  }

  const parsed = CreateDespesaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { descricao, valor, pagoPorId, participantes: divs } = parsed.data;

  // Validate total divisoes match valor (within rounding tolerance)
  const totalDivisoes = divs.reduce((sum, d) => sum + d.valorDevido, 0);
  if (Math.abs(totalDivisoes - valor) > 0.02) {
    res.status(400).json({ error: "A soma das divisões deve ser igual ao valor total da despesa" });
    return;
  }

  const [despesa] = await db
    .insert(despesasTable)
    .values({
      descricao,
      valor: String(valor),
      pagoPorId,
      grupoId: pathParams.data.grupoId,
    })
    .returning();

  const divisoesCriadas = await db
    .insert(divisoesTable)
    .values(
      divs.map((d) => ({
        despesaId: despesa.id,
        participanteId: d.participanteId,
        valorDevido: String(d.valorDevido),
      })),
    )
    .returning();

  const participantes = await db
    .select()
    .from(participantesTable)
    .where(eq(participantesTable.grupoId, pathParams.data.grupoId));

  const participanteMap = new Map(participantes.map((p) => [p.id, p]));

  res.status(201).json({
    ...despesa,
    valor: parseFloat(despesa.valor),
    pagoPor: participanteMap.get(despesa.pagoPorId)!,
    divisoes: divisoesCriadas.map((d) => ({
      ...d,
      valorDevido: parseFloat(d.valorDevido),
      participante: participanteMap.get(d.participanteId)!,
    })),
  });
});

router.delete("/despesas/:id", async (req, res): Promise<void> => {
  const params = DeleteDespesaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [despesa] = await db
    .delete(despesasTable)
    .where(eq(despesasTable.id, params.data.id))
    .returning();

  if (!despesa) {
    res.status(404).json({ error: "Despesa não encontrada" });
    return;
  }

  res.sendStatus(204);
});

export default router;

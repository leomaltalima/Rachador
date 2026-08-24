import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, participantesTable, gruposTable } from "@workspace/db";
import {
  CreateParticipanteParams,
  CreateParticipanteBody,
  ListParticipantesParams,
  UpdateParticipanteParams,
  UpdateParticipanteBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/grupos/:grupoId/participantes", async (req, res): Promise<void> => {
  const params = ListParticipantesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const participantes = await db
    .select()
    .from(participantesTable)
    .where(eq(participantesTable.grupoId, params.data.grupoId));

  res.json(participantes);
});

router.post("/grupos/:grupoId/participantes", async (req, res): Promise<void> => {
  const pathParams = CreateParticipanteParams.safeParse(req.params);
  if (!pathParams.success) {
    res.status(400).json({ error: pathParams.error.message });
    return;
  }

  const parsed = CreateParticipanteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [grupo] = await db
    .select()
    .from(gruposTable)
    .where(eq(gruposTable.id, pathParams.data.grupoId));

  if (!grupo) {
    res.status(404).json({ error: "Grupo não encontrado" });
    return;
  }

  const [participante] = await db
    .insert(participantesTable)
    .values({
      nome: parsed.data.nome,
      chavePix: parsed.data.chavePix ?? null,
      grupoId: pathParams.data.grupoId,
    })
    .returning();

  res.status(201).json(participante);
});

router.patch("/participantes/:id", async (req, res): Promise<void> => {
  const params = UpdateParticipanteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateParticipanteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Partial<{ nome: string; chavePix: string | null }> = {};
  if (parsed.data.nome !== undefined) updates.nome = parsed.data.nome;
  if ("chavePix" in parsed.data) updates.chavePix = parsed.data.chavePix ?? null;

  const [participante] = await db
    .update(participantesTable)
    .set(updates)
    .where(eq(participantesTable.id, params.data.id))
    .returning();

  if (!participante) {
    res.status(404).json({ error: "Participante não encontrado" });
    return;
  }

  res.json(participante);
});

export default router;

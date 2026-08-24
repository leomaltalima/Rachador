import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, divisoesTable } from "@workspace/db";
import { QuitarDivisaoParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.patch("/divisoes/:id/quitar", async (req, res): Promise<void> => {
  const params = QuitarDivisaoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [divisao] = await db
    .update(divisoesTable)
    .set({ quitado: true })
    .where(eq(divisoesTable.id, params.data.id))
    .returning();

  if (!divisao) {
    res.status(404).json({ error: "Divisão não encontrada" });
    return;
  }

  res.json({
    ...divisao,
    valorDevido: parseFloat(divisao.valorDevido),
  });
});

export default router;

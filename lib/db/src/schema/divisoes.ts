import { pgTable, serial, integer, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { despesasTable } from "./despesas";
import { participantesTable } from "./participantes";

export const divisoesTable = pgTable("divisoes", {
  id: serial("id").primaryKey(),
  despesaId: integer("despesa_id")
    .notNull()
    .references(() => despesasTable.id, { onDelete: "cascade" }),
  participanteId: integer("participante_id")
    .notNull()
    .references(() => participantesTable.id, { onDelete: "cascade" }),
  valorDevido: numeric("valor_devido", { precision: 10, scale: 2 }).notNull(),
  quitado: boolean("quitado").notNull().default(false),
});

export const insertDivisaoSchema = createInsertSchema(divisoesTable).omit({ id: true, quitado: true });
export type InsertDivisao = z.infer<typeof insertDivisaoSchema>;
export type Divisao = typeof divisoesTable.$inferSelect;

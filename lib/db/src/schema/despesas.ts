import { pgTable, text, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { gruposTable } from "./grupos";
import { participantesTable } from "./participantes";

export const despesasTable = pgTable("despesas", {
  id: serial("id").primaryKey(),
  descricao: text("descricao").notNull(),
  valor: numeric("valor", { precision: 10, scale: 2 }).notNull(),
  pagoPorId: integer("pago_por_id")
    .notNull()
    .references(() => participantesTable.id, { onDelete: "restrict" }),
  grupoId: integer("grupo_id")
    .notNull()
    .references(() => gruposTable.id, { onDelete: "cascade" }),
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDespesaSchema = createInsertSchema(despesasTable).omit({ id: true, criadoEm: true });
export type InsertDespesa = z.infer<typeof insertDespesaSchema>;
export type Despesa = typeof despesasTable.$inferSelect;

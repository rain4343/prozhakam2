import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { documentsTable } from "./documents";
import { usersTable } from "./users";

export const documentLogsTable = pgTable("document_logs", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull().references(() => documentsTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  action: text("action").notNull().default("forwarded"),
  notes: text("notes"),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDocumentLogSchema = createInsertSchema(documentLogsTable).omit({ id: true, timestamp: true });
export type InsertDocumentLog = z.infer<typeof insertDocumentLogSchema>;
export type DocumentLog = typeof documentLogsTable.$inferSelect;

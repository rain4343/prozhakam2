import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { documentsTable } from "./documents";
import { usersTable } from "./users";
import { departmentsTable } from "./departments";

export const documentLogsTable = pgTable("document_logs", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull().references(() => documentsTable.id, { onDelete: "cascade" }),
  fromUserId: integer("from_user_id").references(() => usersTable.id, { onDelete: "set null" }),
  toDepartmentId: integer("to_department_id").references(() => departmentsTable.id, { onDelete: "set null" }),
  toUserId: integer("to_user_id").references(() => usersTable.id, { onDelete: "set null" }),
  action: text("action").notNull().default("forwarded"),
  note: text("note"),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDocumentLogSchema = createInsertSchema(documentLogsTable).omit({ id: true, timestamp: true });
export type InsertDocumentLog = z.infer<typeof insertDocumentLogSchema>;
export type DocumentLog = typeof documentLogsTable.$inferSelect;

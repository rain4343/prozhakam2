import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, documentsTable, documentLogsTable, usersTable, departmentsTable, rolesTable, userRolesTable } from "@workspace/db";
import { toJSON } from "../lib/serialize";

function validateDocumentInput(body: unknown): { data: { documentNumber: string; documentDate: string; subject: string; creatorId: number; currentStatus: string; filePath?: string | null } } | { error: string } {
  const b = body as Record<string, unknown>;
  if (!b.documentNumber || typeof b.documentNumber !== "string") return { error: "documentNumber is required" };
  if (!b.documentDate || typeof b.documentDate !== "string") return { error: "documentDate is required" };
  if (!b.subject || typeof b.subject !== "string") return { error: "subject is required" };
  if (!b.creatorId || typeof b.creatorId !== "number") return { error: "creatorId is required" };
  return { data: { documentNumber: b.documentNumber, documentDate: b.documentDate, subject: b.subject, creatorId: b.creatorId, currentStatus: typeof b.currentStatus === "string" ? b.currentStatus : "pending", filePath: typeof b.filePath === "string" ? b.filePath : null } };
}

function validateForwardInput(body: unknown): { data: { fromUserId: number; toDepartmentId?: number | null; toUserId?: number | null; note?: string | null; newStatus?: string } } | { error: string } {
  const b = body as Record<string, unknown>;
  if (!b.fromUserId || typeof b.fromUserId !== "number") return { error: "fromUserId is required" };
  return { data: { fromUserId: b.fromUserId, toDepartmentId: typeof b.toDepartmentId === "number" ? b.toDepartmentId : null, toUserId: typeof b.toUserId === "number" ? b.toUserId : null, note: typeof b.note === "string" ? b.note : null, newStatus: typeof b.newStatus === "string" ? b.newStatus : undefined } };
}

async function getUserWithRelations(id: number) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) return null;
  const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, user.departmentId));
  const userRoles = await db
    .select({ role: rolesTable })
    .from(userRolesTable)
    .innerJoin(rolesTable, eq(userRolesTable.roleId, rolesTable.id))
    .where(eq(userRolesTable.userId, id));
  return { ...user, department: dept ?? null, roles: userRoles.map((r) => r.role) };
}

async function getDocumentWithLogs(id: number) {
  const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.id, id));
  if (!doc) return null;

  const creator = await getUserWithRelations(doc.creatorId);

  const logs = await db
    .select()
    .from(documentLogsTable)
    .where(eq(documentLogsTable.documentId, id))
    .orderBy(documentLogsTable.timestamp);

  const logsWithRelations = await Promise.all(
    logs.map(async (log) => {
      const fromUser = log.fromUserId ? await getUserWithRelations(log.fromUserId) : null;
      const toDept = log.toDepartmentId
        ? await db.select().from(departmentsTable).where(eq(departmentsTable.id, log.toDepartmentId)).then(r => r[0] ?? null)
        : null;
      const toUser = log.toUserId ? await getUserWithRelations(log.toUserId) : null;
      return { ...log, fromUser, toDepartment: toDept, toUser };
    })
  );

  return { ...doc, creator, logs: logsWithRelations };
}

const router: IRouter = Router();

router.get("/documents", async (req, res): Promise<void> => {
  const docs = await db.select().from(documentsTable).orderBy(desc(documentsTable.createdAt));
  const docsWithCreators = await Promise.all(
    docs.map(async (doc) => {
      const creator = await getUserWithRelations(doc.creatorId);
      return { ...doc, creator };
    })
  );
  res.json(toJSON(docsWithCreators));
});

router.post("/documents", async (req, res): Promise<void> => {
  const parsed = validateDocumentInput(req.body);
  if ("error" in parsed) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  const [doc] = await db.insert(documentsTable).values(parsed.data).returning();

  await db.insert(documentLogsTable).values({
    documentId: doc.id,
    fromUserId: doc.creatorId,
    action: "created",
    note: "نوسراوەکە دروستکرا",
  });

  const result = await getDocumentWithLogs(doc.id);
  res.status(201).json(toJSON(result));
});

router.get("/documents/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const doc = await getDocumentWithLogs(id);
  if (!doc) { res.status(404).json({ error: "Document not found" }); return; }
  res.json(toJSON(doc));
});

router.post("/documents/:id/forward", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.id, id));
  if (!doc) { res.status(404).json({ error: "Document not found" }); return; }

  const parsed = validateForwardInput(req.body);
  if ("error" in parsed) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  const { fromUserId, toDepartmentId, toUserId, note, newStatus } = parsed.data;

  await db.insert(documentLogsTable).values({
    documentId: id,
    fromUserId,
    toDepartmentId: toDepartmentId ?? null,
    toUserId: toUserId ?? null,
    action: "forwarded",
    note: note ?? null,
  });

  if (newStatus) {
    await db.update(documentsTable).set({ currentStatus: newStatus }).where(eq(documentsTable.id, id));
  } else {
    await db.update(documentsTable).set({ currentStatus: "forwarded" }).where(eq(documentsTable.id, id));
  }

  const result = await getDocumentWithLogs(id);
  res.json(toJSON(result));
});

export default router;

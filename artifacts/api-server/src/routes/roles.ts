import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, rolesTable } from "@workspace/db";
import { toJSON } from "../lib/serialize";
import {
  CreateRoleBody,
  UpdateRoleBody,
  GetRoleParams,
  UpdateRoleParams,
  DeleteRoleParams,
  ListRolesResponse,
  GetRoleResponse,
  CreateRoleResponse,
  UpdateRoleResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/roles", async (req, res): Promise<void> => {
  const roles = await db.select().from(rolesTable).orderBy(rolesTable.name);
  res.json(ListRolesResponse.parse(toJSON(roles)));
});

router.post("/roles", async (req, res): Promise<void> => {
  const parsed = CreateRoleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [role] = await db.insert(rolesTable).values(parsed.data).returning();
  res.status(201).json(CreateRoleResponse.parse(toJSON(role)));
});

router.get("/roles/:id", async (req, res): Promise<void> => {
  const params = GetRoleParams.safeParse({ id: Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [role] = await db.select().from(rolesTable).where(eq(rolesTable.id, params.data.id));
  if (!role) {
    res.status(404).json({ error: "Role not found" });
    return;
  }
  res.json(GetRoleResponse.parse(toJSON(role)));
});

router.patch("/roles/:id", async (req, res): Promise<void> => {
  const params = UpdateRoleParams.safeParse({ id: Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateRoleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [role] = await db.update(rolesTable).set(parsed.data).where(eq(rolesTable.id, params.data.id)).returning();
  if (!role) {
    res.status(404).json({ error: "Role not found" });
    return;
  }
  res.json(UpdateRoleResponse.parse(toJSON(role)));
});

router.delete("/roles/:id", async (req, res): Promise<void> => {
  const params = DeleteRoleParams.safeParse({ id: Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deleted] = await db.delete(rolesTable).where(eq(rolesTable.id, params.data.id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Role not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;

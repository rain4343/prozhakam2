import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, usersTable, rolesTable, userRolesTable, departmentsTable } from "@workspace/db";
import { toJSON } from "../lib/serialize";
import {
  CreateUserBody,
  UpdateUserBody,
  GetUserParams,
  UpdateUserParams,
  DeleteUserParams,
  ListUsersQueryParams,
  ListUsersResponse,
  GetUserResponse,
  CreateUserResponse,
  UpdateUserResponse,
} from "@workspace/api-zod";
import { createHash } from "crypto";

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
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
  return {
    ...user,
    department: dept ?? null,
    roles: userRoles.map((r) => r.role),
  };
}

const router: IRouter = Router();

router.get("/users", async (req, res): Promise<void> => {
  const queryParams = ListUsersQueryParams.safeParse(req.query);
  if (!queryParams.success) {
    res.status(400).json({ error: queryParams.error.message });
    return;
  }
  const { departmentId, isActive } = queryParams.data;
  const conditions = [];
  if (departmentId != null) conditions.push(eq(usersTable.departmentId, departmentId));
  if (isActive != null) conditions.push(eq(usersTable.isActive, isActive));

  const users = await db.select().from(usersTable).where(conditions.length > 0 ? and(...conditions) : undefined);
  const usersWithRelations = await Promise.all(
    users.map(async (u) => {
      const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, u.departmentId));
      const userRoles = await db
        .select({ role: rolesTable })
        .from(userRolesTable)
        .innerJoin(rolesTable, eq(userRolesTable.roleId, rolesTable.id))
        .where(eq(userRolesTable.userId, u.id));
      return { ...u, department: dept ?? null, roles: userRoles.map((r) => r.role) };
    })
  );
  res.json(ListUsersResponse.parse(toJSON(usersWithRelations)));
});

router.post("/users", async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { roleIds, ...userData } = parsed.data;
  const [user] = await db
    .insert(usersTable)
    .values({ ...userData, password: hashPassword(userData.password) })
    .returning();
  if (roleIds && roleIds.length > 0) {
    await db.insert(userRolesTable).values(roleIds.map((roleId) => ({ userId: user.id, roleId })));
  }
  const result = await getUserWithRelations(user.id);
  res.status(201).json(CreateUserResponse.parse(toJSON(result)));
});

router.get("/users/:id", async (req, res): Promise<void> => {
  const params = GetUserParams.safeParse({ id: Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const user = await getUserWithRelations(params.data.id);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(GetUserResponse.parse(toJSON(user)));
});

router.patch("/users/:id", async (req, res): Promise<void> => {
  const params = UpdateUserParams.safeParse({ id: Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { roleIds, password, ...rest } = parsed.data;
  const updateData: Record<string, unknown> = { ...rest };
  if (password) updateData.password = hashPassword(password);

  const [user] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, params.data.id)).returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  if (roleIds !== undefined) {
    await db.delete(userRolesTable).where(eq(userRolesTable.userId, params.data.id));
    if (roleIds.length > 0) {
      await db.insert(userRolesTable).values(roleIds.map((roleId) => ({ userId: params.data.id, roleId })));
    }
  }
  const result = await getUserWithRelations(user.id);
  res.json(UpdateUserResponse.parse(toJSON(result)));
});

router.delete("/users/:id", async (req, res): Promise<void> => {
  const params = DeleteUserParams.safeParse({ id: Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deleted] = await db.delete(usersTable).where(eq(usersTable.id, params.data.id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;

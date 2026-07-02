import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, assetsTable, departmentsTable } from "@workspace/db";
import { toJSON } from "../lib/serialize";
import {
  CreateAssetBody,
  UpdateAssetBody,
  GetAssetParams,
  UpdateAssetParams,
  DeleteAssetParams,
  ListAssetsQueryParams,
  ListAssetsResponse,
  GetAssetResponse,
  CreateAssetResponse,
  UpdateAssetResponse,
} from "@workspace/api-zod";

async function getAssetWithDepartment(id: number) {
  const [asset] = await db.select().from(assetsTable).where(eq(assetsTable.id, id));
  if (!asset) return null;
  const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, asset.departmentId));
  return { ...asset, department: dept ?? null };
}

const router: IRouter = Router();

router.get("/assets/by-department", async (req, res): Promise<void> => {
  const depts = await db.select().from(departmentsTable).orderBy(departmentsTable.name);
  const result = await Promise.all(
    depts.map(async (dept) => {
      const assets = await db.select().from(assetsTable).where(eq(assetsTable.departmentId, dept.id));
      return { departmentId: dept.id, departmentName: dept.name, count: assets.length };
    })
  );
  res.json(result);
});

router.get("/assets", async (req, res): Promise<void> => {
  const queryParams = ListAssetsQueryParams.safeParse(req.query);
  if (!queryParams.success) {
    res.status(400).json({ error: queryParams.error.message });
    return;
  }
  const { departmentId, status } = queryParams.data;
  const conditions = [];
  if (departmentId != null) conditions.push(eq(assetsTable.departmentId, departmentId));
  if (status != null) conditions.push(eq(assetsTable.status, status));

  const assets = await db
    .select()
    .from(assetsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(assetsTable.createdAt));

  const assetsWithDepts = await Promise.all(
    assets.map(async (a) => {
      const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, a.departmentId));
      return { ...a, department: dept ?? null };
    })
  );
  res.json(ListAssetsResponse.parse(toJSON(assetsWithDepts)));
});

router.post("/assets", async (req, res): Promise<void> => {
  const parsed = CreateAssetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [asset] = await db.insert(assetsTable).values(parsed.data).returning();
  const result = await getAssetWithDepartment(asset.id);
  res.status(201).json(CreateAssetResponse.parse(toJSON(result)));
});

router.get("/assets/:id", async (req, res): Promise<void> => {
  const params = GetAssetParams.safeParse({ id: Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const asset = await getAssetWithDepartment(params.data.id);
  if (!asset) {
    res.status(404).json({ error: "Asset not found" });
    return;
  }
  res.json(GetAssetResponse.parse(toJSON(asset)));
});

router.patch("/assets/:id", async (req, res): Promise<void> => {
  const params = UpdateAssetParams.safeParse({ id: Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateAssetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [asset] = await db.update(assetsTable).set(parsed.data).where(eq(assetsTable.id, params.data.id)).returning();
  if (!asset) {
    res.status(404).json({ error: "Asset not found" });
    return;
  }
  const result = await getAssetWithDepartment(asset.id);
  res.json(UpdateAssetResponse.parse(toJSON(result)));
});

router.delete("/assets/:id", async (req, res): Promise<void> => {
  const params = DeleteAssetParams.safeParse({ id: Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deleted] = await db.delete(assetsTable).where(eq(assetsTable.id, params.data.id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Asset not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;

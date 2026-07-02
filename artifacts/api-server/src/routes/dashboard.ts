import { Router, type IRouter } from "express";
import { count, eq, desc } from "drizzle-orm";
import { db, assetsTable, usersTable, departmentsTable, rolesTable } from "@workspace/db";
import { GetDashboardStatsResponse } from "@workspace/api-zod";
import { toJSON } from "../lib/serialize";

const router: IRouter = Router();

router.get("/dashboard/stats", async (req, res): Promise<void> => {
  const [totalAssetsRow] = await db.select({ count: count() }).from(assetsTable);
  const [totalUsersRow] = await db.select({ count: count() }).from(usersTable);
  const [totalDepartmentsRow] = await db.select({ count: count() }).from(departmentsTable);
  const [totalRolesRow] = await db.select({ count: count() }).from(rolesTable);

  const allAssets = await db.select().from(assetsTable);
  const statusMap: Record<string, number> = {};
  for (const asset of allAssets) {
    statusMap[asset.status] = (statusMap[asset.status] ?? 0) + 1;
  }
  const assetsByStatus = Object.entries(statusMap).map(([status, cnt]) => ({ status, count: cnt }));

  const recentAssetsRaw = await db
    .select()
    .from(assetsTable)
    .orderBy(desc(assetsTable.createdAt))
    .limit(5);

  const recentAssets = await Promise.all(
    recentAssetsRaw.map(async (a) => {
      const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, a.departmentId));
      return { ...a, department: dept ?? null };
    })
  );

  const stats = {
    totalAssets: Number(totalAssetsRow?.count ?? 0),
    totalUsers: Number(totalUsersRow?.count ?? 0),
    totalDepartments: Number(totalDepartmentsRow?.count ?? 0),
    totalRoles: Number(totalRolesRow?.count ?? 0),
    assetsByStatus,
    recentAssets,
  };

  res.json(GetDashboardStatsResponse.parse(toJSON(stats)));
});

export default router;

import { Router, type IRouter } from "express";
import healthRouter from "./health";
import departmentsRouter from "./departments";
import rolesRouter from "./roles";
import usersRouter from "./users";
import assetsRouter from "./assets";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(departmentsRouter);
router.use(rolesRouter);
router.use(usersRouter);
router.use(assetsRouter);
router.use(dashboardRouter);

export default router;

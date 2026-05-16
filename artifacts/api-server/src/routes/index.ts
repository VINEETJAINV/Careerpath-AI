import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profilesRouter from "./profiles";
import assessmentsRouter from "./assessments";
import careersRouter from "./careers";
import openaiRouter from "./openai-routes";

const router: IRouter = Router();

router.use(healthRouter);
router.use(profilesRouter);
router.use(assessmentsRouter);
router.use(careersRouter);
router.use(openaiRouter);

export default router;

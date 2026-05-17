import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import profilesRouter from "./profiles";
import assessmentsRouter from "./assessments";
import careersRouter from "./careers";
import openaiRouter from "./openai-routes";
import communityRouter from "./community";
import socialRouter from "./social";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(profilesRouter);
router.use(assessmentsRouter);
router.use(careersRouter);
router.use(openaiRouter);
router.use(communityRouter);
router.use(socialRouter);

export default router;

import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import foodItemsRouter from "./food-items";
import ordersRouter from "./orders";
import wishlistRouter from "./wishlist";
import shortsRouter from "./shorts";
import ideasRouter from "./ideas";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(foodItemsRouter);
router.use(ordersRouter);
router.use(wishlistRouter);
router.use(shortsRouter);
router.use(ideasRouter);
router.use(statsRouter);

export default router;

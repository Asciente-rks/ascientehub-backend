import { Router } from "express";
import {
  addToCart,
  getCart,
  removeFromCart,
  clearCart,
} from "../controllers/cart.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticateToken);

router.post("/", addToCart);
router.get("/", getCart);
router.delete("/:gameId", removeFromCart);
router.delete("/", clearCart);

export default router;

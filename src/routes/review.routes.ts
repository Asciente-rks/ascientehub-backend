import { Router } from "express";
import {
  addReview,
  getGameReviews,
  deleteReview,
} from "../controllers/review.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", authenticateToken, addReview);
router.get("/game/:gameId", getGameReviews);
router.delete("/:reviewId", authenticateToken, deleteReview);

export default router;

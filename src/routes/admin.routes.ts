import { Router } from "express";
import {
  reviewDevApplication,
  getUserPurchases,
  getPendingGames,
  reviewGame,
} from "../controllers/admin.controller";

const router = Router();

// PATCH /api/admin/review-developer/:userId
router.patch("/review-developer/:userId", reviewDevApplication);

// GET /api/admin/users/:userId/purchases
router.get("/users/:userId/purchases", getUserPurchases);

// GET /api/admin/games/pending
router.get("/games/pending", getPendingGames);

// PATCH /api/admin/games/:gameId/review
router.patch("/games/:gameId/review", reviewGame);

export default router;

import { Router } from "express";
import {
  getPendingDevelopers,
  reviewDevApplication,
  getUserPurchases,
  getPendingGames,
  reviewGame,
} from "../controllers/admin.controller";

const router = Router();

// GET /api/admin/developers/pending
router.get("/developers/pending", getPendingDevelopers);

// PATCH /api/admin/review-developer/:userId
router.patch("/review-developer/:userId", reviewDevApplication);

// GET /api/admin/users/:userId/purchases
router.get("/users/:userId/purchases", getUserPurchases);

// GET /api/admin/games/pending
router.get("/games/pending", getPendingGames);

// PATCH /api/admin/games/:gameId/review
router.patch("/games/:gameId/review", reviewGame);

export default router;

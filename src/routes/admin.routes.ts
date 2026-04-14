import { Router } from "express";
import {
  getPendingDevelopers,
  reviewDevApplication,
  getUserPurchases,
  getPendingGames,
  reviewGame,
  getUsers,
} from "../controllers/admin.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import { authorizeRoles } from "../middlewares/role.middleware";

const router = Router();

// Admin routes require authentication and Admin role
router.use(authenticateToken);
router.use(authorizeRoles("Admin"));

// GET /api/admin/developers/pending
router.get("/developers/pending", getPendingDevelopers);

// GET /api/admin/users -> paginated list
router.get("/users", getUsers);

// PATCH /api/admin/review-developer/:userId
router.patch("/review-developer/:userId", reviewDevApplication);

// GET /api/admin/users/:userId/purchases
router.get("/users/:userId/purchases", getUserPurchases);

// GET /api/admin/games/pending
router.get("/games/pending", getPendingGames);

// PATCH /api/admin/games/:gameId/review
router.patch("/games/:gameId/review", reviewGame);

export default router;

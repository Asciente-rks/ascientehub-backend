import { Router } from "express";
import {
  getMyGames,
  editGame,
  deleteGame,
  getGameAnalytics,
} from "../controllers/developer.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticateToken);

router.get("/games", getMyGames);
router.patch("/games/:gameId", editGame);
router.delete("/games/:gameId", deleteGame);
router.get("/games/:gameId/analytics", getGameAnalytics);

export default router;

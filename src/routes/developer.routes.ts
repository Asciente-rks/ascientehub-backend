import { Router } from "express";
import {
  getMyGames,
  editGame,
  deleteGame,
  getGameAnalytics,
} from "../controllers/developer.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload.middleware";
import { authorizeRoles } from "../middlewares/role.middleware";

const router = Router();

router.use(authenticateToken);
// Only users with Developer or Admin roles can access developer management routes
router.use(authorizeRoles("Developer", "Admin"));

router.get("/games", getMyGames);
// Accept multipart form edits (thumbnail/trailer) from the developer UI
router.patch(
  "/games/:gameId",
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "trailer", maxCount: 1 },
  ]),
  editGame,
);
router.delete("/games/:gameId", deleteGame);
router.get("/games/:gameId/analytics", getGameAnalytics);

export default router;

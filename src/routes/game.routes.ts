import { Router } from "express";
import {
  createGame,
  getGames,
  getGameDetails,
} from "../controllers/game.controller";
import {
  getMyGames,
  editGame,
  deleteGame,
} from "../controllers/developer.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import { authorizeRoles } from "../middlewares/role.middleware";
import { upload } from "../middlewares/upload.middleware";
import { validate } from "../middlewares/validator.middleware";
import { createGameSchema } from "../schemas/game.schema";

const router = Router();

/**
 * Public routes for store
 */
router.get("/", getGames);
router.get("/:id", getGameDetails);

/**
 * Developer routes (authenticated)
 */
// Developer-only endpoints (also allow Admins)
router.get(
  "/dev/my-games",
  authenticateToken,
  authorizeRoles("Developer", "Admin"),
  getMyGames,
);
// Allow file uploads (thumbnail/trailer) when editing a game
router.patch(
  "/:gameId",
  authenticateToken,
  authorizeRoles("Developer", "Admin"),
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "trailer", maxCount: 1 },
  ]),
  editGame,
);
// Accept PUT as an alias for clients that use PUT for updates
router.put("/:gameId", authenticateToken, authorizeRoles("Developer", "Admin"), editGame);
router.delete("/:gameId", authenticateToken, authorizeRoles("Developer", "Admin"), deleteGame);
// Accept PUT as an alias for clients that use PUT for updates (also accept files)
router.put(
  "/:gameId",
  authenticateToken,
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "trailer", maxCount: 1 },
  ]),
  editGame,
);

/**
 * 1. authenticateToken: Ensures the user is logged in.
 * 2. upload.fields: Parses the multipart/form-data (files and text).
 * 3. validate: Checks req.body against our Yup schema.
 * 4. createGame: The final controller logic.
 */
router.post(
  "/",
  authenticateToken,
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "trailer", maxCount: 1 },
  ]),
  validate(createGameSchema),
  createGame,
);

export default router;

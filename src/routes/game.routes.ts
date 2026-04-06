import { Router } from "express";
import {
  createGame,
  getGames,
  getGameDetails,
} from "../controllers/game.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
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

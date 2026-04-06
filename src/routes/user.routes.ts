import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import {
  getProfile,
  updatePassword,
  requestDeletion, // Ensure this matches the controller export name
  confirmDeletion,
} from "../controllers/user.controller";

const router = Router();

// All routes here require a valid JWT
router.use(authenticateToken);

router.get("/profile", getProfile);
router.put("/change-password", updatePassword);
router.post("/request-deletion", requestDeletion); // Fixed naming
router.delete("/confirm-deletion", confirmDeletion);

export default router;

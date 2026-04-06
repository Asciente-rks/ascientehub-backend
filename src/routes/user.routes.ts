import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware";
import {
  getProfile,
  updatePassword,
  requestDeletion,
  confirmDeletion,
  getLibrary,
  getPurchaseHistory,
  updateProfile,
  applyForDeveloper,
} from "../controllers/user.controller";

const router = Router();

router.use(authenticateToken);

router.get("/profile", getProfile);
router.patch("/profile", updateProfile);
router.put("/change-password", updatePassword);
router.post("/request-deletion", requestDeletion);
router.delete("/confirm-deletion", confirmDeletion);
router.get("/library", getLibrary);
router.get("/purchase-history", getPurchaseHistory);
router.post("/apply-developer", applyForDeveloper);

export default router;

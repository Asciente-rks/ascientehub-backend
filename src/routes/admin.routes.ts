import { Router } from "express";
import { reviewDevApplication } from "../controllers/admin.controller";

const router = Router();

// PATCH /api/admin/review-developer/:userId
router.patch("/review-developer/:userId", reviewDevApplication);

export default router;

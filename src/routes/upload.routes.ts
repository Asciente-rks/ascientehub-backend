import { Router } from "express";
import { presignUploads } from "../controllers/upload.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();

// Require authentication to get presigned URLs (ensures only logged-in users can upload)
router.post("/presign", authenticateToken, presignUploads);

export default router;

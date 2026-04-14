import { Router } from "express";
import { presignUploads, proxyObject } from "../controllers/upload.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();

// Require authentication to get presigned URLs (ensures only logged-in users can upload)
router.post("/presign", authenticateToken, presignUploads);
// Proxy public/private objects from R2 through the backend so frontend
// can fetch without DNS issues. Usage: GET /api/uploads/proxy?key=folder%2Ffile.jpg
router.get("/proxy", proxyObject);

export default router;

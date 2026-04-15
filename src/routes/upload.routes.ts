import { Router } from "express";
import {
  presignUploads,
  proxyObject,
  directUpload,
} from "../controllers/upload.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload.middleware";

const router = Router();

// Require authentication to get presigned URLs (ensures only logged-in users can upload)
router.post("/presign", authenticateToken, presignUploads);
// Fallback path for environments where browser->R2 CORS is not configured yet.
router.post("/direct", authenticateToken, upload.single("file"), directUpload);
// Proxy public/private objects from R2 through the backend so frontend
// can fetch without DNS issues. Usage: GET /api/uploads/proxy?key=folder%2Ffile.jpg
router.get("/proxy", proxyObject);

export default router;

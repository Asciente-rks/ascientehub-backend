import { Router } from "express";
import { getRegistrationMetadata } from "../controllers/meta.controller";

const router = Router();

// Endpoint for frontend to populate Role and Category dropdowns
router.get("/registration-data", getRegistrationMetadata);

export default router;

import { Router } from "express";
import { getAllCategories } from "../controllers/category.controller";

const router = Router();

// Public route - No middleware needed
router.get("/", getAllCategories);

export default router;

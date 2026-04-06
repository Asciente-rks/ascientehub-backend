import { Router } from "express";
import {
  createPaymentSource,
  createPayment,
  getPaymentStatus,
  completePayment,
  handlePaymentWebhook,
} from "../controllers/payment.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();

// All payment routes require authentication
router.use(authenticateToken);

// POST /api/payments/sources - Create payment source (tokenize card)
router.post("/sources", createPaymentSource);

// POST /api/payments - Create payment for game purchase
router.post("/", createPayment);

// POST /api/payments/complete - Finalize a succeeded 3DS payment after authorization
router.post("/complete", completePayment);

// GET /api/payments/:paymentId - Get payment status
router.get("/:paymentId", getPaymentStatus);

// POST /api/payments/webhook - Webhook for PayMongo confirmations
router.post("/webhook", handlePaymentWebhook);

export default router;
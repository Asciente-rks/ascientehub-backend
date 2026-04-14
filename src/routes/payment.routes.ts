import { Router } from "express";
import {
  createPaymentSource,
  createPayment,
  checkoutCart,
  getPaymentStatus,
  completePayment,
  listPaymentMethods,
  deletePaymentMethod,
  setDefaultPaymentMethod,
  handlePaymentWebhook,
} from "../controllers/payment.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();

// POST /api/payments/webhook - Webhook for PayMongo confirmations (PUBLIC - no auth needed)
router.post("/webhook", handlePaymentWebhook);

// All payment routes require authentication
router.use(authenticateToken);

// POST /api/payments/sources - Create payment source (tokenize card)
router.post("/sources", createPaymentSource);

// POST /api/payments/checkout - Checkout entire cart (1+ games) at once
router.post("/checkout", checkoutCart);

// POST /api/payments - Create payment for game purchase (single game)
router.post("/", createPayment);

// POST /api/payments/complete - Finalize a succeeded 3DS payment after authorization
router.post("/complete", completePayment);

// GET /api/payments/methods - List saved payment methods for the user
router.get("/methods", listPaymentMethods);

// PUT /api/payments/methods/:methodId/default - Set a saved card as default
router.put("/methods/:methodId/default", setDefaultPaymentMethod);

// DELETE /api/payments/methods/:methodId - Remove a saved payment method
router.delete("/methods/:methodId", deletePaymentMethod);

// GET /api/payments/:paymentId - Get payment status
router.get("/:paymentId", getPaymentStatus);

export default router;

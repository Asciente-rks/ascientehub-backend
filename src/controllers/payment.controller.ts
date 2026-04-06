import { Request, Response } from "express";
import { PaymentService } from "../services/payment.service";
import { TransactionService } from "../services/transaction.service";
import { PaymentMethodService } from "../services/paymentMethod.service";

const paymentService = new PaymentService();
const transactionService = new TransactionService();
const paymentMethodService = new PaymentMethodService();

export const createPaymentSource = async (req: Request, res: Response) => {
  try {
    const { cardNumber, expMonth, expYear, cvc } = req.body;

    if (!cardNumber || !expMonth || !expYear || !cvc) {
      return res.status(400).json({
        message: "Card number, expiry month, expiry year, and CVC are required",
      });
    }

    const paymentMethod = await paymentService.createPaymentMethod({
      number: cardNumber.replace(/\s/g, ""), // Remove spaces
      exp_month: parseInt(expMonth),
      exp_year: parseInt(expYear),
      cvc,
    });

    const savedMethod = await paymentMethodService.savePaymentMethod(
      (req as any).user.id,
      paymentMethod,
    );

    res.status(200).json({
      message: "Payment method created and saved successfully",
      paymentMethod: {
        id: paymentMethod.id,
        type: paymentMethod.attributes.type,
        brand: paymentMethod.attributes?.details?.brand || null,
        last4: paymentMethod.attributes?.details?.last4 || null,
        expMonth: paymentMethod.attributes?.details?.exp_month || null,
        expYear: paymentMethod.attributes?.details?.exp_year || null,
        savedId: savedMethod.id,
      },
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const createPayment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { gameId, paymentMethodId } = req.body;

    if (!gameId) {
      return res.status(400).json({
        message: "Game ID is required",
      });
    }

    let selectedPaymentMethodId = paymentMethodId;
    if (!selectedPaymentMethodId) {
      const savedMethods = await paymentMethodService.listPaymentMethods(userId);
      const defaultMethod = savedMethods.find((method: any) => method.isDefault) || savedMethods[0];
      selectedPaymentMethodId = defaultMethod?.paymongoId;
    }

    if (!selectedPaymentMethodId) {
      return res.status(400).json({
        message:
          "Payment method ID is required. Either provide paymentMethodId or save a card first.",
      });
    }

    // Get game details and check if user already owns it
    const game = await transactionService.getGameForPurchase(gameId);
    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    // Check if user already owns this game
    const alreadyOwns = await transactionService.checkGameOwnership(
      userId,
      gameId,
    );
    if (alreadyOwns) {
      return res.status(400).json({ message: "You already own this game" });
    }

    // Create payment intent
    const paymentIntent = await paymentService.createPaymentIntent(
      game.basePrice,
      paymentMethodId,
      `Purchase: ${game.title}`,
      gameId,
    );

    // Attach payment method and confirm payment
    const confirmedPayment = await paymentService.attachAndConfirmPayment(
      paymentIntent.id,
      paymentMethodId
    );

    // If payment is successful, create transaction record
    if (confirmedPayment.attributes.status === "succeeded") {
      await transactionService.createTransaction(
        userId,
        gameId,
        game.basePrice,
        confirmedPayment.id
      );

      return res.status(200).json({
        message: "Payment successful! Game added to your library.",
        payment: {
          id: confirmedPayment.id,
          status: confirmedPayment.attributes.status,
          amount: confirmedPayment.attributes.amount / 100, // Convert back to PHP
        },
      });
    }

    // If payment requires additional action
    res.status(200).json({
      message: "Payment initiated",
      payment: {
        id: confirmedPayment.id,
        status: confirmedPayment.attributes.status,
        amount: confirmedPayment.attributes.amount / 100,
        next_action: confirmedPayment.attributes.next_action,
      },
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const listPaymentMethods = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const methods = await paymentMethodService.listPaymentMethods(userId);

    res.status(200).json({ paymentMethods: methods });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deletePaymentMethod = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { methodId } = req.params;
    const methodIdStr = Array.isArray(methodId) ? methodId[0] : methodId;

    if (!methodIdStr) {
      return res.status(400).json({ message: "Payment method ID is required" });
    }

    const deleted = await paymentMethodService.deletePaymentMethod(userId, methodIdStr);
    if (!deleted) {
      return res.status(404).json({ message: "Payment method not found" });
    }

    res.status(200).json({ message: "Payment method deleted successfully" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const setDefaultPaymentMethod = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { methodId } = req.params;
    const methodIdStr = Array.isArray(methodId) ? methodId[0] : methodId;

    if (!methodIdStr) {
      return res.status(400).json({ message: "Payment method ID is required" });
    }

    const success = await paymentMethodService.setDefaultPaymentMethod(userId, methodIdStr);
    if (!success) {
      return res.status(404).json({ message: "Payment method not found" });
    }

    res.status(200).json({ message: "Default payment method updated" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getPaymentStatus = async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    const paymentIdStr = Array.isArray(paymentId) ? paymentId[0] : paymentId;

    if (!paymentIdStr) {
      return res.status(400).json({ message: "Payment ID is required" });
    }

    const payment = await paymentService.getPaymentIntent(paymentIdStr);

    res.status(200).json({
      payment: {
        id: payment.id,
        status: payment.attributes.status,
        amount: payment.attributes.amount / 100,
        metadata: payment.attributes.metadata,
        next_action: payment.attributes.next_action,
      },
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const completePayment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { paymentId, gameId } = req.body;

    if (!paymentId) {
      return res.status(400).json({ message: "Payment ID is required" });
    }

    const payment = await paymentService.getPaymentIntent(paymentId);
    const status = payment.attributes.status;

    if (status !== "succeeded") {
      return res.status(400).json({
        message: "Payment has not completed yet",
        status,
        next_action: payment.attributes.next_action,
      });
    }

    const resolvedGameId = gameId || payment.attributes.metadata?.gameId;

    if (!resolvedGameId) {
      return res.status(400).json({
        message:
          "Game ID is required to complete the purchase. Provide it in the request body or include it in payment metadata.",
      });
    }

    const game = await transactionService.getGameForPurchase(resolvedGameId);
    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    const alreadyOwns = await transactionService.checkGameOwnership(
      userId,
      resolvedGameId,
    );
    if (alreadyOwns) {
      return res.status(400).json({ message: "You already own this game" });
    }

    const transaction = await transactionService.createTransaction(
      userId,
      resolvedGameId,
      game.basePrice,
      paymentId,
    );

    res.status(200).json({
      message: "Payment completed and game added to your library.",
      transaction,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Webhook handler for PayMongo payment confirmations
export const handlePaymentWebhook = async (req: Request, res: Response) => {
  try {
    const event = req.body;

    // Verify webhook signature here if needed
    // For now, we'll trust the webhook

    if (event.data && event.data.attributes) {
      const paymentId = event.data.id;
      const status = event.data.attributes.status;

      console.log(`Payment webhook received: ${paymentId} - ${status}`);

      // If payment is now paid, ensure transaction is recorded
      if (status === "paid") {
        // You might want to update transaction status here
        // For now, just log it
      }
    }

    res.status(200).json({ message: "Webhook received" });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    res.status(500).json({ message: "Webhook processing failed" });
  }
};

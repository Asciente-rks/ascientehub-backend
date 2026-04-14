import { Request, Response } from "express";
import { PaymentService } from "../services/payment.service";
import { TransactionService } from "../services/transaction.service";
import { PaymentMethodService } from "../services/paymentMethod.service";
import { CartService } from "../services/cart.service";

const paymentService = new PaymentService();
const transactionService = new TransactionService();
const paymentMethodService = new PaymentMethodService();
const cartService = new CartService();

const shouldUsePortfolioPaymentBypass =
  process.env.PAYMENT_PORTFOLIO_MODE === "true" ||
  process.env.NODE_ENV !== "production";

const createSimulatedPayment = (amount: number) => ({
  id: `sim_${Date.now()}`,
  attributes: {
    status: "succeeded",
    amount: Math.round(Number(amount) * 100),
    next_action: null,
  },
});

const isCardExpired = (method: any) => {
  const expMonth = Number(method?.expMonth);
  const expYear = Number(method?.expYear);

  if (!expMonth || !expYear) {
    return false;
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (expYear < currentYear) {
    return true;
  }

  if (expYear === currentYear && expMonth < currentMonth) {
    return true;
  }

  return false;
};

const getPaymentMethodCandidates = (
  savedMethods: any[],
  requestedMethodId?: string,
) => {
  const methodsByPaymongoId = new Map<string, any>();
  const methodsByDbId = new Map<string, any>();
  for (const method of savedMethods) {
    if (method?.id) {
      methodsByDbId.set(method.id, method);
    }
    if (method?.paymongoId) {
      methodsByPaymongoId.set(method.paymongoId, method);
    }
  }

  const preferred: any[] = [];
  if (requestedMethodId) {
    const byPaymongoId = methodsByPaymongoId.get(requestedMethodId);
    const byDbId = methodsByDbId.get(requestedMethodId);
    const resolvedRequested = byPaymongoId || byDbId;
    if (resolvedRequested) {
      preferred.push(resolvedRequested);
    }
  }

  const defaultMethod = savedMethods.find((method: any) => method.isDefault);
  if (
    defaultMethod?.paymongoId &&
    !preferred.some((method) => method.paymongoId === defaultMethod.paymongoId)
  ) {
    preferred.push(defaultMethod);
  }

  for (const method of savedMethods) {
    if (
      method?.paymongoId &&
      !preferred.some((m) => m.paymongoId === method.paymongoId)
    ) {
      preferred.push(method);
    }
  }

  return preferred;
};

const isExpiredMethodAttachError = (attachError: any) =>
  attachError?.code === "payment_method_not_allowed" &&
  typeof attachError?.detail === "string" &&
  attachError.detail.toLowerCase().includes("expired");

const isReattachMethodError = (attachError: any) =>
  typeof attachError?.detail === "string" &&
  attachError.detail.toLowerCase().includes("cannot be re-attached");

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

    const savedMethods = await paymentMethodService.listPaymentMethods(userId);
    const candidates = getPaymentMethodCandidates(
      savedMethods,
      paymentMethodId,
    );
    const selectedMethod = candidates[0];
    const selectedPaymentMethodId = selectedMethod?.paymongoId;

    if (!selectedPaymentMethodId && !shouldUsePortfolioPaymentBypass) {
      return res.status(400).json({
        message:
          "Payment method ID is required. Either provide paymentMethodId or save a card first.",
      });
    }

    const nonExpiredCandidates = candidates.filter(
      (method: any) => !isCardExpired(method),
    );

    if (nonExpiredCandidates.length === 0 && !shouldUsePortfolioPaymentBypass) {
      return res.status(400).json({
        code: "card_expired",
        message:
          "All saved cards are expired. Please add or select a valid card and try again.",
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

    let confirmedPayment: any = null;
    let lastAttachError: any = null;

    for (const method of nonExpiredCandidates) {
      try {
        const paymentIntent = await paymentService.createPaymentIntent(
          game.basePrice,
          method.paymongoId,
          `Purchase: ${game.title}`,
          gameId,
        );

        confirmedPayment = await paymentService.attachAndConfirmPayment(
          paymentIntent.id,
          method.paymongoId,
        );

        break;
      } catch (attachError: any) {
        lastAttachError = attachError;

        const expiredMethodError = isExpiredMethodAttachError(attachError);
        const nonReusableMethodError = isReattachMethodError(attachError);

        if (expiredMethodError || nonReusableMethodError) {
          continue;
        }

        throw attachError;
      }
    }

    if (!confirmedPayment) {
      if (shouldUsePortfolioPaymentBypass) {
        confirmedPayment = createSimulatedPayment(Number(game.basePrice));
      }

      if (!confirmedPayment) {
        if (isExpiredMethodAttachError(lastAttachError)) {
          return res.status(400).json({
            code: "card_expired",
            message:
              "Selected card is expired. Please add or select a valid card and try again.",
          });
        }

        if (isReattachMethodError(lastAttachError)) {
          return res.status(400).json({
            code: "payment_method_consumed",
            message:
              "Saved card can no longer be reused. Please add a new card and try again.",
          });
        }

        throw lastAttachError || new Error("Payment could not be completed");
      }
    }

    // If payment is successful, create transaction record
    if (confirmedPayment.attributes.status === "succeeded") {
      await transactionService.createTransaction(
        userId,
        gameId,
        game.basePrice,
        confirmedPayment.id,
      );

      return res.status(200).json({
        message: shouldUsePortfolioPaymentBypass
          ? "Payment successful! Game added to your library. (portfolio simulated payment)"
          : "Payment successful! Game added to your library.",
        payment: {
          id: confirmedPayment.id,
          status: confirmedPayment.attributes.status,
          amount: confirmedPayment.attributes.amount / 100, // Convert back to PHP
          simulated:
            shouldUsePortfolioPaymentBypass &&
            confirmedPayment.id.startsWith("sim_"),
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

/**
 * Checkout cart with multiple games - simple and fast
 * Cart has 1+ games -> One payment -> All games added to library
 */
export const checkoutCart = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { paymentMethodId } = req.body;

    // Get cart items
    const cartItems = await cartService.getCart(userId);

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({
        message: "Cart is empty",
      });
    }

    // Get game IDs and prices
    const gameIds = cartItems.map((item: any) => item.gameId);
    const games = cartItems.map((item: any) => item.Game);

    // Validate all games exist
    if (games.some((game: any) => !game)) {
      return res.status(404).json({ message: "One or more games not found" });
    }

    // Check user doesn't already own any games
    for (const gameId of gameIds) {
      const alreadyOwns = await transactionService.checkGameOwnership(
        userId,
        gameId,
      );
      if (alreadyOwns) {
        return res.status(400).json({
          message: `You already own one of the games in your cart`,
        });
      }
    }

    // Calculate total price
    const totalAmount = games.reduce(
      (sum: number, game: any) => sum + parseFloat(game.basePrice),
      0,
    );

    const savedMethods = await paymentMethodService.listPaymentMethods(userId);
    const candidates = getPaymentMethodCandidates(
      savedMethods,
      paymentMethodId,
    );

    if (candidates.length === 0 && !shouldUsePortfolioPaymentBypass) {
      return res.status(400).json({
        message:
          "Payment method ID is required. Either provide paymentMethodId or save a card first.",
      });
    }

    const nonExpiredCandidates = candidates.filter(
      (method: any) => !isCardExpired(method),
    );

    if (nonExpiredCandidates.length === 0 && !shouldUsePortfolioPaymentBypass) {
      return res.status(400).json({
        code: "card_expired",
        message:
          "All saved cards are expired. Please add or select a valid card and try again.",
      });
    }

    // Create single payment intent for all games
    const gameTitle =
      games.length === 1 ? games[0].title : `${games.length} games`;
    let confirmedPayment: any = null;
    let lastAttachError: any = null;

    for (const method of nonExpiredCandidates) {
      try {
        const paymentIntent = await paymentService.createPaymentIntent(
          totalAmount,
          method.paymongoId,
          `Purchase: ${gameTitle}`,
          undefined, // No single gameId since it's multiple
        );

        confirmedPayment = await paymentService.attachAndConfirmPayment(
          paymentIntent.id,
          method.paymongoId,
        );

        break;
      } catch (attachError: any) {
        lastAttachError = attachError;

        const isExpiredMethodError = isExpiredMethodAttachError(attachError);
        const isNonReusableMethodError = isReattachMethodError(attachError);

        if (isExpiredMethodError || isNonReusableMethodError) {
          continue;
        }

        throw attachError;
      }
    }

    if (!confirmedPayment) {
      if (shouldUsePortfolioPaymentBypass) {
        confirmedPayment = createSimulatedPayment(totalAmount);
      }

      if (!confirmedPayment) {
        const isExpiredMethodError =
          isExpiredMethodAttachError(lastAttachError);
        const isNonReusableMethodError = isReattachMethodError(lastAttachError);

        if (isExpiredMethodError) {
          return res.status(400).json({
            code: "card_expired",
            message:
              "Selected card is expired. Please add or select a valid card and try again.",
          });
        }

        if (isNonReusableMethodError) {
          return res.status(400).json({
            code: "payment_method_consumed",
            message:
              "Saved card can no longer be reused. Please add a new card and try again.",
          });
        }

        throw lastAttachError || new Error("Payment could not be completed");
      }
    }

    // If payment is successful, create transactions for ALL games at once
    if (confirmedPayment.attributes.status === "succeeded") {
      await transactionService.createBulkTransactions(
        userId,
        gameIds,
        confirmedPayment.id,
      );

      // Clear the cart
      await cartService.clearCart(userId);

      return res.status(200).json({
        message: shouldUsePortfolioPaymentBypass
          ? `Payment successful! ${games.length} game(s) added to your library. (portfolio simulated payment)`
          : `Payment successful! ${games.length} game(s) added to your library.`,
        payment: {
          id: confirmedPayment.id,
          status: confirmedPayment.attributes.status,
          amount: confirmedPayment.attributes.amount / 100,
          gamesCount: games.length,
          games: games.map((g: any) => ({ id: g.id, title: g.title })),
          simulated:
            shouldUsePortfolioPaymentBypass &&
            confirmedPayment.id.startsWith("sim_"),
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
        gamesCount: games.length,
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

    const methodsWithExpiryInfo = methods.map((method: any) => ({
      ...method.toJSON(),
      isExpired: isCardExpired(method),
    }));

    res.status(200).json({ paymentMethods: methodsWithExpiryInfo });
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

    const deleted = await paymentMethodService.deletePaymentMethod(
      userId,
      methodIdStr,
    );
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

    const success = await paymentMethodService.setDefaultPaymentMethod(
      userId,
      methodIdStr,
    );
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

import axios from "axios";

export class PaymentService {
  private baseUrl = "https://api.paymongo.com/v1";
  private secretKey: string;
  private publicKey: string;

  constructor() {
    // Use test keys for development
    this.secretKey = process.env.PAYMONGO_SECRET_KEY || "";
    this.publicKey = process.env.PAYMONGO_PUBLIC_KEY || "";
  }

  /**
   * Create a payment method (modern PayMongo approach)
   */
  async createPaymentMethod(cardDetails: {
    number: string;
    exp_month: number;
    exp_year: number;
    cvc: string;
  }) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/payment_methods`,
        {
          data: {
            attributes: {
              type: "card",
              details: {
                card_number: cardDetails.number, // PayMongo expects card_number
                exp_month: cardDetails.exp_month,
                exp_year: cardDetails.exp_year,
                cvc: cardDetails.cvc,
              },
            },
          },
        },
        {
          headers: {
            Authorization: `Basic ${Buffer.from(this.secretKey + ":").toString("base64")}`,
            "Content-Type": "application/json",
          },
        },
      );

      return response.data.data;
    } catch (error: any) {
      console.error(
        "PayMongo Payment Method Error:",
        error.response?.data || error.message,
      );
      throw new Error(
        `Payment method creation failed: ${error.response?.data?.errors?.[0]?.detail || error.message}`,
      );
    }
  }

  /**
   * Create a payment intent with payment method (modern approach)
   */
  async createPaymentIntent(
    amount: number,
    paymentMethodId: string,
    description: string,
    gameId?: string,
  ) {
    try {
      const payload: any = {
        data: {
          attributes: {
            amount: amount * 100, // Convert to centavos
            currency: "PHP",
            payment_method_allowed: ["card"],
            payment_method_options: {
              card: {
                request_three_d_secure: "automatic",
              },
            },
            description,
          },
        },
      };

      if (gameId) {
        payload.data.attributes.metadata = { gameId };
      }

      const response = await axios.post(
        `${this.baseUrl}/payment_intents`,
        payload,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(this.secretKey + ":").toString("base64")}`,
            "Content-Type": "application/json",
          },
        },
      );

      return response.data.data;
    } catch (error: any) {
      console.error(
        "PayMongo Payment Intent Error:",
        error.response?.data || error.message,
      );
      throw new Error(
        `Payment intent creation failed: ${error.response?.data?.errors?.[0]?.detail || error.message}`,
      );
    }
  }

  /**
   * Attach payment method and confirm payment
   */
  async attachAndConfirmPayment(
    paymentIntentId: string,
    paymentMethodId: string,
  ) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/payment_intents/${paymentIntentId}/attach`,
        {
          data: {
            attributes: {
              payment_method: paymentMethodId,
            },
          },
        },
        {
          headers: {
            Authorization: `Basic ${Buffer.from(this.secretKey + ":").toString("base64")}`,
            "Content-Type": "application/json",
          },
        },
      );

      return response.data.data;
    } catch (error: any) {
      console.error(
        "PayMongo Attach Error:",
        error.response?.data || error.message,
      );
      throw new Error(
        `Payment confirmation failed: ${error.response?.data?.errors?.[0]?.detail || error.message}`,
      );
    }
  }

  /**
   * Get payment intent status
   */
  async getPaymentIntent(paymentIntentId: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/payment_intents/${paymentIntentId}`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(this.secretKey + ":").toString("base64")}`,
          },
        },
      );

      return response.data.data;
    } catch (error: any) {
      console.error(
        "PayMongo Get Payment Intent Error:",
        error.response?.data || error.message,
      );
      throw new Error(`Failed to get payment intent: ${error.message}`);
    }
  }

  /**
   * Create a payment directly (alternative simpler flow)
   */
  async createPayment(amount: number, sourceId: string, description: string) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/payments`,
        {
          data: {
            attributes: {
              amount: amount * 100, // Convert to centavos
              currency: "PHP",
              description,
              source: {
                id: sourceId,
                type: "source",
              },
            },
          },
        },
        {
          headers: {
            Authorization: `Basic ${Buffer.from(this.secretKey + ":").toString("base64")}`,
            "Content-Type": "application/json",
          },
        },
      );

      return response.data.data;
    } catch (error: any) {
      console.error(
        "PayMongo Payment Creation Error:",
        error.response?.data || error.message,
      );
      throw new Error(
        `Payment creation failed: ${error.response?.data?.errors?.[0]?.detail || error.message}`,
      );
    }
  }
}

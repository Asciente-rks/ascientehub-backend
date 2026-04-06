import { PaymentMethodRepository } from "../repositories/paymentMethod.repository";

const paymentMethodRepo = new PaymentMethodRepository();

export class PaymentMethodService {
  async savePaymentMethod(userId: string, paymentMethod: any) {
    const details = paymentMethod.attributes?.details || {};

    const existingMethods = await paymentMethodRepo.findByUserId(userId);
    const isDefault = existingMethods.length === 0;

    return await paymentMethodRepo.create({
      userId,
      paymongoId: paymentMethod.id,
      type: paymentMethod.attributes?.type || "card",
      brand: details.brand || null,
      last4: details.last4 || null,
      expMonth: details.exp_month || details.expMonth || null,
      expYear: details.exp_year || details.expYear || null,
      isDefault,
    });
  }

  async listPaymentMethods(userId: string) {
    return await paymentMethodRepo.findByUserId(userId);
  }

  async deletePaymentMethod(userId: string, methodId: string) {
    return await paymentMethodRepo.deleteByIdAndUser(methodId, userId);
  }

  async setDefaultPaymentMethod(userId: string, methodId: string) {
    const result = await paymentMethodRepo.setDefault(methodId, userId);
    return result[0] > 0;
  }
}

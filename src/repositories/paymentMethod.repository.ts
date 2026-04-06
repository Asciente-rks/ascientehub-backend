import PaymentMethod from "../models/PaymentMethod";

export class PaymentMethodRepository {
  async create(data: any) {
    return await PaymentMethod.create(data);
  }

  async findByUserId(userId: string) {
    return await PaymentMethod.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });
  }

  async findByIdAndUser(id: string, userId: string) {
    return await PaymentMethod.findOne({
      where: { id, userId },
    });
  }

  async deleteByIdAndUser(id: string, userId: string) {
    const method = await this.findByIdAndUser(id, userId);
    if (!method) return null;
    await method.destroy();
    return method;
  }

  async clearDefaultForUser(userId: string) {
    await PaymentMethod.update(
      { isDefault: false },
      { where: { userId } },
    );
  }

  async setDefault(id: string, userId: string) {
    await this.clearDefaultForUser(userId);
    return await PaymentMethod.update(
      { isDefault: true },
      { where: { id, userId } },
    );
  }
}

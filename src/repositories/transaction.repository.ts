import Transaction from "../models/Transaction";
import Game from "../models/Game";

export class TransactionRepository {
  async create(data: any) {
    return await Transaction.create(data);
  }

  async findByUserId(userId: string) {
    return await Transaction.findAll({
      where: { userId },
      include: [{ model: Game }],
      order: [["createdAt", "DESC"]],
    });
  }

  async findById(id: string) {
    return await Transaction.findByPk(id, {
      include: [{ model: Game }],
    });
  }
}
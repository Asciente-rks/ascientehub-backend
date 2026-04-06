import User from "../models/User";
import Library from "../models/Library";
import Transaction from "../models/Transaction";
import Game from "../models/Game";

export class UserRepository {
  async findById(id: string) {
    return await User.findByPk(id);
  }

  async updateUser(id: string, data: any) {
    return await User.update(data, { where: { id } });
  }

  async deleteUser(id: string) {
    return await User.destroy({ where: { id } });
  }

  async getLibrary(userId: string) {
    return await Library.findAll({
      where: { userId },
      include: [{ model: Game }],
      order: [["purchaseDate", "DESC"]],
    });
  }

  async getPurchaseHistory(userId: string) {
    return await Transaction.findAll({
      where: { userId },
      include: [{ model: Game }],
      order: [["createdAt", "DESC"]],
    });
  }
}

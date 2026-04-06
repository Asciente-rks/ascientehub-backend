import User from "../models/User";
import Role from "../models/Role";
import Game from "../models/Game";
import Transaction from "../models/Transaction";

export class AdminRepository {
  /**
   * Logic: Find all users where status is pending,
   * but ONLY if their role is 'Developer'.
   */
  async findPendingDevelopers() {
    return await User.findAll({
      where: { status: "pending" },
      include: [
        {
          model: Role,
          as: "Role",
          where: { name: "Developer" },
        },
        {
          model: Game,
          as: "Games", // Assuming 'Games' is the alias in your associations
        },
      ],
      attributes: ["id", "username", "email", "status", "createdAt"],
    });
  }

  async findUserById(id: string) {
    return await User.findByPk(id, {
      include: [{ model: Role, as: "Role" }],
    });
  }

  async updateUserStatus(id: string, updateData: any) {
    return await User.update(updateData, {
      where: { id },
    });
  }

  async getUserPurchases(userId: string) {
    return await Transaction.findAll({
      where: { userId },
      include: [{ model: Game }],
      order: [["createdAt", "DESC"]],
    });
  }

  async getPendingGames() {
    return await Game.findAll({
      where: { status: "pending" },
      include: [{ model: User, as: "developer" }],
    });
  }

  async updateGameStatus(gameId: string, status: string, reason?: string) {
    const updateData: any = { status };
    if (reason) updateData.rejectionReason = reason;
    return await Game.update(updateData, { where: { id: gameId } });
  }
}

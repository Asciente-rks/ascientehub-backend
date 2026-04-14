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
    // Return all users with a pending status so admins can review applications
    // submitted either at registration or via the apply-for-developer flow.
    return await User.findAll({
      where: { status: "pending" },
      include: [
        {
          model: Role,
          as: "Role",
          // Do not filter by role name here — applicants may still have the
          // 'User' role when they request a developer application.
        },
        {
          model: Game,
          as: "developerGames", // Use the alias defined in associations.ts
        },
      ],
      attributes: ["id", "username", "email", "status", "createdAt"],
    });
  }

  /**
   * Paginated user list for Admin UI.
   * Supports query options: offset, limit, sort (e.g. 'role:asc' or 'createdAt:desc').
   */
  async findUsers(options: {
    offset?: number;
    limit?: number;
    sort?: string;
    includePurchases?: boolean;
  }) {
    const offset = options.offset || 0;
    const limit = options.limit || 10;
    const sort = options.sort || "createdAt:desc";

    // Build Sequelize order array
    const order: any[] = [];
    const parts = sort.split(",").map((s) => s.trim()).filter(Boolean);
    for (const p of parts) {
      const [field, dir = "asc"] = p.split(":");
      const direction = dir.toUpperCase() === "DESC" ? "DESC" : "ASC";
      if (field === "role") {
        // Order by associated Role.name
        order.push([{ model: Role, as: "Role" }, "name", direction]);
      } else if (["username", "email", "status", "createdAt"].includes(field)) {
        order.push([field, direction]);
      } else {
        // Fallback
        order.push(["createdAt", "DESC"]);
      }
    }

    const includeArr: any[] = [
      {
        model: Role,
        as: "Role",
        attributes: ["id", "name"],
      },
    ];

    if (options.includePurchases) {
      includeArr.push({
        model: Transaction,
        attributes: ["id", "amount", "gameId", "createdAt"],
        include: [{ model: Game }],
      });
    }

    return await User.findAndCountAll({
      offset,
      limit,
      order,
      include: includeArr,
      attributes: ["id", "username", "email", "roleId", "status", "createdAt"],
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

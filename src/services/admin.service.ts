import { AdminRepository } from "../repositories/admin.repository";
import { ROLES } from "../config/constants";

const adminRepo = new AdminRepository();

export class AdminService {
  // This is what your Controller calls
  async getDeveloperApplications() {
    return await adminRepo.findPendingDevelopers();
  }

  async getUsers(opts: { page?: number; limit?: number; sort?: string; include?: string }) {
    const page = opts.page && opts.page > 0 ? opts.page : 1;
    const limit = opts.limit && opts.limit > 0 ? opts.limit : 10;
    const offset = (page - 1) * limit;
    const sort = opts.sort || "createdAt:desc";

    const includePurchases = Boolean(
      opts.include && String(opts.include).split(",").map((s) => s.trim()).includes("purchases"),
    );

    const { rows, count } = await adminRepo.findUsers({ offset, limit, sort, includePurchases });

    return {
      users: rows,
      meta: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit),
      },
    };
  }

  async reviewDeveloperApplication(
    userId: string,
    decision: "accept" | "reject",
    reason?: string,
  ) {
    const user = await adminRepo.findUserById(userId);
    if (!user) throw new Error("User not found");

    if (decision === "accept") {
      // When accepting a developer application, set the user's role to Developer
      // and activate the account.
      return await adminRepo.updateUserStatus(userId, {
        status: "active",
        rejectionReason: null,
        canReapplyAt: null,
        roleId: ROLES.DEVELOPER,
      });
    }

    // Rejection Logic
    const cooldown = new Date();
    cooldown.setDate(cooldown.getDate() + 30);

    return await adminRepo.updateUserStatus(userId, {
      status: "rejected",
      rejectionReason: reason || "Criteria not met.",
      canReapplyAt: cooldown,
    });
  }

  async getUserPurchases(userId: string) {
    return await adminRepo.getUserPurchases(userId);
  }

  async getPendingGames() {
    return await adminRepo.getPendingGames();
  }

  async reviewGame(gameId: string, action: string, reason?: string) {
    if (action === "approve") {
      return await adminRepo.updateGameStatus(gameId, "approved");
    } else if (action === "reject") {
      return await adminRepo.updateGameStatus(gameId, "rejected", reason);
    } else {
      throw new Error("Invalid action");
    }
  }
}

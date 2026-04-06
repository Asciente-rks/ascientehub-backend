import { AdminRepository } from "../repositories/admin.repository";

const adminRepo = new AdminRepository();

export class AdminService {
  // This is what your Controller calls
  async getDeveloperApplications() {
    return await adminRepo.findPendingDevelopers();
  }

  async reviewDeveloperApplication(
    userId: string,
    decision: "accept" | "reject",
    reason?: string,
  ) {
    const user = await adminRepo.findUserById(userId);
    if (!user) throw new Error("User not found");

    if (decision === "accept") {
      return await adminRepo.updateUserStatus(userId, {
        status: "active",
        rejectionReason: null,
        canReapplyAt: null,
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

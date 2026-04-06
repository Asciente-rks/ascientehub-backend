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
}

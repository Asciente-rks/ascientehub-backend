import { Request, Response } from "express";
import { AdminService } from "../services/admin.service";

const adminService = new AdminService();

export const getPendingDevelopers = async (req: Request, res: Response) => {
  try {
    const pendingDevs = await adminService.getDeveloperApplications();
    res.status(200).json(pendingDevs);
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to fetch pending developers",
      error: error.message,
    });
  }
};

export const reviewDevApplication = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const { action, reason } = req.body;

    // 1. Strict Validation: Check if action is valid
    const validActions = ["approve", "reject"];

    if (!userId || !action) {
      return res.status(400).json({
        message: "userId and action are required.",
      });
    }

    if (!validActions.includes(action)) {
      return res.status(400).json({
        message: `Invalid action. Please use 'approve' or 'reject'. You sent: '${action}'`,
      });
    }

    // 2. Map strictly to what the service expects
    const decision = action === "approve" ? "accept" : "reject";

    const result = await adminService.reviewDeveloperApplication(
      userId,
      decision,
      reason,
    );

    res.status(200).json({
      message: `Developer ${action === "approve" ? "approved" : "rejected"} successfully.`,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

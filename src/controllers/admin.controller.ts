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
export const getUserPurchases = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params as { userId: string };
    const purchases = await adminService.getUserPurchases(userId);
    res.status(200).json(purchases);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getPendingGames = async (req: Request, res: Response) => {
  try {
    const pendingGames = await adminService.getPendingGames();
    res.status(200).json(pendingGames);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const reviewGame = async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params as { gameId: string };
    const { action, reason } = req.body;
    const result = await adminService.reviewGame(gameId, action, reason);
    res
      .status(200)
      .json({ message: `Game ${action}d successfully.`, data: result });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const sort = (req.query.sort as string) || "createdAt:desc";
    const include = (req.query.include as string) || undefined;

    const data = await adminService.getUsers({ page, limit, sort, include });
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

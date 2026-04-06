import { Request, Response } from "express";
import { UserService } from "../services/user.service";

const userService = new UserService();

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const user = await userService.getUserProfile(userId);
    res.status(200).json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updatePassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { oldPass, newPass } = req.body;
    await userService.changePassword(userId, oldPass, newPass);
    res.status(200).json({ message: "Password updated successfully." });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const requestDeletion = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    await userService.requestDeletion(userId);
    res
      .status(200)
      .json({ message: "OTP sent to email for account deletion." });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const confirmDeletion = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { code } = req.body;
    await userService.confirmDeletion(userId, code);
    res.status(200).json({ message: "Account deleted successfully." });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

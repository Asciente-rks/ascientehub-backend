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

export const getLibrary = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const library = await userService.getLibrary(userId);
    res.status(200).json(library);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getPurchaseHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const history = await userService.getPurchaseHistory(userId);
    res.status(200).json(history);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { username, avatarUrl } = req.body;
    const updated = await userService.updateProfile(userId, {
      username,
      avatarUrl,
    });
    res.status(200).json({ message: "Profile updated", user: updated });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const applyForDeveloper = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const result = await userService.applyForDeveloper(userId);
    res
      .status(200)
      .json({ message: "Developer application submitted", user: result });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

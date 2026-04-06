import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { ROLES } from "../config/constants"; // Import your UUID constants

const authService = new AuthService();

export const register = async (req: Request, res: Response) => {
  try {
    const user = await authService.register(req.body);

    res.status(201).json({
      message: "Registration successful. Please check your email for the OTP.",
      userId: user.id,
      status: user.status,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    // 1. Get the User object from the service
    const user = await authService.verifyOtp(email, code);

    // 2. Compare the UUID directly using the ROLES constant
    if (user.roleId === ROLES.DEVELOPER) {
      return res.status(200).json({
        message:
          "Email verified successfully! Your developer application is now under review. Please allow 1-3 business days for approval.",
        status: user.status,
      });
    }

    // Default for Buyers
    res.status(200).json({
      message:
        "Email verified successfully! You can now log in to your account.",
      status: user.status,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await authService.login(email, password);
    
    res.status(200).json({
      message: "Login successful!",
      token,
      user: mapToUserDTO(user), // Filters out sensitive info
    });
  } catch (error: any) {
    // 401 is more appropriate for login failures than 500
    res.status(401).json({ message: error.message });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    await authService.forgotPassword(email);
    res.status(200).json({
      message: "If an account exists, a reset code has been sent.",
    });
  } catch (error: any) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, code, newPassword } = req.body;
    await authService.resetPassword(email, code, newPassword);
    res.status(200).json({
      message: "Password reset successful! You can now log in.",
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const logout = async (req: Request, res: Response) => {
  res.status(200).json({
    message: "Logged out successfully. Please clear your tokens.",
  });
};

export const mapToUserDTO = (user: any) => {
  const userData = user.get ? user.get({ plain: true }) : user;
  
  return {
    id: userData.id,
    name: userData.name,
    email: userData.email,
    role: userData.role?.name || userData.role, // Handle if it's an object or a string
    status: userData.status
  };
};
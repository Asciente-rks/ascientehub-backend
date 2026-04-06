import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";

export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user;

    // 1. Check if user exists (should be handled by authenticateToken, but safe to check)
    if (!user) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No session found." });
    }

    // 2. Pure logic check: Does the roleName from the JWT match the allowed list?
    if (!user.roleName || !allowedRoles.includes(user.roleName)) {
      return res.status(403).json({
        message: `Forbidden: This action requires ${allowedRoles.join(" or ")} permissions.`,
      });
    }

    next();
  };
};

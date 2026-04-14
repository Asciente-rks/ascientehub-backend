import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import { ROLES } from "../config/constants";

export const authorizeRoles = (...allowedRoles: string[]) => {
  const allowedLower = allowedRoles.map((r) => String(r).toLowerCase());

  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user;

    // 1. Check if user exists (should be handled by authenticateToken, but safe to check)
    if (!user) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No session found." });
    }

    // 2. If roleName exists, perform case-insensitive match
    if (user.roleName && allowedLower.includes(String(user.roleName).toLowerCase())) {
      return next();
    }

    // 3. As a fallback, allow matching by roleId using the ROLES map (supports older tokens)
    if (user.roleId) {
      const matches = allowedRoles.some((r) => {
        const key = String(r).toUpperCase() === "BUYER" ? "USER" : String(r).toUpperCase();
        return (ROLES as any)[key] && (ROLES as any)[key] === user.roleId;
      });
      if (matches) return next();
    }

    return res.status(403).json({
      message: `Forbidden: This action requires ${allowedRoles.join(" or ")} permissions.`,
    });
  };
};

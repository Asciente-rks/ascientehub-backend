import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// 1. Update the Interface to include roleName
export interface AuthRequest extends Request {
  user?: {
    id: string;
    roleId: string;
    roleName: string; // Added this
  };
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token not found" });
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }

    // 2. Attach the full decoded payload (id, roleId, roleName)
    req.user = {
      id: decoded.id,
      roleId: decoded.roleId,
      roleName: decoded.roleName, // This must be in your JWT payload from login
    };

    next();
  });
};

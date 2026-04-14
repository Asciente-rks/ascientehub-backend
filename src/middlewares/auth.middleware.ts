import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import Role from "../models/Role";

// 1. Update the Interface to include roleName
export interface AuthRequest extends Request {
  user?: {
    id: string;
    roleId: string;
    roleName?: string | null; // Optional because older tokens may not include it
  };
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token not found" });
  }

  jwt.verify(token, process.env.JWT_SECRET!, async (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }

    // Attach id and roleId always. If roleName is missing, attempt a DB lookup.
    const id = decoded.id;
    const roleId = decoded.roleId;
    let roleName = decoded.roleName;

    if (!roleName && roleId) {
      try {
        const role = await Role.findByPk(roleId);
        roleName = role ? (role.get ? role.get({ plain: true }).name : role.name) : null;
      } catch (e) {
        // ignore lookup failures; roleName will remain undefined/null
        console.error("Failed to load role name during auth middleware:", e);
      }
    }

    req.user = {
      id,
      roleId,
      roleName,
    };

    next();
  });
};

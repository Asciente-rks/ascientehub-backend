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
  const normalizeTokenCandidate = (value: unknown) => {
    if (typeof value !== "string") {
      return "";
    }

    let token = value.trim();
    if (!token) {
      return "";
    }

    // Some clients send quoted token values.
    token = token
      .replace(/^"+|"+$/g, "")
      .replace(/^'+|'+$/g, "")
      .trim();

    // Handle any case-variant of Bearer prefix and repeated prefixes.
    while (/^bearer\s+/i.test(token)) {
      token = token.replace(/^bearer\s+/i, "").trim();
    }

    // Some proxies combine header values with commas.
    if (token.includes(",")) {
      token = token.split(",")[0].trim();
    }

    // Decode URL-encoded token when needed.
    try {
      token = decodeURIComponent(token);
    } catch {
      // Keep original token if decode fails.
    }

    const lower = token.toLowerCase();
    if (
      !token ||
      lower === "null" ||
      lower === "undefined" ||
      lower === "nan" ||
      lower === "[object object]"
    ) {
      return "";
    }

    return token;
  };

  const authHeader = req.headers["authorization"];
  const xAccessToken = req.headers["x-access-token"];
  const tokenHeader = req.headers["token"];
  const xAuthTokenHeader = req.headers["x-auth-token"];
  const authTokenHeader = req.headers["auth-token"];

  // Accept both "Bearer <token>" and raw token formats,
  // and support common fallback locations used by some clients.
  const normalizedAuthHeader = Array.isArray(authHeader)
    ? authHeader[0]
    : authHeader;

  const headerToken = normalizeTokenCandidate(normalizedAuthHeader);

  const fallbackHeaderTokenRaw = Array.isArray(xAccessToken)
    ? xAccessToken[0]
    : xAccessToken || "";
  const fallbackHeaderToken = normalizeTokenCandidate(fallbackHeaderTokenRaw);

  const plainTokenHeaderRaw = Array.isArray(tokenHeader)
    ? tokenHeader[0]
    : tokenHeader || "";
  const plainTokenHeader = normalizeTokenCandidate(plainTokenHeaderRaw);

  const xAuthTokenRaw = Array.isArray(xAuthTokenHeader)
    ? xAuthTokenHeader[0]
    : xAuthTokenHeader || "";
  const xAuthToken = normalizeTokenCandidate(xAuthTokenRaw);

  const authTokenRaw = Array.isArray(authTokenHeader)
    ? authTokenHeader[0]
    : authTokenHeader || "";
  const authToken = normalizeTokenCandidate(authTokenRaw);

  const bodyTokenRaw =
    typeof req.body?.token === "string"
      ? req.body.token
      : typeof req.body?.accessToken === "string"
        ? req.body.accessToken
        : typeof req.body?.authToken === "string"
          ? req.body.authToken
          : "";
  const bodyToken = normalizeTokenCandidate(bodyTokenRaw);

  const queryTokenRaw =
    typeof req.query?.token === "string" ? req.query.token : "";
  const queryToken = normalizeTokenCandidate(queryTokenRaw);

  // Cookie fallback without requiring cookie-parser middleware.
  const cookieHeader = req.headers["cookie"];
  const cookieString = Array.isArray(cookieHeader)
    ? cookieHeader.join(";")
    : cookieHeader || "";

  const cookieTokenMatch = cookieString.match(
    /(?:^|;\s*)(accessToken|token|authToken)=([^;]+)/,
  );
  const cookieTokenRaw = cookieTokenMatch ? cookieTokenMatch[2] : "";
  const cookieToken = normalizeTokenCandidate(cookieTokenRaw);

  const token =
    headerToken ||
    fallbackHeaderToken ||
    plainTokenHeader ||
    xAuthToken ||
    authToken ||
    bodyToken ||
    queryToken ||
    cookieToken;

  if (!token) {
    return res
      .status(401)
      .json({ code: "auth_token_missing", message: "Access token not found" });
  }

  jwt.verify(token, process.env.JWT_SECRET!, async (err: any, decoded: any) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ code: "auth_token_expired", message: "Token expired" });
      }

      return res
        .status(403)
        .json({ code: "auth_token_invalid", message: "Invalid token" });
    }

    // Attach id and roleId always. If roleName is missing, attempt a DB lookup.
    const id = decoded.id;
    const roleId = decoded.roleId;
    let roleName = decoded.roleName;

    if (!roleName && roleId) {
      try {
        const role = await Role.findByPk(roleId);
        roleName = role
          ? role.get
            ? role.get({ plain: true }).name
            : role.name
          : null;
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

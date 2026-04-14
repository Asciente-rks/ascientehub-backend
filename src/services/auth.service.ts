import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { AuthRepository } from "../repositories/auth.repository";
import { OtpRepository } from "../repositories/otp.repository";
import { RoleRepository } from "../repositories/role.repository";
import { GameService } from "./game.service";
import { sendOtpEmail } from "../utils/mailer";
import sequelizeConnection from "../config/db.config";
import { ROLES } from "../config/constants";

const authRepo = new AuthRepository();
const otpRepo = new OtpRepository();
const roleRepo = new RoleRepository();
const gameService = new GameService();

export class AuthService {
  async register(data: any): Promise<User> {
    const { username, email, password, roleId, gameData } = data;

    const role = await roleRepo.findById(roleId);
    if (!role) throw new Error("Invalid Role ID.");

    const existing = await authRepo.findUserByEmailOrUsername(email, username);
    if (existing) throw new Error("Username or Email already exists.");

    const isDeveloper = roleId === ROLES.DEVELOPER;

    if (isDeveloper && !gameData) {
      throw new Error("Developers must upload at least one game for approval.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const transaction = await sequelizeConnection.transaction();

    try {
      const newUser = (await authRepo.createUser(
        {
          username,
          email,
          password: hashedPassword,
          roleId: roleId,
          isVerified: false,
          status: isDeveloper ? "pending" : "active",
        },
        { transaction },
      )) as User;

      if (isDeveloper && gameData) {
        await gameService.createGame(
          gameData,
          newUser.id,
          { thumbnail: {} as any },
          { transaction },
        );
      }

      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      await otpRepo.create(
        {
          email,
          code: otpCode,
          type: "verification",
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
        { transaction },
      );

      // --- MOVE COMMIT TO THE BOTTOM ---
      await sendOtpEmail(email, otpCode); // Send email first
      await transaction.commit(); // Only commit if email sent successfully

      return newUser;
    } catch (error: any) {
      // Check if transaction exists and hasn't been finished before rolling back
      if (transaction) await transaction.rollback();
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  async verifyOtp(email: string, code: string): Promise<User> {
    const otpRecord = await otpRepo.findValidOtp(email, code, "verification");
    if (!otpRecord) throw new Error("Invalid or expired OTP.");

    const user = await authRepo.findUserByEmail(email);
    if (!user) throw new Error("User not found.");

    await authRepo.updateUser(user.id, { isVerified: true });
    await otpRepo.delete(email, "verification");

    return user;
  }

  async login(usernameOrEmail: string, pass: string) {
    if (!usernameOrEmail || !pass) {
      throw new Error("Username/email and password are required.");
    }

    const user = (await authRepo.findByUsernameOrEmail(usernameOrEmail)) as any;
    if (!user || !user.password)
      throw new Error("Invalid username/email or password.");
    if (!user.isVerified) throw new Error("Account not verified.");

    // FIXED: Changed ROLE to ROLES
    if (user.roleId === ROLES.DEVELOPER) {
      if (user.status === "pending")
        throw new Error("Application under review.");
      if (user.status === "rejected")
        throw new Error(`Rejected: ${user.rejectionReason}`);
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) throw new Error("Invalid username/email or password.");

    const token = jwt.sign(
      {
        id: user.id,
        roleId: user.roleId,
        // Include roleName in the token so downstream middleware and clients can
        // make UI decisions without an extra DB lookup.
        roleName: user.Role?.name || (await roleRepo.findById(user.roleId))?.name || null,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" },
    );

    console.log("[DEBUG] Retrieved User:", user);
    console.log("[DEBUG] Generated Token:", token);

    return { user, token };
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await authRepo.findUserByEmail(email);
    if (!user) return;

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    await otpRepo.create({
      email,
      code: otpCode,
      type: "password_reset",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    await sendOtpEmail(email, otpCode);
  }

  async resetPassword(
    email: string,
    code: string,
    newPass: string,
  ): Promise<void> {
    const otpRecord = await otpRepo.findValidOtp(email, code, "password_reset");
    if (!otpRecord) throw new Error("Invalid or expired reset code.");

    const user = await authRepo.findUserByEmail(email);
    if (!user) throw new Error("User not found.");

    const hashedNewPassword = await bcrypt.hash(newPass, 10);
    await authRepo.updateUser(user.id, { password: hashedNewPassword });
    await otpRepo.delete(email, "password_reset");
  }
}

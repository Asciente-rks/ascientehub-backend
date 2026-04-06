import bcrypt from "bcrypt";
import { UserRepository } from "../repositories/user.repository";
import { OtpRepository } from "../repositories/otp.repository";
import { sendOtpEmail } from "../utils/mailer";

const userRepo = new UserRepository();
const otpRepo = new OtpRepository();

export class UserService {
  // 1. Get Profile
  async getUserProfile(userId: string) {
    const user = await userRepo.findById(userId);
    if (!user) throw new Error("User not found");
    return user;
  }

  // 2. Change Password
  async changePassword(userId: string, oldPass: string, newPass: string) {
    const user = await userRepo.findById(userId);
    if (!user || !user.password) throw new Error("Local password not found.");

    const isMatch = await bcrypt.compare(oldPass, user.password);
    if (!isMatch) throw new Error("Current password is incorrect.");

    const hashedNewPassword = await bcrypt.hash(newPass, 10);
    return await userRepo.updateUser(userId, { password: hashedNewPassword });
  }

  // 3. Request Deletion
  async requestDeletion(userId: string) {
    const user = await userRepo.findById(userId);
    if (!user) throw new Error("User not found");

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    await otpRepo.create({
      email: user.email,
      code: otpCode,
      type: "account_deletion",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    await sendOtpEmail(user.email, otpCode);
  }

  // 4. Confirm Deletion
  async confirmDeletion(userId: string, code: string) {
    const user = await userRepo.findById(userId);
    if (!user) throw new Error("User not found");

    const otp = await otpRepo.findValidOtp(
      user.email,
      code,
      "account_deletion",
    );
    if (!otp) throw new Error("Invalid or expired code.");

    await userRepo.deleteUser(userId);
    await otpRepo.delete(user.email, "account_deletion");
  }
  async getLibrary(userId: string) {
    return await userRepo.getLibrary(userId);
  }

  async getPurchaseHistory(userId: string) {
    return await userRepo.getPurchaseHistory(userId);
  }
}

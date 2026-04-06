import Otp from "../models/Otp";

export class OtpRepository {
  async create(data: any, options?: any) {
    return await Otp.create(data, options);
  }

  async findValidOtp(email: string, code: string, type: string) {
    return await Otp.findOne({ where: { email, code, type } });
  }

  async delete(email: string, type: string) {
    return await Otp.destroy({ where: { email, type } });
  }
}

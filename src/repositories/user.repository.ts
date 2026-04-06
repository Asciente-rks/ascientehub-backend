import User from "../models/User";

export class UserRepository {
  async findById(id: string) {
    return await User.findByPk(id);
  }

  async updateUser(id: string, data: any) {
    return await User.update(data, { where: { id } });
  }

  async deleteUser(id: string) {
    return await User.destroy({ where: { id } });
  }
}

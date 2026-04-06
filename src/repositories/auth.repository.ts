import { Op } from "sequelize";
import User from "../models/User";
import Role from "../models/Role";

export class AuthRepository {
  /**
   * Finds a user by email and includes the Role model.
   * Note: No transaction usually needed for simple reads.
   */
  async findUserByEmail(email: string) {
    return await User.findOne({
      where: { email },
      include: [
        {
          model: Role,
          as: "Role", // Ensure this matches: User.belongsTo(Role, { as: 'Role' })
        },
      ],
    });
  }

  /**
   * Checks for existing credentials during registration.
   */
  async findUserByEmailOrUsername(email: string, username: string) {
    return await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }],
      },
    });
  }

  /**
   * Login: Find user by username or email
   */
  async findByUsernameOrEmail(usernameOrEmail: string) {
    return await User.findOne({
      where: {
        [Op.or]: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
      },
      include: [
        {
          model: Role,
          as: "Role",
        },
      ],
    });
  }

  /**
   * Standardized Create method.
   * ADDED: options?: any to handle { transaction } from Service.
   */
  async createUser(data: any, options?: any) {
    return await User.create(data, options);
  }

  /**
   * Standardized Update method.
   * ADDED: options?: any to handle { transaction } if needed.
   */
  async updateUser(id: string, data: any, options?: any) {
    return await User.update(data, {
      where: { id },
      ...options, // This spreads the transaction into the update call
    });
  }
}

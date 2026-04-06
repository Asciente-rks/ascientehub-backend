import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../config/db.config";

interface UserAttributes {
  id: string;
  username: string;
  email: string;
  password?: string;
  roleId: string;
  isVerified: boolean;
  isBanned: boolean;
  avatarUrl?: string;
  provider: "local" | "google";
  // --- NEW FIELDS FOR DEV WORKFLOW ---
  status: "active" | "pending" | "rejected";
  rejectionReason?: string;
  canReapplyAt?: Date;
  // ------------------------------------
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserInput extends Optional<
  UserAttributes,
  "id" | "isVerified" | "isBanned" | "provider" | "status"
> {}

class User extends Model<UserAttributes, UserInput> implements UserAttributes {
  declare id: string;
  declare username: string;
  declare email: string;
  declare password?: string;
  declare roleId: string;
  declare isVerified: boolean;
  declare isBanned: boolean;
  declare avatarUrl?: string;
  declare provider: "local" | "google";

  // --- NEW DECLARATIONS ---
  declare status: "active" | "pending" | "rejected";
  declare rejectionReason?: string;
  declare canReapplyAt?: Date;

  declare readonly Role?: any;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    roleId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isBanned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    avatarUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    provider: {
      type: DataTypes.ENUM("local", "google"),
      defaultValue: "local",
      allowNull: false,
    },
    // --- NEW DATABASE COLUMNS ---
    status: {
      type: DataTypes.ENUM("active", "pending", "rejected"),
      defaultValue: "active",
      allowNull: false,
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    canReapplyAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize: sequelizeConnection,
    tableName: "users",
    timestamps: true,
  },
);

export default User;

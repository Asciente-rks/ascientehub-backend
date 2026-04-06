import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../config/db.config";

interface OtpAttributes {
  id: string; // Changed to string for UUID
  email: string;
  code: string;
  type: "verification" | "password_reset" | "account_deletion";
  expiresAt: Date;
}

// Defining CreationAttributes for better TS support
export interface OtpInput extends Optional<OtpAttributes, "id"> {}

class Otp extends Model<OtpAttributes, OtpInput> implements OtpAttributes {
  declare id: string;
  declare email: string;
  declare code: string;
  declare type: "verification" | "password_reset" | "account_deletion";
  declare expiresAt: Date;

  // Timestamps (helpful for debugging if an email wasn't sent)
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Otp.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isEmail: true }, // Pro Way: Backend validation
    },
    code: {
      type: DataTypes.STRING(6),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(
        "verification",
        "password_reset",
        "account_deletion",
      ),
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize: sequelizeConnection,
    tableName: "otps",
    timestamps: true, // Useful for cleanup jobs later
  },
);

export default Otp;

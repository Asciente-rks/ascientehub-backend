import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../config/db.config";

interface PaymentMethodAttributes {
  id: string;
  userId: string;
  paymongoId: string;
  type: string;
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  isDefault: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PaymentMethodInput extends Optional<
  PaymentMethodAttributes,
  "id" | "brand" | "last4" | "expMonth" | "expYear" | "isDefault"
> {}

class PaymentMethod extends Model<PaymentMethodAttributes, PaymentMethodInput>
  implements PaymentMethodAttributes {
  declare id: string;
  declare userId: string;
  declare paymongoId: string;
  declare type: string;
  declare brand?: string;
  declare last4?: string;
  declare expMonth?: number;
  declare expYear?: number;
  declare isDefault: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

PaymentMethod.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    paymongoId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    brand: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    last4: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    expMonth: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    expYear: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  },
  {
    sequelize: sequelizeConnection,
    tableName: "payment_methods",
    timestamps: true,
  },
);

export default PaymentMethod;

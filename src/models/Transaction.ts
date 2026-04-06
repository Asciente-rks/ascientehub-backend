import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../config/db.config";

interface TransactionAttributes {
  id: string; // Changed to string for UUID
  userId: string; // Must match User UUID
  gameId: string; // Must match Game UUID
  amount: number;
  status: "pending" | "completed" | "failed";
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TransactionInput extends Optional<
  TransactionAttributes,
  "id"
> {}

class Transaction
  extends Model<TransactionAttributes, TransactionInput>
  implements TransactionAttributes
{
  declare id: string;
  declare userId: string;
  declare gameId: string;
  declare amount: number;
  declare status: "pending" | "completed" | "failed";

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Transaction.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID, // Pro Way: Link to User.id
      allowNull: false,
    },
    gameId: {
      type: DataTypes.UUID, // Pro Way: Link to Game.id
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2), // Keeps financial precision
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "completed", "failed"),
      defaultValue: "pending",
    },
  },
  {
    sequelize: sequelizeConnection,
    tableName: "transactions",
    timestamps: true, // Crucial for financial auditing
  },
);

export default Transaction;

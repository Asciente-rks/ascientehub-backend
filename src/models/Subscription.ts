import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../config/db.config";

interface SubscriptionAttributes {
  id: string; // Changed to string for UUID
  developerId: string; // Must match User UUID
  status: "active" | "expired";
  nextBillingDate: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SubscriptionInput extends Optional<
  SubscriptionAttributes,
  "id"
> {}

class Subscription
  extends Model<SubscriptionAttributes, SubscriptionInput>
  implements SubscriptionAttributes
{
  declare id: string;
  declare developerId: string;
  declare status: "active" | "expired";
  declare nextBillingDate: Date;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Subscription.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    developerId: {
      type: DataTypes.UUID, // Link to User.id
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("active", "expired"),
      defaultValue: "active",
    },
    nextBillingDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize: sequelizeConnection,
    tableName: "subscriptions",
    timestamps: true,
  },
);

export default Subscription;

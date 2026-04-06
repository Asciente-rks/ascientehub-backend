import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../config/db.config";

interface CartAttributes {
  id: string;
  userId: string;
  gameId: string;
}

class Cart
  extends Model<CartAttributes, Optional<CartAttributes, "id">>
  implements CartAttributes
{
  declare id: string;
  declare userId: string;
  declare gameId: string;
}

Cart.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: { type: DataTypes.UUID, allowNull: false },
    gameId: { type: DataTypes.UUID, allowNull: false },
  },
  {
    sequelize: sequelizeConnection,
    tableName: "carts",
    timestamps: true,
  },
);

export default Cart;

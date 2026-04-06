import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../config/db.config";

interface ReviewAttributes {
  id: string; // Changed to string for UUID
  userId: string; // Must match User UUID
  gameId: string; // Must match Game UUID
  rating: number; // 1-5
  comment: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ReviewInput extends Optional<ReviewAttributes, "id"> {}

class Review
  extends Model<ReviewAttributes, ReviewInput>
  implements ReviewAttributes
{
  declare id: string;
  declare userId: string;
  declare gameId: string;
  declare rating: number;
  declare comment: string;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Review.init(
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
    gameId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    rating: {
      type: DataTypes.TINYINT,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    sequelize: sequelizeConnection,
    tableName: "reviews",
    timestamps: true,
  },
);

export default Review;

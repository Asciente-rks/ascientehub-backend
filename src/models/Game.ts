import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../config/db.config";

interface GameAttributes {
  id: string;
  title: string;
  slug: string; // <-- ADDED THIS
  description: string;
  basePrice: number;
  salePrice?: number;
  onSale: boolean;
  saleEndsAt?: Date;
  sizeInGb: number;
  developerId: string;
  categoryId: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  thumbnailUrl: string;
  createdAt?: Date;
  updatedAt?: Date;
  videoUrl?: string;
}

export interface GameInput extends Optional<
  GameAttributes,
  | "id"
  | "slug"
  | "status"
  | "onSale"
  | "salePrice"
  | "saleEndsAt"
  | "rejectionReason"
> {}

class Game extends Model<GameAttributes, GameInput> implements GameAttributes {
  declare id: string;
  declare title: string;
  declare slug: string; // <-- Now this matches the interface
  declare description: string;
  declare basePrice: number;
  declare salePrice: number;
  declare onSale: boolean;
  declare saleEndsAt: Date;
  declare sizeInGb: number;
  declare developerId: string;
  declare categoryId: string;
  declare status: "pending" | "approved" | "rejected";
  declare rejectionReason: string;
  declare thumbnailUrl: string;
  declare videoUrl: string;

  // Timestamps
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Game.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // Ensured unique for SEO URLs
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    basePrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    salePrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    onSale: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    saleEndsAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    sizeInGb: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    developerId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "pending",
    },
    rejectionReason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    thumbnailUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    videoUrl: {
      type: DataTypes.STRING,
      allowNull: true, // Set to true so trailers are optional
    },
  },
  {
    timestamps: true,
    sequelize: sequelizeConnection,
    tableName: "games",
    hooks: {
      // This automatically creates the slug before saving to the DB
      beforeValidate: (game: Game) => {
        if (game.title) {
          game.slug = game.title
            .toLowerCase()
            .replace(/ /g, "-")
            .replace(/[^\w-]+/g, "");
        }
      },
    },
  },
);

export default Game;

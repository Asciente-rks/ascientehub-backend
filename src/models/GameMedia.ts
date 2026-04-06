import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db.config";

class GameMedia extends Model {
  public id!: string;
  public gameId!: string;
  public url!: string;
  public type!: "image" | "video"; // Distinguish between screenshots and trailers
  public isFeatured!: boolean; // For the main gallery highlight
}

GameMedia.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("image", "video"),
      defaultValue: "image",
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  { sequelize, modelName: "game_media" },
);

export default GameMedia;

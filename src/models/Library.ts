import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../config/db.config";

interface LibraryAttributes {
  id: string; // Changed to string for UUID
  userId: string; // Must match User UUID
  gameId: string; // Must match Game UUID
  purchaseDate?: Date;
}

export interface LibraryInput extends Optional<LibraryAttributes, "id"> {}

class Library
  extends Model<LibraryAttributes, LibraryInput>
  implements LibraryAttributes
{
  declare id: string;
  declare userId: string;
  declare gameId: string;
  declare readonly purchaseDate: Date;
}

Library.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID, // Pro Way: Matches the new User UUID
      allowNull: false,
    },
    gameId: {
      type: DataTypes.UUID, // Pro Way: Matches the new Game UUID
      allowNull: false,
    },
  },
  {
    sequelize: sequelizeConnection,
    tableName: "libraries",
    timestamps: true,
    createdAt: "purchaseDate",
    updatedAt: false,
  },
);

export default Library;

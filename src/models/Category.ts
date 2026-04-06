import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../config/db.config";

interface CategoryAttributes {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

// This tells TS that 'id' is optional when creating a new record
export interface CategoryInput extends Optional<CategoryAttributes, "id"> {}

class Category
  extends Model<CategoryAttributes, CategoryInput>
  implements CategoryAttributes
{
  declare id: string;
  declare name: string;
  declare slug: string;
  declare description?: string;
}

Category.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize: sequelizeConnection,
    tableName: "categories",
  },
);

export default Category;

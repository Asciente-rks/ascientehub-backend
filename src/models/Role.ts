import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../config/db.config";

interface RoleAttributes {
  id: string; // Changed to string for UUID
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// We use Optional because even with UUIDs, Sequelize can
// auto-generate one if we don't provide a specific one.
export interface RoleInput extends Optional<RoleAttributes, "id"> {}

class Role extends Model<RoleAttributes, RoleInput> implements RoleAttributes {
  declare id: string;
  declare name: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Role.init(
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
  },
  {
    timestamps: true,
    sequelize: sequelizeConnection,
    tableName: "roles",
  },
);

export default Role;

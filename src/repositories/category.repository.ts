import Category from "../models/Category";

export class CategoryRepository {
  async findAll() {
    return await Category.findAll({
      attributes: ["id", "name", "slug", "description"],
      order: [["name", "ASC"]],
    });
  }

  async findById(id: string) {
    return await Category.findByPk(id);
  }
}

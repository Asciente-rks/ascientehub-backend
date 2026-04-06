import { CategoryRepository } from "../repositories/category.repository";

const categoryRepo = new CategoryRepository();

export class CategoryService {
  async getAllCategories() {
    const categories = await categoryRepo.findAll();
    // You could add logic here to filter "active" categories only
    return categories;
  }
}

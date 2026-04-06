import Game from "../models/Game";
import GameMedia from "../models/GameMedia";
import Category from "../models/Category";

export class GameRepository {
  // 1. Create the base Game record (Added options for Transactions)
  async create(data: any, options?: any) {
    return await Game.create(data, options);
  }

  // 2. Bulk insert images/videos for the gallery (Added options for Transactions)
  async bulkCreateMedia(mediaData: any[], options?: any) {
    return await GameMedia.bulkCreate(mediaData, options);
  }

  // 3. Find a game with its relations
  async findById(id: string) {
    return await Game.findByPk(id, {
      // CRITICAL: Ensure these aliases match your associations in models/index.ts!
      include: [
        { model: GameMedia, as: "gallery" },
        { model: Category, as: "Category" },
      ],
    });
  }

  // 4. Utility for Service-level validation
  async findCategoryById(categoryId: string) {
    return await Category.findByPk(categoryId);
  }

  // 5. Get all games for a specific Developer
  async findByDeveloper(developerId: string) {
    return await Game.findAll({
      where: { developerId },
      include: [{ model: Category, as: "Category" }],
    });
  }

  async findGames(filters: {
    category?: string;
    sortBy?: string;
    onSale?: boolean;
  }) {
    const where: any = { status: "approved" }; // Only show approved games in store
    if (filters.category) where.categoryId = filters.category;
    if (filters.onSale) where.onSale = true;

    let order: any = [["createdAt", "DESC"]]; // Default sort
    if (filters.sortBy === "popular") order = [["createdAt", "DESC"]]; // Placeholder, add popularity later
    if (filters.sortBy === "rating") order = [["createdAt", "DESC"]]; // Placeholder
    if (filters.sortBy === "price") order = [["basePrice", "ASC"]];

    return await Game.findAll({
      where,
      include: [{ model: Category, as: "Category" }],
      order,
    });
  }

  async findGameById(id: string) {
    return await Game.findByPk(id, {
      include: [
        { model: Category, as: "Category" },
        { model: GameMedia, as: "gallery" },
      ],
    });
  }
}

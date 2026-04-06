import { GameRepository } from "../repositories/game.repository";
import Transaction from "../models/Transaction";

const gameRepo = new GameRepository();

export class DeveloperService {
  async getMyGames(developerId: string) {
    return await gameRepo.findByDeveloper(developerId);
  }

  async editGame(gameId: string, developerId: string, updateData: any) {
    const game = await gameRepo.findById(gameId);
    if (!game) throw new Error("Game not found");
    if ((game as any).developerId !== developerId)
      throw new Error("Unauthorized");

    const {
      title,
      description,
      basePrice,
      salePrice,
      onSale,
      saleEndsAt,
      categoryId,
    } = updateData;
    const updates: any = {};
    if (title) updates.title = title;
    if (description) updates.description = description;
    if (basePrice) updates.basePrice = basePrice;
    if (salePrice !== undefined) updates.salePrice = salePrice;
    if (onSale !== undefined) updates.onSale = onSale;
    if (saleEndsAt) updates.saleEndsAt = saleEndsAt;
    if (categoryId) updates.categoryId = categoryId;

    await (game as any).update(updates);
    return game;
  }

  async deleteGame(gameId: string, developerId: string) {
    const game = await gameRepo.findById(gameId);
    if (!game) throw new Error("Game not found");
    if ((game as any).developerId !== developerId)
      throw new Error("Unauthorized");
    return await (game as any).destroy();
  }

  async getGameAnalytics(gameId: string, developerId: string) {
    const game = await gameRepo.findById(gameId);
    if (!game) throw new Error("Game not found");
    if ((game as any).developerId !== developerId)
      throw new Error("Unauthorized");

    // Get sales count and revenue
    const sales = await Transaction.findAll({ where: { gameId } });
    return {
      gameId,
      totalSales: sales.length,
      totalRevenue: sales.reduce(
        (sum: number, s: any) => sum + parseFloat(s.amount),
        0,
      ),
      games: [{ title: (game as any).title, sales: sales.length }],
    };
  }
}

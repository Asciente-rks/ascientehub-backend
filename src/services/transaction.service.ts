import { TransactionRepository } from "../repositories/transaction.repository";
import { GameRepository } from "../repositories/game.repository";
import { LibraryRepository } from "../repositories/library.repository";

const transactionRepo = new TransactionRepository();
const gameRepo = new GameRepository();
const libraryRepo = new LibraryRepository();

export class TransactionService {
  async getGameForPurchase(gameId: string) {
    return await gameRepo.findById(gameId);
  }

  async checkGameOwnership(userId: string, gameId: string): Promise<boolean> {
    const ownership = await libraryRepo.findByUserAndGame(userId, gameId);
    return !!ownership;
  }

  async createTransaction(
    userId: string,
    gameId: string,
    amount: number,
    paymentId: string,
  ) {
    // Create transaction record
    const transaction = await transactionRepo.create({
      userId,
      gameId,
      amount,
      paymentId,
      status: "completed",
    });

    // Add game to user's library
    await libraryRepo.create({
      userId,
      gameId,
      purchaseDate: new Date(),
    });

    return transaction;
  }

  /**
   * Create multiple transactions at once (for cart checkout)
   * Each game gets its own transaction, but they share the same payment ID
   */
  async createBulkTransactions(
    userId: string,
    gameIds: string[],
    paymentId: string,
  ) {
    const transactions = [];

    for (const gameId of gameIds) {
      const game = await this.getGameForPurchase(gameId);
      if (!game) {
        throw new Error(`Game not found: ${gameId}`);
      }

      const alreadyOwns = await this.checkGameOwnership(userId, gameId);
      if (alreadyOwns) {
        throw new Error(`You already own this game: ${gameId}`);
      }

      // Create transaction record
      const transaction = await transactionRepo.create({
        userId,
        gameId,
        amount: game.basePrice,
        paymentId,
        status: "completed",
      });

      // Add game to user's library
      await libraryRepo.create({
        userId,
        gameId,
        purchaseDate: new Date(),
      });

      transactions.push(transaction);
    }

    return transactions;
  }

  async getUserTransactions(userId: string) {
    return await transactionRepo.findByUserId(userId);
  }
}

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

  async getUserTransactions(userId: string) {
    return await transactionRepo.findByUserId(userId);
  }
}

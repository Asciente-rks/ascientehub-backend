import { Op } from "sequelize";
import Game from "../models/Game";
import { GameRepository } from "../repositories/game.repository";
import sequelizeConnection from "../config/db.config";
import { StorageService } from "./storage.service";

const gameRepo = new GameRepository();
const storageService = new StorageService();

export class GameService {
  async createGame(
    data: any,
    developerId: string,
    files: { thumbnail: Express.Multer.File; trailer?: Express.Multer.File },
    options?: any,
  ): Promise<Game> {
    const { title, description, price, categoryId, sizeInGb } = data;

    // 1. Monthly Upload Limit Check
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const gameCount = await Game.count({
      where: {
        developerId,
        createdAt: {
          [Op.gte]: startOfMonth,
        },
      },
    });

    if (gameCount >= 5) {
      throw new Error(
        "Monthly upload limit reached. You can only upload 5 games per month.",
      );
    }

    // 2. Category Check
    const category = await gameRepo.findCategoryById(categoryId);
    if (!category) throw new Error("Category not found.");

    // --- UPLOAD TRACKING FOR CLEANUP ---
    let thumbnailPath: string | null = null;
    let trailerPath: string | null = null;

    try {
      // 3. Upload to Cloudflare R2
      thumbnailPath = await storageService.uploadFile(
        files.thumbnail,
        "thumbnails",
      );

      if (files.trailer) {
        trailerPath = await storageService.uploadFile(
          files.trailer,
          "trailers",
        );
      }

      /**
       * 4. Transaction Logic
       */
      const transaction =
        options?.transaction || (await sequelizeConnection.transaction());
      const isExternalTransaction = !!options?.transaction;

      try {
        const newGame = (await gameRepo.create(
          {
            title,
            description,
            basePrice: price,
            sizeInGb,
            thumbnailUrl: thumbnailPath,
            videoUrl: trailerPath || "", // Ensure it's at least an empty string if null
            developerId,
            categoryId,
            status: "pending",
          },
          { transaction },
        )) as Game;

        if (!isExternalTransaction) await transaction.commit();

        return newGame;
      } catch (error: any) {
        // Rollback DB transaction
        if (!isExternalTransaction && transaction) await transaction.rollback();

        // --- 5. R2 CLEANUP (THE FIX) ---
        // If the DB save fails, delete the files we just uploaded to avoid duplicates/waste
        if (thumbnailPath) await storageService.deleteFile(thumbnailPath);
        if (trailerPath) await storageService.deleteFile(trailerPath);

        throw new Error(`Game creation failed: ${error.message}`);
      }
    } catch (outerError: any) {
      // Catch errors from storageService.uploadFile itself or the inner block
      throw new Error(outerError.message);
    }
  }
}

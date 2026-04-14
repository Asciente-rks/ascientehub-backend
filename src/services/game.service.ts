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
    files: {
      thumbnail?: Express.Multer.File;
      trailer?: Express.Multer.File;
    } = {},
    options?: any,
  ): Promise<Game> {
    const {
      title,
      description,
      price,
      categoryId,
      sizeInGb,
      installerUrl,
      installerKey,
    } = data;

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
    let uploadedThumbnail = false;
    let uploadedTrailer = false;
    try {
      // 3. Upload to Cloudflare R2 OR use presigned URL provided by client
      // If caller provided `thumbnailUrl` or `thumbnailKey`, use it instead of uploading
      if (data.thumbnailUrl) {
        thumbnailPath = storageService.getFileUrl(data.thumbnailUrl);
      } else if (data.thumbnailKey) {
        thumbnailPath = storageService.getFileUrl(data.thumbnailKey);
      } else if (files.thumbnail) {
        thumbnailPath = await storageService.uploadFile(
          files.thumbnail,
          "thumbnails",
        );
        uploadedThumbnail = true;
      } else {
        throw new Error("Thumbnail not provided");
      }

      if (data.trailerUrl) {
        trailerPath = storageService.getFileUrl(data.trailerUrl);
      } else if (data.trailerKey) {
        trailerPath = storageService.getFileUrl(data.trailerKey);
      } else if (files.trailer) {
        trailerPath = await storageService.uploadFile(
          files.trailer,
          "trailers",
        );
        uploadedTrailer = true;
      }

      let installerPath: string | null = null;
      if (installerUrl) {
        installerPath = storageService.getFileUrl(installerUrl);
      } else if (installerKey) {
        installerPath = storageService.getFileUrl(installerKey);
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
            installerUrl: installerPath || null,
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
        // If the DB save fails, delete only files we uploaded in this request
        if (uploadedThumbnail && thumbnailPath)
          await storageService.deleteFile(thumbnailPath);
        if (uploadedTrailer && trailerPath)
          await storageService.deleteFile(trailerPath);

        throw new Error(`Game creation failed: ${error.message}`);
      }
    } catch (outerError: any) {
      // Catch errors from storageService.uploadFile itself or the inner block
      throw new Error(outerError.message);
    }
  }

  async getGames(filters: {
    category?: string;
    sortBy?: string;
    onSale?: boolean;
  }) {
    return await gameRepo.findGames(filters);
  }

  async getGameById(id: string) {
    return await gameRepo.findGameById(id);
  }
}

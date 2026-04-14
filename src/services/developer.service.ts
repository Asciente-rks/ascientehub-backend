import { GameRepository } from "../repositories/game.repository";
import Transaction from "../models/Transaction";
import { StorageService } from "./storage.service";

const gameRepo = new GameRepository();
const storageService = new StorageService();

export class DeveloperService {
  async getMyGames(developerId: string) {
    return await gameRepo.findByDeveloper(developerId);
  }

  async editGame(
    gameId: string,
    developerId: string,
    updateData: any,
    files?: { thumbnail?: Express.Multer.File; trailer?: Express.Multer.File },
  ) {
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
      thumbnailUrl,
      thumbnailKey,
      trailerUrl,
      trailerKey,
      videoUrl,
      sizeInGb,
    } = updateData;

    // When checking presence, use strict undefined checks so falsy values like false or 0 are allowed
    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (basePrice !== undefined) updates.basePrice = basePrice;
    if (salePrice !== undefined) updates.salePrice = salePrice;
    if (onSale !== undefined) updates.onSale = onSale;
    if (saleEndsAt !== undefined) updates.saleEndsAt = saleEndsAt || null;
    if (categoryId !== undefined) updates.categoryId = categoryId;
    if (sizeInGb !== undefined) updates.sizeInGb = sizeInGb;

    // Handle thumbnail/trailer updates (support files or presigned URLs/keys)
    let uploadedThumbnail = false;
    let uploadedTrailer = false;
    let newThumbnailPath: string | null = null;
    let newTrailerPath: string | null = null;
    const oldThumbnail = (game as any).thumbnailUrl;
    const oldTrailer = (game as any).videoUrl;

    try {
      if (files?.thumbnail) {
        newThumbnailPath = await storageService.uploadFile(
          files.thumbnail,
          "thumbnails",
        );
        uploadedThumbnail = true;
        updates.thumbnailUrl = newThumbnailPath;
      } else if (thumbnailUrl) {
        updates.thumbnailUrl = storageService.getFileUrl(thumbnailUrl);
      } else if (thumbnailKey) {
        updates.thumbnailUrl = storageService.getFileUrl(thumbnailKey);
      }

      if (files?.trailer) {
        newTrailerPath = await storageService.uploadFile(
          files.trailer,
          "trailers",
        );
        uploadedTrailer = true;
        updates.videoUrl = newTrailerPath;
      } else if (trailerUrl) {
        updates.videoUrl = storageService.getFileUrl(trailerUrl);
      } else if (videoUrl) {
        updates.videoUrl = storageService.getFileUrl(videoUrl);
      } else if (trailerKey) {
        updates.videoUrl = storageService.getFileUrl(trailerKey);
      }

      await (game as any).update(updates);
      // Ensure we return the fresh values
      await (game as any).reload();

      // After successful update, remove any previously stored files we replaced
      if (
        uploadedThumbnail &&
        oldThumbnail &&
        oldThumbnail !== newThumbnailPath
      ) {
        await storageService.deleteFile(oldThumbnail);
      }
      if (uploadedTrailer && oldTrailer && oldTrailer !== newTrailerPath) {
        await storageService.deleteFile(oldTrailer);
      }

      return game;
    } catch (error: any) {
      // Cleanup any files we uploaded in this request if DB update failed
      if (uploadedThumbnail && newThumbnailPath)
        await storageService.deleteFile(newThumbnailPath);
      if (uploadedTrailer && newTrailerPath)
        await storageService.deleteFile(newTrailerPath);
      throw new Error(error.message);
    }
  }

  async deleteGame(gameId: string, requesterId: string, isAdmin = false) {
    const game = await gameRepo.findById(gameId);
    if (!game) throw new Error("Game not found");

    // Allow Admins to delete any game; otherwise ensure the requester owns the game
    if (!isAdmin && (game as any).developerId !== requesterId)
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

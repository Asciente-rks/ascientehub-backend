import { Request, Response } from "express";
import { GameService } from "../services/game.service";

const gameService = new GameService();

export const createGame = async (req: Request, res: Response) => {
  try {
    const developerId = (req as any).user.id;

    /** * We cast req.files because Multer's default type
     * for 'fields' is slightly different from 'single'.
     */
    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;

    const thumbnailFile = files?.thumbnail ? files.thumbnail[0] : undefined;
    const trailerFile = files?.trailer ? files.trailer[0] : undefined;

    // Support presigned upload flow: client may provide `thumbnailUrl` instead of a file
    const body = req.body as any;
    const hasThumbnailUrl = Boolean(body.thumbnailUrl || body.thumbnailKey);

    if (!thumbnailFile && !hasThumbnailUrl) {
      return res.status(400).json({ message: "Thumbnail is required." });
    }

    const game = await gameService.createGame(body, developerId, {
      thumbnail: thumbnailFile,
      trailer: trailerFile,
    });

    res.status(201).json({
      message: "Game created successfully",
      gameId: (game as any).id,
      game: game,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getGames = async (req: Request, res: Response) => {
  try {
    const { category, sortBy, onSale } = req.query;
    const games = await gameService.getGames({
      category: category as string,
      sortBy: sortBy as string,
      onSale: onSale === "true",
    });
    res.status(200).json(games);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getGameDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const game = await gameService.getGameById(id);
    if (!game) return res.status(404).json({ message: "Game not found" });
    res.status(200).json(game);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

import { Request, Response } from "express";
import { DeveloperService } from "../services/developer.service";

const devService = new DeveloperService();

export const getMyGames = async (req: Request, res: Response) => {
  try {
    const developerId = (req as any).user.id;
    const games = await devService.getMyGames(developerId);
    res.status(200).json(games);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const editGame = async (req: Request, res: Response) => {
  try {
    const developerId = (req as any).user.id;
    const { gameId } = req.params as { gameId: string };
    // Debug: log developer and game ids to aid troubleshooting
    console.log(`editGame: developerId=${developerId}, gameId=${gameId}`);
    // Multer may populate req.files when the request is multipart/form-data
    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;

    const thumbnailFile = files?.thumbnail ? files.thumbnail[0] : undefined;
    const trailerFile = files?.trailer ? files.trailer[0] : undefined;

    const updated = await devService.editGame(gameId, developerId, req.body, {
      thumbnail: thumbnailFile,
      trailer: trailerFile,
    });
    res.status(200).json({ message: "Game updated", game: updated });
  } catch (error: any) {
    const msg = error?.message || "Unknown error";
    if (msg === "Game not found") {
      return res.status(404).json({ message: msg });
    }
    if (msg === "Unauthorized") {
      return res.status(403).json({ message: msg });
    }
    return res.status(400).json({ message: msg });
  }
};

export const deleteGame = async (req: Request, res: Response) => {
  try {
    const developerId = (req as any).user.id;
    const { gameId } = req.params as { gameId: string };
    await devService.deleteGame(gameId, developerId);
    res.status(200).json({ message: "Game deleted" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getGameAnalytics = async (req: Request, res: Response) => {
  try {
    const developerId = (req as any).user.id;
    const { gameId } = req.params as { gameId: string };
    const analytics = await devService.getGameAnalytics(gameId, developerId);
    res.status(200).json(analytics);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

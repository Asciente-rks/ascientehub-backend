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
    const updated = await devService.editGame(gameId, developerId, req.body);
    res.status(200).json({ message: "Game updated", game: updated });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
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

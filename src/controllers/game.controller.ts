import { Request, Response } from "express";
import { GameService } from "../services/game.service";

const gameService = new GameService();

export const createGame = async (req: Request, res: Response) => {
  try {
    const developerId = (req as any).user.id;
  
    /** * We cast req.files because Multer's default type 
     * for 'fields' is slightly different from 'single'.
     */
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    const thumbnail = files?.thumbnail ? files.thumbnail[0] : null;
    const trailer = files?.trailer ? files.trailer[0] : null;

    if (!thumbnail) {
      return res.status(400).json({ message: "Thumbnail is required." });
    }
    
    const game = await gameService.createGame(req.body, developerId, { 
      thumbnail, 
      trailer: trailer || undefined 
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
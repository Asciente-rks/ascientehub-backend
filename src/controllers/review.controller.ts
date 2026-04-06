import { Request, Response } from "express";
import { ReviewService } from "../services/review.service";

const reviewService = new ReviewService();

export const addReview = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { gameId, rating, comment } = req.body;
    const review = await reviewService.addReview(
      userId,
      gameId,
      rating,
      comment,
    );
    res.status(201).json({ message: "Review added", review });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getGameReviews = async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params as { gameId: string };
    const reviews = await reviewService.getGameReviews(gameId);
    res.status(200).json(reviews);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteReview = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { reviewId } = req.params as { reviewId: string };
    await reviewService.deleteReview(reviewId, userId);
    res.status(200).json({ message: "Review deleted" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

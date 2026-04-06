import { ReviewRepository } from "../repositories/review.repository";

const reviewRepo = new ReviewRepository();

export class ReviewService {
  async addReview(
    userId: string,
    gameId: string,
    rating: number,
    comment: string,
  ) {
    // Check if user owns the game (has it in library)
    const owns = await reviewRepo.checkGameOwnership(userId, gameId);
    if (!owns) throw new Error("You must own this game to review it");

    // Check if already reviewed
    const existing = await reviewRepo.getUserGameReview(userId, gameId);
    if (existing) throw new Error("You already reviewed this game");

    if (rating < 1 || rating > 5)
      throw new Error("Rating must be between 1 and 5");

    return await reviewRepo.createReview(userId, gameId, rating, comment);
  }

  async getGameReviews(gameId: string) {
    return await reviewRepo.getReviewsByGame(gameId);
  }

  async deleteReview(reviewId: string, userId: string) {
    const review = await reviewRepo.findReviewById(reviewId);
    if (!review) throw new Error("Review not found");
    if (review.userId !== userId) throw new Error("Unauthorized");
    return await reviewRepo.deleteReview(reviewId);
  }
}

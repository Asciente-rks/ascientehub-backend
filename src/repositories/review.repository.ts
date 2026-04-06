import Review from "../models/Review";
import Library from "../models/Library";
import User from "../models/User";

export class ReviewRepository {
  async checkGameOwnership(userId: string, gameId: string) {
    const library = await Library.findOne({ where: { userId, gameId } });
    return !!library;
  }

  async getUserGameReview(userId: string, gameId: string) {
    return await Review.findOne({ where: { userId, gameId } });
  }

  async createReview(
    userId: string,
    gameId: string,
    rating: number,
    comment: string,
  ) {
    return await Review.create({ userId, gameId, rating, comment });
  }

  async getReviewsByGame(gameId: string) {
    return await Review.findAll({
      where: { gameId },
      include: [{ model: User, attributes: ["id", "username"] }],
      order: [["createdAt", "DESC"]],
    });
  }

  async findReviewById(reviewId: string) {
    return await Review.findByPk(reviewId);
  }

  async deleteReview(reviewId: string) {
    return await Review.destroy({ where: { id: reviewId } });
  }
}

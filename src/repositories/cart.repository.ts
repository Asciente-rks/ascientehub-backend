import Cart from "../models/Cart";
import Game from "../models/Game";

export class CartRepository {
  async addToCart(userId: string, gameId: string) {
    // Check if already in cart
    const existing = await Cart.findOne({ where: { userId, gameId } });
    if (existing) throw new Error("Game already in cart");

    return await Cart.create({ userId, gameId });
  }

  async getCart(userId: string) {
    return await Cart.findAll({
      where: { userId },
      include: [{ model: Game }],
    });
  }

  async removeFromCart(userId: string, gameId: string) {
    return await Cart.destroy({ where: { userId, gameId } });
  }

  async clearCart(userId: string) {
    return await Cart.destroy({ where: { userId } });
  }
}

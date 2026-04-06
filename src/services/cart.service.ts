import { CartRepository } from "../repositories/cart.repository";

const cartRepo = new CartRepository();

export class CartService {
  async addToCart(userId: string, gameId: string) {
    return await cartRepo.addToCart(userId, gameId);
  }

  async getCart(userId: string) {
    return await cartRepo.getCart(userId);
  }

  async removeFromCart(userId: string, gameId: string) {
    return await cartRepo.removeFromCart(userId, gameId);
  }

  async clearCart(userId: string) {
    return await cartRepo.clearCart(userId);
  }
}

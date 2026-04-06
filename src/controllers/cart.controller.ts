import { Request, Response } from "express";
import { CartService } from "../services/cart.service";

const cartService = new CartService();

export const addToCart = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { gameId } = req.body;
    const cart = await cartService.addToCart(userId, gameId);
    res.status(201).json({ message: "Game added to cart", cart });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getCart = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const cart = await cartService.getCart(userId);
    res.status(200).json(cart);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const removeFromCart = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { gameId } = req.params as { gameId: string };
    await cartService.removeFromCart(userId, gameId);
    res.status(200).json({ message: "Game removed from cart" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const clearCart = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    await cartService.clearCart(userId);
    res.status(200).json({ message: "Cart cleared" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

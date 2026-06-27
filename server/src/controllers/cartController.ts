import { Request, Response } from 'express';
import Cart from '../models/Cart';

export const getCart = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.uid; // verifyAuth middleware sets this
    let cart = await Cart.findOne({ userId });
    
    if (!cart) {
      cart = new Cart({ userId, items: [] });
      await cart.save();
    }
    
    res.status(200).json(cart.items);
  } catch (error: any) {
    res.status(500).json({ error: 'Server error fetching cart' });
  }
};

export const updateCart = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.uid;
    const { items } = req.body;
    
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: items || [] });
    } else {
      cart.items = items || [];
    }
    
    await cart.save();
    res.status(200).json(cart.items);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

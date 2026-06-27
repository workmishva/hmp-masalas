import { Request, Response } from 'express';
import Product from '../models/Product';

const defaultProducts = [
  { name: 'Premium Red Chilli Powder', price: 250, image: 'https://res.cloudinary.com/dwqr11vs3/image/upload/v1775739558/hmp_products/chilli-brand.jpg', description: 'Vibrant color and intense heat. Perfect for everyday Indian cooking.', category: 'veg', featured: true },
  { name: 'Pure Turmeric Powder', price: 180, image: 'https://res.cloudinary.com/dwqr11vs3/image/upload/v1775739559/hmp_products/turmeric-brand.jpg', description: 'Rich in curcumin. Hand-pounded to retain natural oils and aroma.', category: 'veg', featured: true },
  { name: 'Special Garam Masala', price: 320, image: 'https://res.cloudinary.com/dwqr11vs3/image/upload/v1775739566/hmp_products/garam_masala.jpg', description: 'A secret blend of 15 roasted whole spices. Elevate any curry or subzi.', category: 'veg', featured: true },
  { name: 'Refreshing Chhash Masala', price: 150, image: 'https://res.cloudinary.com/dwqr11vs3/image/upload/v1775739567/hmp_products/chhash-masala.jpg', description: 'The perfect cooling blend of cumin, mint, and black salt for buttermilk.', category: 'veg', featured: true },
  { name: 'Pav Bhaji Masala', price: 180, image: 'https://res.cloudinary.com/dwqr11vs3/image/upload/v1775739596/hmp_products/pavbhaji.jpg', description: 'Brings the authentic taste of Mumbai street food to your kitchen.', category: 'veg' },
  { name: 'Pani Puri Masala', price: 120, image: 'https://res.cloudinary.com/dwqr11vs3/image/upload/v1775739610/hmp_products/panipuri.jpg', description: 'Zesty and tangy blend for the perfect spicy water (teekha paani).', category: 'veg' },
  { name: 'Kitchen King Masala', price: 240, image: 'https://res.cloudinary.com/dwqr11vs3/image/upload/v1775739623/hmp_products/masala.jpg', description: 'The versatile all-rounder spice for any vegetarian curry or subzi.', category: 'veg' },
  { name: 'Chicken Masala', price: 280, image: 'https://res.cloudinary.com/dwqr11vs3/image/upload/v1775739635/hmp_products/chicken.jpg', description: 'Specially crafted for rich, aromatic chicken curries and gravies.', category: 'non-veg' },
  { name: 'Mutton Masala', price: 350, image: 'https://res.cloudinary.com/dwqr11vs3/image/upload/v1775739637/hmp_products/mutten-curry.jpg', description: 'Intense and robust blend to compliment the flavor of red meat.', category: 'non-veg' },
  { name: 'Sambhar Masala', price: 160, image: 'https://res.cloudinary.com/dwqr11vs3/image/upload/v1775739639/hmp_products/sambar.jpg', description: 'Traditional South Indian blend for the perfect tangy lentil stew.', category: 'veg' },
  { name: 'Chhole Masala', price: 200, image: 'https://res.cloudinary.com/dwqr11vs3/image/upload/v1775739655/hmp_products/chole_rice.jpg', description: 'Gives chickpeas a dark, rich color and a deep spicy aroma.', category: 'veg' },
  { name: 'Fish Curry Masala', price: 300, image: 'https://res.cloudinary.com/dwqr11vs3/image/upload/v1775739680/hmp_products/fish-curry.jpg', description: 'Tangy and spicy blend designed for coastal fish preparations.', category: 'non-veg' },
  { name: 'Tea Masala', price: 450, image: 'https://res.cloudinary.com/dwqr11vs3/image/upload/v1775739692/hmp_products/tea-masala.jpg', description: 'Warming blend of ginger, cardamom, and pepper for the perfect chai.', category: 'veg' },
  { name: 'Biryani Masala', price: 380, image: 'https://res.cloudinary.com/dwqr11vs3/image/upload/v1775739729/hmp_products/biriyani.jpg', description: 'Fragrant blend of Shahi Jeera and cloves for royal rice dishes.', category: 'veg' },
  { name: 'Egg Curry Masala', price: 190, image: 'https://res.cloudinary.com/dwqr11vs3/image/upload/v1775739736/hmp_products/egg-curry.jpg', description: 'Perfectly balanced spices for a comforting home-style egg curry.', category: 'non-veg' },
  { name: 'Rajma Masala', price: 170, image: 'https://res.cloudinary.com/dwqr11vs3/image/upload/v1775739738/hmp_products/rajma-rice.jpg', description: 'Rich blend that brings out the creaminess of red kidney beans.', category: 'veg' },
  { name: 'Dal Tadka Masala', price: 130, image: 'https://res.cloudinary.com/dwqr11vs3/image/upload/v1775739754/hmp_products/dal-tadka.jpg', description: 'The secret to restaurant-style tempering for your yellow dal.', category: 'veg' },
  { name: 'Butter Chicken Masala', price: 330, image: 'https://res.cloudinary.com/dwqr11vs3/image/upload/v1775739764/hmp_products/butter-chiken.jpg', description: 'Mildly sweet and creamy blend for the world-famous curry.', category: 'non-veg' },
  { name: 'Kashmiri Mirch Powder', price: 260, image: 'https://res.cloudinary.com/dwqr11vs3/image/upload/v1775739766/hmp_products/kashmiri-brand.jpg', description: 'Gives food a bright red color without being overwhelmingly hot.', category: 'veg' },
];

export const getProducts = async (req: Request, res: Response) => {
  try {
    let products = await Product.find().sort({ createdAt: -1 });
    
    if (products.length === 0) {
      await Product.insertMany(defaultProducts);
      products = await Product.find().sort({ createdAt: -1 });
    }

    // Map _id to id
    const formatted = products.map(p => {
      const obj = p.toObject();
      return {
        ...obj,
        id: obj._id.toString()
      };
    });
    res.status(200).json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: 'Server error fetching products' });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const product = new Product(req.body);
    await product.save();
    
    const obj = product.toObject();
    res.status(201).json({
      ...obj,
      id: obj._id.toString()
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const obj = product.toObject();
    res.status(200).json({
      ...obj,
      id: obj._id.toString()
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Server error deleting product' });
  }
};

import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { images } from '../../assets/images';

export type ProductCategory = 'veg' | 'non-veg';

export interface CatalogProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  category: ProductCategory;
  featured?: boolean;
  taxPercent?: number;
}

interface ProductCatalogContextType {
  products: CatalogProduct[];
  featuredProducts: CatalogProduct[];
  updateProduct: (productId: string, updates: Partial<CatalogProduct>) => void;
  addProduct: (product: Omit<CatalogProduct, 'id'>) => void;
  removeProduct: (productId: string) => void;
  resetProducts: () => void;
}

const STORAGE_KEY = 'hmp-masala-products-cld';

const defaultProducts: CatalogProduct[] = [
  { id: 'p1', name: 'Premium Red Chilli Powder', price: 250, image: 'https://res.cloudinary.com/dwqr11vs3/image/upload/v1775739558/hmp_products/chilli-brand.jpg', description: 'Vibrant color and intense heat. Perfect for everyday Indian cooking.', category: 'veg', featured: true },
  { id: 'p2', name: 'Pure Turmeric Powder', price: 180, image: 'https://res.cloudinary.com/dwqr11vs3/image/upload/v1775739559/hmp_products/turmeric-brand.jpg', description: 'Rich in curcumin. Hand-pounded to retain natural oils and aroma.', category: 'veg', featured: true },
  { id: 'p3', name: 'Special Garam Masala', price: 320, image: 'https://res.cloudinary.com/dwqr11vs3/image/upload/v1775739566/hmp_products/garam_masala.jpg', description: 'A secret blend of 15 roasted whole spices. Elevate any curry or subzi.', category: 'veg', featured: true },
  { id: 'p4', name: 'Refreshing Chhash Masala', price: 150, image: 'https://res.cloudinary.com/dwqr11vs3/image/upload/v1775739567/hmp_products/chhash-masala.jpg', description: 'The perfect cooling blend of cumin, mint, and black salt for buttermilk.', category: 'veg', featured: true },
  { id: 'm2', name: 'Pav Bhaji Masala', price: 180, image: 'https://res.cloudinary.com/dwqr11vs3/image/upload/v1775739596/hmp_products/pavbhaji.jpg', description: 'Brings the authentic taste of Mumbai street food to your kitchen.', category: 'veg' },
  { id: 'm3', name: 'Pani Puri Masala', price: 120, image: 'https://res.cloudinary.com/dwqr11vs3/image/upload/v1775739610/hmp_products/panipuri.jpg', description: 'Zesty and tangy blend for the perfect spicy water (teekha paani).', category: 'veg' },
  { id: 'm4', name: 'Kitchen King Masala', price: 240, image: 'https://res.cloudinary.com/dwqr11vs3/image/upload/v1775739623/hmp_products/masala.jpg', description: 'The versatile all-rounder spice for any vegetarian curry or subzi.', category: 'veg' },
  { id: 'm5', name: 'Chicken Masala', price: 280, image: 'https://res.cloudinary.com/dwqr11vs3/image/upload/v1775739635/hmp_products/chicken.jpg', description: 'Specially crafted for rich, aromatic chicken curries and gravies.', category: 'non-veg' },
  { id: 'm6', name: 'Mutton Masala', price: 350, image: 'https://res.cloudinary.com/dwqr11vs3/image/upload/v1775739637/hmp_products/mutten-curry.jpg', description: 'Intense and robust blend to compliment the flavor of red meat.', category: 'non-veg' },
  { id: 'm7', name: 'Sambhar Masala', price: 160, image: 'https://res.cloudinary.com/dwqr11vs3/image/upload/v1775739639/hmp_products/sambar.jpg', description: 'Traditional South Indian blend for the perfect tangy lentil stew.', category: 'veg' },
  { id: 'm8', name: 'Chhole Masala', price: 200, image: 'https://res.cloudinary.com/dwqr11vs3/image/upload/v1775739655/hmp_products/chole_rice.jpg', description: 'Gives chickpeas a dark, rich color and a deep spicy aroma.', category: 'veg' },
  { id: 'm9', name: 'Fish Curry Masala', price: 300, image: 'https://res.cloudinary.com/dwqr11vs3/image/upload/v1775739680/hmp_products/fish-curry.jpg', description: 'Tangy and spicy blend designed for coastal fish preparations.', category: 'non-veg' },
  { id: 'm10', name: 'Tea Masala', price: 450, image: 'https://res.cloudinary.com/dwqr11vs3/image/upload/v1775739692/hmp_products/tea-masala.jpg', description: 'Warming blend of ginger, cardamom, and pepper for the perfect chai.', category: 'veg' },
  { id: 'm12', name: 'Biryani Masala', price: 380, image: 'https://res.cloudinary.com/dwqr11vs3/image/upload/v1775739729/hmp_products/biriyani.jpg', description: 'Fragrant blend of Shahi Jeera and cloves for royal rice dishes.', category: 'veg' },
  { id: 'm13', name: 'Egg Curry Masala', price: 190, image: 'https://res.cloudinary.com/dwqr11vs3/image/upload/v1775739736/hmp_products/egg-curry.jpg', description: 'Perfectly balanced spices for a comforting home-style egg curry.', category: 'non-veg' },
  { id: 'm14', name: 'Rajma Masala', price: 170, image: 'https://res.cloudinary.com/dwqr11vs3/image/upload/v1775739738/hmp_products/rajma-rice.jpg', description: 'Rich blend that brings out the creaminess of red kidney beans.', category: 'veg' },
  { id: 'm16', name: 'Dal Tadka Masala', price: 130, image: 'https://res.cloudinary.com/dwqr11vs3/image/upload/v1775739754/hmp_products/dal-tadka.jpg', description: 'The secret to restaurant-style tempering for your yellow dal.', category: 'veg' },
  { id: 'm18', name: 'Butter Chicken Masala', price: 330, image: 'https://res.cloudinary.com/dwqr11vs3/image/upload/v1775739764/hmp_products/butter-chiken.jpg', description: 'Mildly sweet and creamy blend for the world-famous curry.', category: 'non-veg' },
  { id: 'm20', name: 'Kashmiri Mirch Powder', price: 260, image: 'https://res.cloudinary.com/dwqr11vs3/image/upload/v1775739766/hmp_products/kashmiri-brand.jpg', description: 'Gives food a bright red color without being overwhelmingly hot.', category: 'veg' },
];

const ProductCatalogContext = createContext<ProductCatalogContextType | null>(null);

function isCatalogProduct(value: unknown): value is CatalogProduct {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const product = value as CatalogProduct;
  return (
    typeof product.id === 'string' &&
    typeof product.name === 'string' &&
    typeof product.price === 'number' &&
    typeof product.image === 'string' &&
    typeof product.description === 'string' &&
    (product.category === 'veg' || product.category === 'non-veg') &&
    (product.taxPercent === undefined || typeof product.taxPercent === 'number')
  );
}

function loadStoredProducts() {
  if (typeof window === 'undefined') {
    return defaultProducts;
  }

  try {
    const savedProducts = window.localStorage.getItem(STORAGE_KEY);
    if (!savedProducts) {
      return defaultProducts;
    }

    const parsed = JSON.parse(savedProducts);
    if (Array.isArray(parsed) && parsed.every(isCatalogProduct)) {
      return parsed;
    }
  } catch {
    return defaultProducts;
  }

  return defaultProducts;
}

export function resolveCatalogImage(image: string) {
  return images[image] ?? image ?? images['masala.jpg'] ?? '';
}

export function ProductCatalogProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<CatalogProduct[]>(loadStoredProducts);

  useEffect(() => {
    // Force reset if the local storage doesn't match the new cloud key
    const currentLocal = window.localStorage.getItem(STORAGE_KEY);
    if (!currentLocal) {
      setProducts(defaultProducts);
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  }, [products]);

  const featuredProducts = useMemo(() => products.filter((product) => product.featured).slice(0, 4), [products]);

  const updateProduct = (productId: string, updates: Partial<CatalogProduct>) => {
    setProducts((currentProducts) =>
      currentProducts.map((product) => (product.id === productId ? { ...product, ...updates } : product))
    );
  };

  const addProduct = (product: Omit<CatalogProduct, 'id'>) => {
    setProducts((currentProducts) => [...currentProducts, { ...product, id: `custom-${Date.now()}` }]);
  };

  const removeProduct = (productId: string) => {
    setProducts((currentProducts) => currentProducts.filter((product) => product.id !== productId));
  };

  const resetProducts = () => {
    setProducts(defaultProducts);
  };

  return (
    <ProductCatalogContext.Provider
      value={{ products, featuredProducts, updateProduct, addProduct, removeProduct, resetProducts }}
    >
      {children}
    </ProductCatalogContext.Provider>
  );
}

export function useProductCatalog() {
  const context = useContext(ProductCatalogContext);
  if (!context) {
    throw new Error('useProductCatalog must be used within a ProductCatalogProvider');
  }

  return context;
}

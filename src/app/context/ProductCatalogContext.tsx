import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { images } from '../../assets/images';
import { fetchProducts, createProductApi, updateProductApi, deleteProductApi } from '../services/productApi';

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
  updateProduct: (productId: string, updates: Partial<CatalogProduct>) => Promise<void>;
  addProduct: (product: Omit<CatalogProduct, 'id'>) => Promise<void>;
  removeProduct: (productId: string) => Promise<void>;
  resetProducts: () => Promise<void>;
}

const ProductCatalogContext = createContext<ProductCatalogContextType | null>(null);

export function resolveCatalogImage(image: string) {
  if (!image) return images['masala.jpg'] ?? '';
  if (image.startsWith('http') || image.startsWith('data:')) {
    return image;
  }
  return images[image] ?? images['masala.jpg'] ?? '';
}

export function ProductCatalogProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<CatalogProduct[]>([]);

  const loadProducts = async () => {
    try {
      const data = await fetchProducts();
      setProducts(data);
    } catch (e) {
      console.error("Failed to load products from backend", e);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const featuredProducts = useMemo(() => products.filter((product) => product.featured).slice(0, 4), [products]);

  const updateProduct = async (productId: string, updates: Partial<CatalogProduct>) => {
    try {
      const updated = await updateProductApi(productId, updates);
      setProducts((currentProducts) =>
        currentProducts.map((product) => (product.id === productId ? updated : product))
      );
    } catch (e) {
      console.error("Failed to update product", e);
      throw e;
    }
  };

  const addProduct = async (product: Omit<CatalogProduct, 'id'>) => {
    try {
      const created = await createProductApi(product);
      setProducts((currentProducts) => [created, ...currentProducts]);
    } catch (e) {
      console.error("Failed to add product", e);
      throw e;
    }
  };

  const removeProduct = async (productId: string) => {
    try {
      await deleteProductApi(productId);
      setProducts((currentProducts) => currentProducts.filter((product) => product.id !== productId));
    } catch (e) {
      console.error("Failed to delete product", e);
      throw e;
    }
  };

  const resetProducts = async () => {
    // For now, reset just re-fetches to undo local optimistics if any.
    await loadProducts();
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

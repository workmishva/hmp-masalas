import { CatalogProduct } from '../context/ProductCatalogContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

async function buildAdminAuthorization() {
  if (typeof window !== 'undefined') {
    const customToken = window.sessionStorage.getItem('hmp-admin-jwt');
    if (customToken) {
      return `Bearer ${customToken}`;
    }
  }
  return '';
}

export async function fetchProducts(): Promise<CatalogProduct[]> {
  const response = await fetch(`${BACKEND_URL}/api/products`);
  if (!response.ok) throw new Error('Failed to fetch products');
  return response.json();
}

export async function createProductApi(product: Omit<CatalogProduct, 'id'>): Promise<CatalogProduct> {
  const response = await fetch(`${BACKEND_URL}/api/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: await buildAdminAuthorization(),
    },
    body: JSON.stringify(product),
  });
  if (!response.ok) throw new Error('Failed to create product');
  return response.json();
}

export async function updateProductApi(id: string, updates: Partial<CatalogProduct>): Promise<CatalogProduct> {
  const response = await fetch(`${BACKEND_URL}/api/products/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: await buildAdminAuthorization(),
    },
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error('Failed to update product');
  return response.json();
}

export async function deleteProductApi(id: string): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/api/products/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: await buildAdminAuthorization(),
    },
  });
  if (!response.ok) throw new Error('Failed to delete product');
}

import type { User } from 'firebase/auth';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

export async function fetchCart(user: User) {
  const token = await user.getIdToken();
  const response = await fetch(`${BACKEND_URL}/api/cart`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error('Failed to fetch cart');
  return response.json();
}

export async function updateCartApi(user: User, items: any[]) {
  const token = await user.getIdToken();
  const response = await fetch(`${BACKEND_URL}/api/cart`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ items })
  });
  if (!response.ok) throw new Error('Failed to update cart');
  return response.json();
}

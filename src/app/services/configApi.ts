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

export async function fetchConfig() {
  const response = await fetch(`${BACKEND_URL}/api/config`);
  if (!response.ok) throw new Error('Failed to fetch config');
  return response.json();
}

export async function updateConfigApi(updates: any) {
  const response = await fetch(`${BACKEND_URL}/api/config`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: await buildAdminAuthorization(),
    },
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error('Failed to update config');
  return response.json();
}

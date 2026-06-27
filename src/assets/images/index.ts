const imageModules = import.meta.glob('./*.{png,jpg,jpeg,webp,svg}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

export const images = Object.fromEntries(
  Object.entries(imageModules).map(([path, url]) => [path.split('/').pop()!, url])
) as Record<string, string>;

export function getImage(fileName: string) {
  // Try WebP first (Adjustment #6)
  const webpName = fileName.replace(/\.(png|jpe?g)$/i, '.webp');
  if (images[webpName]) {
    return images[webpName];
  }

  // Fallback to original
  if (images[fileName]) {
    return images[fileName];
  }

  return images['masala.webp'] ?? images['masala.jpg'] ?? '';
}

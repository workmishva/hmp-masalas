const imageModules = import.meta.glob('./*.{png,jpg,jpeg,webp,svg}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

export const images = Object.fromEntries(
  Object.entries(imageModules).map(([path, url]) => [path.split('/').pop()!, url])
) as Record<string, string>;

export function getImage(fileName: string) {
  return images[fileName] ?? images['masala.jpg'] ?? '';
}

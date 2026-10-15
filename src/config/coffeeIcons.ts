// Coffee icons bundled from /src/assets/icons. The coffee list stores only the
// file name (e.g. "3.png"), because the built URL carries a content hash
// ("/vending-machines/assets/3-B5bxrVEY.png") that is not stable across builds.
const icons = import.meta.glob<string>(
  "/src/assets/icons/*.{png,jpg,jpeg,svg}",
  { eager: true, import: "default" },
);

export const iconsByName: Record<string, string> = Object.fromEntries(
  Object.entries(icons).map(([path, url]) => [path.split("/").pop()!, url]),
);

// Turns a stored image value into its file name. Older lists (kept in
// localStorage) hold the hashed build URL, so the "-<hash>" part is dropped.
export function iconName(image: string | undefined): string | undefined {
  if (!image) return image;
  const file = image.split("/").pop()!;
  if (iconsByName[file]) return file;
  const unhashed = file.replace(/-[\w-]{8}(\.\w+)$/, "$1");
  return iconsByName[unhashed] ? unhashed : image;
}

// URL to show for a stored image value (unknown values are used as-is)
export function iconUrl(image: string | undefined): string | undefined {
  if (!image) return image;
  return iconsByName[image] ?? image;
}

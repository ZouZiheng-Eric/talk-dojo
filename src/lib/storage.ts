import type { FavoriteItem } from "./types";

const KEY = "talk-dojo-favorites";

export function loadFavorites(): FavoriteItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as FavoriteItem[];
  } catch {
    return [];
  }
}

export function saveFavorite(item: FavoriteItem): void {
  const list = loadFavorites();
  const next = [item, ...list.filter((x) => x.id !== item.id)];
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function removeFavorite(id: string): void {
  const list = loadFavorites().filter((x) => x.id !== id);
  localStorage.setItem(KEY, JSON.stringify(list));
}

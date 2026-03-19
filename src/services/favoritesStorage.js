import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = 'pokedex_kanto_favorites';

export async function getFavoriteIds() {
  const raw = await AsyncStorage.getItem(FAVORITES_KEY);

  if (!raw) {
    return [];
  }

  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.filter((id) => Number.isInteger(id));
}

export async function setFavoriteIds(ids) {
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
}

export async function toggleFavoriteId(id) {
  const favorites = await getFavoriteIds();
  const hasId = favorites.includes(id);

  const next = hasId
    ? favorites.filter((favId) => favId !== id)
    : [...favorites, id].sort((a, b) => a - b);

  await setFavoriteIds(next);
  return next;
}

import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = 'pokedex_global_favorites';
const LEGACY_FAVORITES_KEY = 'pokedex_kanto_favorites';

function parseFavoriteIds(rawValue) {
  if (!rawValue) {
    return [];
  }

  const parsed = JSON.parse(rawValue);
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.filter((id) => Number.isInteger(id));
}

export async function getFavoriteIds() {
  const raw = await AsyncStorage.getItem(FAVORITES_KEY);

  if (raw) {
    return parseFavoriteIds(raw);
  }

  const legacyRaw = await AsyncStorage.getItem(LEGACY_FAVORITES_KEY);
  const migratedIds = parseFavoriteIds(legacyRaw);

  if (migratedIds.length === 0) {
    return [];
  }

  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(migratedIds));
  await AsyncStorage.removeItem(LEGACY_FAVORITES_KEY);

  return migratedIds;
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

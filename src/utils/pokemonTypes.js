export const POKEMON_TYPE_COLORS = {
  normal: '#b0b8c1',
  fire: '#ff5722',
  water: '#2196f3',
  electric: '#ffc107',
  grass: '#4caf50',
  ice: '#00bcd4',
  fighting: '#e91e63',
  poison: '#9c27b0',
  ground: '#ff9800',
  flying: '#3f51b5',
  psychic: '#e91e63',
  bug: '#8bc34a',
  rock: '#795548',
  ghost: '#673ab7',
  dragon: '#5c6bc0'
};

export const POKEMON_TYPE_BACKGROUND_COLORS = {
  normal: '#f0f1f3',
  fire: '#ffe8e3',
  water: '#e3f2fd',
  electric: '#fff9e6',
  grass: '#e8f5e9',
  ice: '#e0f7fa',
  fighting: '#f8e1eb',
  poison: '#f3e5f5',
  ground: '#ffe8d1',
  flying: '#f0f4ff',
  psychic: '#f8e1eb',
  bug: '#f1f8e9',
  rock: '#f5e6d3',
  ghost: '#f3e5f5',
  dragon: '#f0f3ff'
};

export function getTypeColor(typeName) {
  return POKEMON_TYPE_COLORS[typeName] || '#ced4da';
}

export function getTypeBackgroundColor(typeName) {
  return POKEMON_TYPE_BACKGROUND_COLORS[typeName] || '#f5f1ee';
}

export function getTypeTextColor(typeName) {
  const darkTextTypes = ['electric', 'bug', 'ice', 'fighting', 'normal', 'ground'];
  return darkTextTypes.includes(typeName) ? '#212529' : '#fff';
}

export const KANTO_TYPES = [
  'all',
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon'
];

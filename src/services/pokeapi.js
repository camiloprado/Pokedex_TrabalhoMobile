const API_BASE_URL = 'https://pokeapi.co/api/v2';
const pokemonListCache = new Map();
const detailsCache = new Map();
const regionCache = new Map();

export const REGION_OPTIONS = [
  { key: 'kanto', label: 'Kanto', generationId: 1 },
  { key: 'johto', label: 'Johto', generationId: 2 },
  { key: 'hoenn', label: 'Hoenn', generationId: 3 },
  { key: 'sinnoh', label: 'Sinnoh', generationId: 4 },
  { key: 'unova', label: 'Unova', generationId: 5 },
  { key: 'kalos', label: 'Kalos', generationId: 6 },
  { key: 'alola', label: 'Alola', generationId: 7 },
  { key: 'galar', label: 'Galar', generationId: 8 },
  { key: 'paldea', label: 'Paldea', generationId: 9 }
];

function capitalize(text) {
  if (!text) {
    return '';
  }

  return text.charAt(0).toUpperCase() + text.slice(1);
}

export async function fetchPokemonList(offset = 0, limit = 20) {
  const safeOffset = Math.max(0, offset);
  const safeLimit = Math.max(0, limit);

  if (safeLimit <= 0) {
    return [];
  }

  const response = await fetch(
    `${API_BASE_URL}/pokemon?limit=${safeLimit}&offset=${safeOffset}`
  );

  if (!response.ok) {
    throw new Error('Não foi possível carregar a lista de Pokémon.');
  }

  const data = await response.json();

  const detailed = await Promise.all(data.results.map((item) => fetchPokemonSummary(item.url)));

  return detailed;
}

async function fetchPokemonSummary(urlOrId) {
  const key = String(urlOrId);

  if (pokemonListCache.has(key)) {
    return pokemonListCache.get(key);
  }

  const detailsResponse = await fetch(
    key.startsWith('http') ? key : `${API_BASE_URL}/pokemon/${key}`
  );

  if (!detailsResponse.ok) {
    throw new Error('Falha ao carregar detalhes dos Pokémons.');
  }

  const details = await detailsResponse.json();

  const summary = {
    id: details.id,
    name: capitalize(details.name),
    image:
      details.sprites.other['official-artwork'].front_default ||
      details.sprites.front_default,
    types: details.types.map((t) => t.type.name),
    height: details.height,
    weight: details.weight
  };

  pokemonListCache.set(key, summary);
  pokemonListCache.set(String(summary.id), summary);
  pokemonListCache.set(details.name, summary);

  return summary;
}

export async function fetchPokemonByRegion(regionKey = 'kanto') {
  const normalizedRegion = String(regionKey).toLowerCase();

  if (regionCache.has(normalizedRegion)) {
    return regionCache.get(normalizedRegion);
  }

  const regionOption = REGION_OPTIONS.find((region) => region.key === normalizedRegion);

  if (!regionOption) {
    throw new Error('Região inválida.');
  }

  const response = await fetch(`${API_BASE_URL}/generation/${regionOption.generationId}`);

  if (!response.ok) {
    throw new Error('Não foi possível carregar os Pokémons da região selecionada.');
  }

  const data = await response.json();
  const speciesWithIds = data.pokemon_species.map((species) => ({
    ...species,
    id: Number(species.url.split('/').filter(Boolean).pop())
  }));

  const speciesSortedById = [...speciesWithIds].sort((a, b) => {
    const idA = a.id;
    const idB = b.id;
    return idA - idB;
  });

  const detailed = await Promise.all(speciesSortedById.map((item) => fetchPokemonSummary(item.id)));

  const sortedData = detailed.sort((a, b) => a.id - b.id);
  regionCache.set(normalizedRegion, sortedData);

  return sortedData;
}

export async function fetchAllKantoPokemon() {
  return fetchPokemonByRegion('kanto');
}

export async function fetchAllPokemonFromAllRegions() {
  const allRegions = await Promise.all(REGION_OPTIONS.map((region) => fetchPokemonByRegion(region.key)));
  return allRegions.flat().sort((a, b) => a.id - b.id);
}

export async function fetchPokemonDetails(idOrName) {
  const key = String(idOrName).toLowerCase();

  if (detailsCache.has(key)) {
    return detailsCache.get(key);
  }

  const response = await fetch(`${API_BASE_URL}/pokemon/${key}`);

  if (!response.ok) {
    throw new Error('Não foi possível carregar os detalhes do Pokémon.');
  }

  const details = await response.json();

  const payload = {
    id: details.id,
    name: capitalize(details.name),
    image:
      details.sprites.other['official-artwork'].front_default ||
      details.sprites.front_default,
    shinyImage:
      details.sprites.other['official-artwork'].front_shiny ||
      details.sprites.front_shiny ||
      details.sprites.other['official-artwork'].front_default ||
      details.sprites.front_default,
    types: details.types.map((t) => t.type.name),
    abilities: details.abilities.map((a) => capitalize(a.ability.name)),
    stats: details.stats.map((s) => ({
      name: s.stat.name,
      base: s.base_stat
    })),
    baseExperience: details.base_experience || 0,
    order: details.order,
    movesCount: details.moves.length,
    totalStats: details.stats.reduce((acc, stat) => acc + stat.base_stat, 0),
    heldItemsCount: details.held_items.length,
    height: details.height,
    weight: details.weight
  };

  detailsCache.set(key, payload);
  detailsCache.set(String(payload.id), payload);

  return payload;
}

export async function searchPokemonByNameOrId(rawQuery) {
  const normalizedQuery = rawQuery.trim().toLowerCase();

  if (!normalizedQuery) {
    return null;
  }

  const pokemon = await fetchPokemonDetails(normalizedQuery);

  return pokemon;
}

export async function searchPokemonSuggestions(rawQuery, regionKey = 'kanto') {
  const normalizedQuery = rawQuery.trim().toLowerCase();

  if (!normalizedQuery || normalizedQuery.length < 2) {
    return [];
  }

  const regionPokemon = await fetchPokemonByRegion(regionKey);
  const suggestions = regionPokemon
    .filter((pokemon) => {
      const pokemonId = String(pokemon.id);
      return (
        pokemon.name.toLowerCase().includes(normalizedQuery) ||
        pokemonId.startsWith(normalizedQuery)
      );
    })
    .slice(0, 8);

  return suggestions;
}

function collectEvolutionNames(chainNode, acc) {
  acc.push(chainNode.species.name);
  chainNode.evolves_to.forEach((nextNode) => collectEvolutionNames(nextNode, acc));
}

export async function fetchEvolutionChainByPokemonId(pokemonId) {
  const speciesResponse = await fetch(`${API_BASE_URL}/pokemon-species/${pokemonId}`);

  if (!speciesResponse.ok) {
    throw new Error('Não foi possível carregar a espécie do Pokémon.');
  }

  const speciesData = await speciesResponse.json();
  const evolutionResponse = await fetch(speciesData.evolution_chain.url);

  if (!evolutionResponse.ok) {
    throw new Error('Não foi possível carregar a cadeia evolutiva.');
  }

  const evolutionData = await evolutionResponse.json();
  const names = [];
  collectEvolutionNames(evolutionData.chain, names);

  const uniqueNames = [...new Set(names)];
  const details = await Promise.all(uniqueNames.map((name) => fetchPokemonDetails(name)));

  return details
    .sort((a, b) => a.id - b.id)
    .map((pokemon) => ({
      id: pokemon.id,
      name: pokemon.name,
      image: pokemon.image
    }));
}

const API_BASE_URL = 'https://pokeapi.co/api/v2';
const KANTO_LIMIT = 151;
const kantoListCache = new Map();
const detailsCache = new Map();

function capitalize(text) {
  if (!text) {
    return '';
  }

  return text.charAt(0).toUpperCase() + text.slice(1);
}

export async function fetchPokemonList(offset = 0, limit = 20) {
  const safeOffset = Math.max(0, offset);
  const remaining = KANTO_LIMIT - safeOffset;
  const safeLimit = Math.min(limit, remaining);

  if (safeLimit <= 0) {
    return [];
  }

  const response = await fetch(
    `${API_BASE_URL}/pokemon?limit=${safeLimit}&offset=${safeOffset}`
  );

  if (!response.ok) {
    throw new Error('Nao foi possivel carregar a lista de Pokemon.');
  }

  const data = await response.json();

  const detailed = await Promise.all(data.results.map((item) => fetchPokemonSummary(item.url)));

  return detailed;
}

async function fetchPokemonSummary(urlOrId) {
  const key = String(urlOrId);

  if (kantoListCache.has(key)) {
    return kantoListCache.get(key);
  }

  const detailsResponse = await fetch(
    key.startsWith('http') ? key : `${API_BASE_URL}/pokemon/${key}`
  );

  if (!detailsResponse.ok) {
    throw new Error('Falha ao carregar detalhes dos Pokemon.');
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

  kantoListCache.set(key, summary);
  kantoListCache.set(String(summary.id), summary);
  kantoListCache.set(details.name, summary);

  return summary;
}

export async function fetchAllKantoPokemon() {
  const response = await fetch(`${API_BASE_URL}/pokemon?limit=${KANTO_LIMIT}&offset=0`);

  if (!response.ok) {
    throw new Error('Nao foi possivel carregar a lista completa de Pokemon.');
  }

  const data = await response.json();
  const detailed = await Promise.all(data.results.map((item) => fetchPokemonSummary(item.url)));

  return detailed.sort((a, b) => a.id - b.id);
}

export async function fetchPokemonDetails(idOrName) {
  const key = String(idOrName).toLowerCase();

  if (detailsCache.has(key)) {
    return detailsCache.get(key);
  }

  const response = await fetch(`${API_BASE_URL}/pokemon/${key}`);

  if (!response.ok) {
    throw new Error('Nao foi possivel carregar os detalhes do Pokemon.');
  }

  const details = await response.json();

  const payload = {
    id: details.id,
    name: capitalize(details.name),
    image:
      details.sprites.other['official-artwork'].front_default ||
      details.sprites.front_default,
    types: details.types.map((t) => t.type.name),
    abilities: details.abilities.map((a) => capitalize(a.ability.name)),
    stats: details.stats.map((s) => ({
      name: s.stat.name,
      base: s.base_stat
    })),
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

  if (pokemon.id > KANTO_LIMIT) {
    throw new Error('Este Pokemon nao pertence a primeira geracao.');
  }

  return pokemon;
}

export async function searchPokemonSuggestions(rawQuery) {
  const normalizedQuery = rawQuery.trim().toLowerCase();

  if (!normalizedQuery || normalizedQuery.length < 2) {
    return [];
  }

  const allPokemon = await fetchAllKantoPokemon();
  const suggestions = allPokemon
    .filter((pokemon) => pokemon.name.toLowerCase().includes(normalizedQuery))
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
    throw new Error('Nao foi possivel carregar a especie do Pokemon.');
  }

  const speciesData = await speciesResponse.json();
  const evolutionResponse = await fetch(speciesData.evolution_chain.url);

  if (!evolutionResponse.ok) {
    throw new Error('Nao foi possivel carregar a cadeia evolutiva.');
  }

  const evolutionData = await evolutionResponse.json();
  const names = [];
  collectEvolutionNames(evolutionData.chain, names);

  const uniqueNames = [...new Set(names)];
  const details = await Promise.all(uniqueNames.map((name) => fetchPokemonDetails(name)));

  return details
    .filter((pokemon) => pokemon.id <= KANTO_LIMIT)
    .sort((a, b) => a.id - b.id)
    .map((pokemon) => ({
      id: pokemon.id,
      name: pokemon.name,
      image: pokemon.image
    }));
}

export { KANTO_LIMIT };

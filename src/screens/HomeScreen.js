import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import PokemonCard from '../components/PokemonCard';
import {
  fetchAllKantoPokemon,
  KANTO_LIMIT,
  searchPokemonByNameOrId,
  searchPokemonSuggestions
} from '../services/pokeapi';
import { getFavoriteIds, toggleFavoriteId } from '../services/favoritesStorage';
import { getTypeColor, KANTO_TYPES, getTypeTextColor } from '../utils/pokemonTypes';

const SORT_MODES = [
  { key: 'id', label: 'Numero' },
  { key: 'name', label: 'Nome' }
];

export default function HomeScreen({ navigation }) {
  const [pokemonList, setPokemonList] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [selectedType, setSelectedType] = useState('all');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [sortMode, setSortMode] = useState('id');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const trimmedSearch = useMemo(() => searchText.trim(), [searchText]);
  const visiblePokemon = useMemo(() => {
    let filtered = [...pokemonList];

    if (selectedType !== 'all') {
      filtered = filtered.filter((pokemon) => pokemon.types.includes(selectedType));
    }

    if (showOnlyFavorites) {
      filtered = filtered.filter((pokemon) => favoriteIds.includes(pokemon.id));
    }

    if (sortMode === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      filtered.sort((a, b) => a.id - b.id);
    }

    return filtered;
  }, [pokemonList, selectedType, showOnlyFavorites, favoriteIds, sortMode]);

  const loadFavorites = useCallback(async () => {
    try {
      const ids = await getFavoriteIds();
      setFavoriteIds(ids);
    } catch {
      setFavoriteIds([]);
    }
  }, []);

  const loadInitialPokemon = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchAllKantoPokemon();
      setPokemonList(data);
    } catch (err) {
      setError(err.message || 'Erro ao carregar pokemons.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearchPokemon = useCallback(async () => {
    if (!trimmedSearch) {
      await loadInitialPokemon();
      return;
    }

    try {
      setLoading(true);
      setError('');
      const data = await searchPokemonByNameOrId(trimmedSearch);
      setPokemonList(data ? [data] : []);
      setSelectedType('all');
    } catch (err) {
      setPokemonList([]);
      setError(err.message || 'Pokemon nao encontrado.');
    } finally {
      setLoading(false);
    }
  }, [trimmedSearch, loadInitialPokemon]);

  useEffect(() => {
    loadInitialPokemon();
  }, [loadInitialPokemon]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [loadFavorites])
  );

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      handleSearchPokemon();
    }, 450);

    return () => clearTimeout(delayDebounce);
  }, [handleSearchPokemon]);

  useEffect(() => {
    const loadSuggestions = async () => {
      if (!trimmedSearch) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        const results = await searchPokemonSuggestions(trimmedSearch);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    loadSuggestions();
  }, [trimmedSearch]);

  function handleSelectSuggestion(pokemon) {
    setPokemonList([pokemon]);
    setSearchText(pokemon.name);
    setShowSuggestions(false);
    setSelectedType('all');
    setSuggestions([]);
  }

  function renderFooter() {
    if (visiblePokemon.length === 0 || loading) {
      return null;
    }

    return (
      <Text style={styles.footerInfo}>
        Exibindo {visiblePokemon.length} de {pokemonList.length} Pokemon carregados.
      </Text>
    );
  }

  async function handleToggleFavorite(id) {
    try {
      const ids = await toggleFavoriteId(id);
      setFavoriteIds(ids);
    } catch {
      setError('Nao foi possivel atualizar os favoritos.');
    }
  }

  async function handleRefresh() {
    try {
      setRefreshing(true);
      setError('');
      const [pokemonData, ids] = await Promise.all([
        fetchAllKantoPokemon(),
        getFavoriteIds()
      ]);
      setPokemonList(pokemonData);
      setFavoriteIds(ids);
    } catch (err) {
      setError(err.message || 'Erro ao atualizar a Pokedex.');
    } finally {
      setRefreshing(false);
    }
  }

  function clearFilters() {
    setSelectedType('all');
    setShowOnlyFavorites(false);
    setSortMode('id');
    setSearchText('');
    setSuggestions([]);
    setShowSuggestions(false);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.deviceTop}>
          <View style={styles.topLightsRow}>
            <View style={[styles.light, styles.lightBlue]} />
            <View style={[styles.light, styles.lightRed]} />
            <View style={[styles.light, styles.lightYellow]} />
            <View style={[styles.light, styles.lightGreen]} />
          </View>
          <Text style={styles.title}>POKEDEX KANTO</Text>
          <Text style={styles.subtitle}>Primeira geracao ({KANTO_LIMIT} Pokemon)</Text>
        </View>

        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nome (ex: pikachu)"
          autoCapitalize="none"
          value={searchText}
          onChangeText={setSearchText}
        />

        {showSuggestions && suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {suggestions.map((pokemon) => (
              <Pressable
                key={pokemon.id}
                style={styles.suggestionItem}
                onPress={() => handleSelectSuggestion(pokemon)}
              >
                <Text style={styles.suggestionText}>{pokemon.name}</Text>
                <Text style={styles.suggestionId}>#{String(pokemon.id).padStart(3, '0')}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.filterTopRow}>
          <Pressable
            style={[styles.favoriteToggle, showOnlyFavorites && styles.favoriteToggleActive]}
            onPress={() => setShowOnlyFavorites((prev) => !prev)}
          >
            <Text style={styles.favoriteToggleText}>
              {showOnlyFavorites ? 'Mostrando favoritos' : 'Ver apenas favoritos'}
            </Text>
          </Pressable>

          <Pressable style={styles.resetButton} onPress={clearFilters}>
            <Text style={styles.resetButtonText}>Limpar filtros</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sortContainer}
          style={{ flexShrink: 0 }}
          nestedScrollEnabled={true}
        >
          {SORT_MODES.map((sortItem) => {
            const isSelected = sortMode === sortItem.key;
            return (
              <Pressable
                key={sortItem.key}
                style={[styles.sortChip, isSelected && styles.sortChipActive]}
                onPress={() => setSortMode(sortItem.key)}
              >
                <Text style={[styles.sortText, isSelected && styles.sortTextActive]}>
                  Ordenar por {sortItem.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.typeFiltersContainer}
          style={{ flexShrink: 0 }}
          nestedScrollEnabled={true}
        >
          {KANTO_TYPES.map((typeName) => {
            const isSelected = selectedType === typeName;
            const bgColor = typeName === 'all' ? '#495057' : getTypeColor(typeName);
            const textColor = typeName === 'all' ? '#fff' : getTypeTextColor(typeName);

            return (
              <Pressable
                key={typeName}
                style={[
                  styles.typeFilterChip,
                  { backgroundColor: bgColor },
                  isSelected && styles.typeFilterChipActive
                ]}
                onPress={() => setSelectedType(typeName)}
              >
                <Text style={[styles.typeFilterText, { color: textColor }]}>
                  {typeName === 'all' ? 'todos' : typeName}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {loading && visiblePokemon.length === 0 ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#e63946" />
          </View>
        ) : (
          <FlatList
            data={visiblePokemon}
            keyExtractor={(item) => String(item.id)}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            renderItem={({ item }) => (
              <PokemonCard
                pokemon={item}
                isFavorite={favoriteIds.includes(item.id)}
                onToggleFavorite={handleToggleFavorite}
                onPress={() =>
                  navigation.navigate('PokemonDetails', {
                    pokemonId: item.id
                  })
                }
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Nenhum pokemon encontrado.</Text>
            }
            ListFooterComponent={renderFooter}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f1ee'
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8
  },
  deviceTop: {
    backgroundColor: '#cf1124',
    borderRadius: 18,
    borderWidth: 3,
    borderColor: '#2b2d42',
    padding: 12,
    marginBottom: 10
  },
  topLightsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8
  },
  light: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#101010'
  },
  lightBlue: { backgroundColor: '#4dabf7' },
  lightRed: { backgroundColor: '#ff6b6b' },
  lightYellow: { backgroundColor: '#ffd43b' },
  lightGreen: { backgroundColor: '#69db7c' },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff'
  },
  subtitle: {
    fontSize: 14,
    color: '#f8f9fa',
    fontWeight: '600'
  },
  searchInput: {
    backgroundColor: '#fffdf5',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 2,
    borderColor: '#2b2d42',
    marginBottom: 10
  },
  filterTopRow: {
    marginBottom: 8,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center'
  },
  favoriteToggle: {
    backgroundColor: '#fffdf5',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: '#2b2d42',
    justifyContent: 'center',
    alignItems: 'center'
  },
  favoriteToggleActive: {
    backgroundColor: '#ffd43b'
  },
  favoriteToggleText: {
    fontWeight: '700',
    color: '#212529'
  },
  resetButton: {
    backgroundColor: '#2b2d42',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: '#101524',
    justifyContent: 'center',
    alignItems: 'center'
  },
  resetButtonText: {
    color: '#fff',
    fontWeight: '700'
  },
  sortContainer: {
    paddingBottom: 10,
    gap: 8,
    minHeight: 50,
    alignItems: 'center'
  },
  sortChip: {
    borderWidth: 2,
    borderColor: '#2b2d42',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#fffdf5',
    justifyContent: 'center',
    alignItems: 'center'
  },
  sortChipActive: {
    backgroundColor: '#2b2d42'
  },
  sortText: {
    color: '#2b2d42',
    fontWeight: '700'
  },
  sortTextActive: {
    color: '#fff'
  },
  typeFiltersContainer: {
    paddingBottom: 10,
    gap: 8,
    minHeight: 60,
    alignItems: 'center'
  },
  typeFilterChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#212529',
    justifyContent: 'center',
    alignItems: 'center'
  },
  typeFilterChipActive: {
    transform: [{ scale: 1.05 }]
  },
  typeFilterText: {
    textTransform: 'uppercase',
    fontWeight: '800',
    fontSize: 13,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1
  },
  errorText: {
    color: '#c92a2a',
    marginBottom: 10,
    fontWeight: '500'
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  listContent: {
    paddingBottom: 20
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#868e96'
  },
  footerInfo: {
    textAlign: 'center',
    color: '#6c757d',
    marginVertical: 10,
    fontWeight: '600'
  },
  suggestionsContainer: {
    backgroundColor: '#fffdf5',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#2b2d42',
    marginBottom: 10,
    maxHeight: 250,
    overflow: 'hidden'
  },
  suggestionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef'
  },
  suggestionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212529'
  },
  suggestionId: {
    fontSize: 13,
    fontWeight: '700',
    color: '#868e96'
  }
});

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PokemonCard from '../components/PokemonCard';
import {
  fetchPokemonDetails,
  fetchPokemonByRegion,
  REGION_OPTIONS,
  searchPokemonByNameOrId,
  searchPokemonSuggestions
} from '../services/pokeapi';
import { getFavoriteIds, toggleFavoriteId } from '../services/favoritesStorage';
import { getTypeColor, POKEMON_TYPES, getTypeTextColor } from '../utils/pokemonTypes';

const SORT_MODES = [
  { key: 'id', label: 'Número' },
  { key: 'name', label: 'Nome' }
];

export default function HomeScreen({ navigation }) {
  const [pokemonList, setPokemonList] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [favoritePokemonList, setFavoritePokemonList] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('kanto');
  const [selectedTypes, setSelectedTypes] = useState(['all']);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [isRegionLoading, setIsRegionLoading] = useState(false);
  const [sortMode, setSortMode] = useState('id');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const lastScrollY = useRef(0);
  const listRequestIdRef = useRef(0);
  const favoritesRequestIdRef = useRef(0);
  const suggestionsRequestIdRef = useRef(0);
  const activePokemonSource = useMemo(
    () => (showOnlyFavorites ? favoritePokemonList : pokemonList),
    [showOnlyFavorites, favoritePokemonList, pokemonList]
  );

  useEffect(() => {
    const isNewArchitectureEnabled = global?.nativeFabricUIManager != null;

    if (
      Platform.OS === 'android' &&
      !isNewArchitectureEnabled &&
      typeof UIManager.setLayoutAnimationEnabledExperimental === 'function'
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const animateFiltersVisibility = useCallback((nextVisible) => {
    LayoutAnimation.configureNext({
      duration: 230,
      update: {
        type: LayoutAnimation.Types.easeInEaseOut
      },
      delete: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity
      },
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity
      }
    });

    setShowFilters(nextVisible);
  }, []);

  const trimmedSearch = useMemo(() => searchText.trim(), [searchText]);
  const visiblePokemon = useMemo(() => {
    let filtered = [...activePokemonSource];

    if (!selectedTypes.includes('all')) {
      filtered = filtered.filter((pokemon) =>
        selectedTypes.some((typeName) => pokemon.types.includes(typeName))
      );
    }

    if (sortMode === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      filtered.sort((a, b) => a.id - b.id);
    }

    return filtered;
  }, [activePokemonSource, selectedTypes, sortMode]);

  const loadFavorites = useCallback(async () => {
    try {
      const ids = await getFavoriteIds();
      setFavoriteIds(ids);
    } catch {
      setFavoriteIds([]);
    }
  }, []);

  const selectedRegionLabel = useMemo(() => {
    const region = REGION_OPTIONS.find((item) => item.key === selectedRegion);
    return region?.label || 'Kanto';
  }, [selectedRegion]);

  const selectedTypeCount = useMemo(() => {
    return selectedTypes.includes('all') ? 0 : selectedTypes.length;
  }, [selectedTypes]);

  const loadInitialPokemon = useCallback(async () => {
    const requestId = ++listRequestIdRef.current;

    try {
      setLoading(true);
      setError('');
      const data = await fetchPokemonByRegion(selectedRegion);

      if (requestId === listRequestIdRef.current) {
        setPokemonList(data);
      }
    } catch (err) {
      if (requestId === listRequestIdRef.current) {
        setError(err.message || 'Erro ao carregar Pokémons.');
      }
    } finally {
      if (requestId === listRequestIdRef.current) {
        setLoading(false);
        setIsRegionLoading(false);
      }
    }
  }, [selectedRegion]);

  const loadGlobalFavoritesPokemon = useCallback(async () => {
    const requestId = ++favoritesRequestIdRef.current;

    if (favoriteIds.length === 0) {
      if (requestId === favoritesRequestIdRef.current) {
        setFavoritePokemonList([]);
      }
      return;
    }

    try {
      setLoadingFavorites(true);
      const detailsList = await Promise.all(favoriteIds.map((id) => fetchPokemonDetails(id)));
      const normalizedFavorites = detailsList.map((pokemon) => ({
        id: pokemon.id,
        name: pokemon.name,
        image: pokemon.image,
        types: pokemon.types,
        height: pokemon.height,
        weight: pokemon.weight
      }));

      if (requestId === favoritesRequestIdRef.current) {
        setFavoritePokemonList(normalizedFavorites);
      }
    } catch {
      if (requestId === favoritesRequestIdRef.current) {
        setFavoritePokemonList([]);
      }
    } finally {
      if (requestId === favoritesRequestIdRef.current) {
        setLoadingFavorites(false);
      }
    }
  }, [favoriteIds]);

  const handleSearchPokemon = useCallback(async () => {
    if (!trimmedSearch) {
      await loadInitialPokemon();
      return;
    }

    const requestId = ++listRequestIdRef.current;

    try {
      setLoading(true);
      setError('');
      const data = await searchPokemonByNameOrId(trimmedSearch);

      if (requestId === listRequestIdRef.current) {
        setPokemonList(data ? [data] : []);
        setSelectedTypes(['all']);
      }
    } catch (err) {
      if (requestId === listRequestIdRef.current) {
        setPokemonList([]);
        setError(err.message || 'Pokémon não encontrado.');
      }
    } finally {
      if (requestId === listRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, [trimmedSearch, loadInitialPokemon]);

  useEffect(() => {
    loadInitialPokemon();
  }, [loadInitialPokemon]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  useEffect(() => {
    if (!showOnlyFavorites) {
      return;
    }

    loadGlobalFavoritesPokemon();
  }, [showOnlyFavorites, loadGlobalFavoritesPokemon]);

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
      const requestId = ++suggestionsRequestIdRef.current;

      if (!trimmedSearch) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        const results = await searchPokemonSuggestions(trimmedSearch, selectedRegion);

        if (requestId === suggestionsRequestIdRef.current) {
          setSuggestions(results);
          setShowSuggestions(results.length > 0);
        }
      } catch {
        if (requestId === suggestionsRequestIdRef.current) {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      }
    };

    loadSuggestions();
  }, [trimmedSearch, selectedRegion]);

  function handleSelectSuggestion(pokemon) {
    setPokemonList([pokemon]);
    setSearchText(pokemon.name);
    setShowSuggestions(false);
    setSelectedTypes(['all']);
    setSuggestions([]);
  }

  function renderFooter() {
    if (visiblePokemon.length === 0 || loading) {
      return null;
    }

    return (
      <Text style={styles.footerInfo}>
        Exibindo {visiblePokemon.length} de {activePokemonSource.length} Pokémons carregados.
      </Text>
    );
  }

  async function handleToggleFavorite(id) {
    try {
      const ids = await toggleFavoriteId(id);
      setFavoriteIds(ids);
    } catch {
      setError('Não foi possível atualizar os favoritos.');
    }
  }

  async function handleRefresh() {
    const requestId = ++listRequestIdRef.current;

    try {
      setRefreshing(true);
      setError('');
      const [pokemonData, ids] = await Promise.all([
        fetchPokemonByRegion(selectedRegion),
        getFavoriteIds()
      ]);

      if (requestId === listRequestIdRef.current) {
        setPokemonList(pokemonData);
        setFavoriteIds(ids);
      }
    } catch (err) {
      if (requestId === listRequestIdRef.current) {
        setError(err.message || 'Erro ao atualizar a Pokédex.');
      }
    } finally {
      if (requestId === listRequestIdRef.current) {
        setRefreshing(false);
      }
    }
  }

  function clearFilters() {
    setSelectedRegion('kanto');
    setSelectedTypes(['all']);
    setShowOnlyFavorites(false);
    setSortMode('id');
    setSearchText('');
    setSuggestions([]);
    setShowSuggestions(false);
    animateFiltersVisibility(true);
  }

  function handleToggleType(typeName) {
    if (typeName === 'all') {
      setSelectedTypes(['all']);
      return;
    }

    setSelectedTypes((prev) => {
      const activeTypes = prev.filter((item) => item !== 'all');

      if (activeTypes.includes(typeName)) {
        const nextTypes = activeTypes.filter((item) => item !== typeName);
        return nextTypes.length > 0 ? nextTypes : ['all'];
      }

      if (activeTypes.length >= 2) {
        Alert.alert('Limite de tipos', 'Voce pode selecionar no maximo 2 tipos por vez.');
        return prev;
      }

      return [...activeTypes, typeName];
    });
  }

  const handleListScroll = useCallback(
    (event) => {
      const currentY = event.nativeEvent.contentOffset.y;
      const delta = currentY - lastScrollY.current;

      if (Math.abs(delta) < 16) {
        return;
      }

      // Auto-hide only when scrolling down; reopening is manual via button.
      if (delta > 0 && currentY > 24 && showFilters) {
        animateFiltersVisibility(false);
      }

      lastScrollY.current = currentY;
    },
    [animateFiltersVisibility, showFilters]
  );

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
          <Text style={styles.title}>POKÉDEX</Text>
          <Text style={styles.subtitle}>
            {showOnlyFavorites
              ? `Favoritos globais (${favoritePokemonList.length} Pokémon)`
              : `Região atual: ${selectedRegionLabel} (${pokemonList.length} Pokémon)`}
          </Text>
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
            style={styles.toggleFiltersButton}
            onPress={() => {
              animateFiltersVisibility(!showFilters);
              lastScrollY.current = 0;
            }}
          >
            <Text style={styles.toggleFiltersButtonText}>{showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}</Text>
          </Pressable>

          <Pressable style={styles.resetButton} onPress={clearFilters}>
            <Text style={styles.resetButtonText}>Limpar filtros</Text>
          </Pressable>
        </View>

        {isRegionLoading && (
          <View style={styles.regionLoadingNotice}>
            <ActivityIndicator size="small" color="#cf1124" />
            <Text style={styles.regionLoadingText}>Carregando região: {selectedRegionLabel}</Text>
          </View>
        )}

        {showFilters && (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.regionContainer}
              style={{ flexShrink: 0 }}
              nestedScrollEnabled={true}
            >
              {REGION_OPTIONS.map((region) => {
                const isSelected = selectedRegion === region.key;

                return (
                  <Pressable
                    key={region.key}
                    style={[styles.regionChip, isSelected && styles.regionChipActive]}
                    onPress={() => {
                      if (region.key === selectedRegion) {
                        return;
                      }

                      setIsRegionLoading(true);
                      setSelectedRegion(region.key);
                      setSearchText('');
                      setSuggestions([]);
                      setShowSuggestions(false);
                    }}
                  >
                    <Text style={[styles.regionText, isSelected && styles.regionTextActive]}>{region.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable
              style={[styles.favoriteToggle, showOnlyFavorites && styles.favoriteToggleActive]}
              onPress={() => {
                const next = !showOnlyFavorites;
                setShowOnlyFavorites(next);

                if (next) {
                  loadGlobalFavoritesPokemon();
                }
              }}
            >
              <Text style={styles.favoriteToggleText}>
                {showOnlyFavorites ? 'Favoritos globais ativos' : 'Ver favoritos globais'}
              </Text>
            </Pressable>

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
              <View style={styles.typeCounterPill}>
                <Text style={styles.typeCounterText}>Tipos: {selectedTypeCount}/2</Text>
              </View>

              {POKEMON_TYPES.map((typeName) => {
                const isSelected = selectedTypes.includes(typeName);
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
                    onPress={() => handleToggleType(typeName)}
                  >
                    <Text style={[styles.typeFilterText, { color: textColor }]}>
                      {typeName === 'all' ? 'todos' : typeName}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </>
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {(loading || (showOnlyFavorites && loadingFavorites)) && visiblePokemon.length === 0 ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#e63946" />
          </View>
        ) : (
          <FlatList
            data={visiblePokemon}
            keyExtractor={(item) => String(item.id)}
            onScroll={handleListScroll}
            scrollEventThrottle={16}
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
              <Text style={styles.emptyText}>Nenhum Pokémon encontrado.</Text>
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
  toggleFiltersButton: {
    flex: 1,
    backgroundColor: '#fffdf5',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: '#2b2d42',
    justifyContent: 'center',
    alignItems: 'center'
  },
  toggleFiltersButtonText: {
    fontWeight: '700',
    color: '#212529'
  },
  regionContainer: {
    paddingBottom: 10,
    gap: 8,
    minHeight: 50,
    alignItems: 'center'
  },
  regionChip: {
    borderWidth: 2,
    borderColor: '#2b2d42',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#fffdf5',
    justifyContent: 'center',
    alignItems: 'center'
  },
  regionChipActive: {
    backgroundColor: '#cf1124',
    borderColor: '#8d0b1b'
  },
  regionText: {
    color: '#2b2d42',
    fontWeight: '700'
  },
  regionTextActive: {
    color: '#fff'
  },
  favoriteToggle: {
    backgroundColor: '#fffdf5',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: '#2b2d42',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10
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
  typeCounterPill: {
    backgroundColor: '#2b2d42',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#101524',
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  typeCounterText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12
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
  regionLoadingNotice: {
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#ffd8d8',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  regionLoadingText: {
    color: '#7f1d1d',
    fontWeight: '600'
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

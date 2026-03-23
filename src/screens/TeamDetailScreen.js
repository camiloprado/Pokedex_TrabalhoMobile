import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TEAMS_STORAGE_KEY = 'pokedex_teams';
const POKEAPI_LIST_URL = 'https://pokeapi.co/api/v2/pokemon?limit=1025';

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function extractPokemonId(url) {
  return Number(url.split('/').filter(Boolean).pop());
}

function artworkUrl(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

export default function TeamDetailScreen({ route, navigation }) {
  const { teamId } = route.params;
  const [team, setTeam] = useState(null);
  const [allPokemon, setAllPokemon] = useState([]);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 280);

    return () => clearTimeout(timeout);
  }, [query]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [teamsRaw, pokemonResponse] = await Promise.all([
        AsyncStorage.getItem(TEAMS_STORAGE_KEY),
        fetch(POKEAPI_LIST_URL)
      ]);

      if (!pokemonResponse.ok) {
        throw new Error('Falha ao carregar lista de pokemons.');
      }

      const teams = teamsRaw ? JSON.parse(teamsRaw) : [];
      const foundTeam = teams.find((item) => item.id === teamId);

      if (!foundTeam) {
        Alert.alert('Erro', 'Time nao encontrado.');
        navigation.goBack();
        return;
      }

      const pokemonData = await pokemonResponse.json();
      const parsedPokemon = pokemonData.results.map((item) => {
        const id = extractPokemonId(item.url);
        return {
          id,
          name: item.name,
          image: artworkUrl(id)
        };
      });

      setAllPokemon(parsedPokemon);
      setTeam(foundTeam);
    } catch (error) {
      Alert.alert('Erro', error.message || 'Nao foi possivel carregar o time.');
    } finally {
      setLoading(false);
    }
  }, [teamId, navigation]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const persistTeam = useCallback(
    async (nextTeam) => {
      try {
        setSaving(true);
        const teamsRaw = await AsyncStorage.getItem(TEAMS_STORAGE_KEY);
        const teams = teamsRaw ? JSON.parse(teamsRaw) : [];
        const updatedTeams = teams.map((item) =>
          item.id === nextTeam.id ? nextTeam : item
        );
        await AsyncStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(updatedTeams));
        setTeam(nextTeam);
      } catch {
        Alert.alert('Erro', 'Nao foi possivel salvar o time.');
      } finally {
        setSaving(false);
      }
    },
    []
  );

  const filteredPokemon = useMemo(() => {
    const normalizedQuery = debouncedQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return allPokemon;
    }

    return allPokemon
      .filter((pokemon) =>
        pokemon.name.toLowerCase().includes(normalizedQuery) ||
        String(pokemon.id) === normalizedQuery
      );
  }, [allPokemon, debouncedQuery]);

  const visiblePokemon = useMemo(() => {
    const pageSize = 40;
    return filteredPokemon.slice(0, page * pageSize);
  }, [filteredPokemon, page]);

  const teamPokemonIds = useMemo(() => {
    return new Set((team?.pokemon || []).map((item) => item.id));
  }, [team]);

  const handleAddPokemon = useCallback(
    (pokemon) => {
      if (!team) {
        return;
      }

      if (teamPokemonIds.has(pokemon.id)) {
        Alert.alert('Aviso', 'Este pokemon ja esta no time.');
        return;
      }

      if (team.pokemon.length >= 6) {
        Alert.alert('Aviso', 'Um time pode ter no maximo 6 pokemons.');
        return;
      }

      const nextTeam = {
        ...team,
        pokemon: [...team.pokemon, pokemon]
      };

      persistTeam(nextTeam);
    },
    [team, teamPokemonIds, persistTeam]
  );

  const handleRemovePokemon = useCallback(
    (pokemonId) => {
      if (!team) {
        return;
      }

      const nextTeam = {
        ...team,
        pokemon: team.pokemon.filter((item) => item.id !== pokemonId)
      };

      persistTeam(nextTeam);
    },
    [team, persistTeam]
  );

  if (loading || !team) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#cf1124" />
          <Text style={styles.loadingText}>Carregando time...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerCard}>
          <Text style={styles.teamName}>{team.name}</Text>
          <Text style={styles.teamSubtitle}>{team.pokemon.length}/6 pokemons</Text>
        </View>

        <Text style={styles.sectionTitle}>Pokemons selecionados</Text>
        <View style={styles.selectedContainer}>
          {team.pokemon.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum pokemon no time.</Text>
          ) : (
            team.pokemon.map((pokemon) => (
              <View key={pokemon.id} style={styles.selectedItem}>
                <Image source={{ uri: pokemon.image }} style={styles.selectedImage} />
                <View style={styles.selectedInfo}>
                  <Text style={styles.selectedName}>{capitalize(pokemon.name)}</Text>
                  <Text style={styles.selectedId}>#{pokemon.id}</Text>
                </View>
                <Pressable
                  onPress={() => handleRemovePokemon(pokemon.id)}
                  style={styles.removeButton}
                >
                  <Text style={styles.removeButtonText}>Remover</Text>
                </Pressable>
              </View>
            ))
          )}
        </View>

        <Text style={styles.sectionTitle}>Adicionar pokemon</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar por nome ou numero"
          style={styles.searchInput}
        />

        <FlatList
          data={visiblePokemon}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          onEndReached={() => {
            if (visiblePokemon.length < filteredPokemon.length) {
              setPage((prev) => prev + 1);
            }
          }}
          onEndReachedThreshold={0.45}
          ListFooterComponent={
            visiblePokemon.length < filteredPokemon.length ? (
              <Text style={styles.loadingMoreText}>Carregando mais...</Text>
            ) : null
          }
          renderItem={({ item }) => {
            const isAdded = teamPokemonIds.has(item.id);
            return (
              <View style={styles.pokemonItem}>
                <Image source={{ uri: item.image }} style={styles.pokemonImage} />
                <View style={styles.pokemonInfo}>
                  <Text style={styles.pokemonName}>{capitalize(item.name)}</Text>
                  <Text style={styles.pokemonId}>#{item.id}</Text>
                </View>
                <Pressable
                  onPress={() => handleAddPokemon(item)}
                  style={[styles.addButton, (isAdded || saving) && styles.addButtonDisabled]}
                  disabled={isAdded || saving}
                >
                  <Text style={styles.addButtonText}>{isAdded ? 'Adicionado' : 'Adicionar'}</Text>
                </Pressable>
              </View>
            );
          }}
        />
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
    paddingVertical: 12
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingText: {
    marginTop: 12,
    color: '#495057',
    fontWeight: '600'
  },
  headerCard: {
    backgroundColor: '#fffdf5',
    borderWidth: 2,
    borderColor: '#2b2d42',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12
  },
  teamName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#212529'
  },
  teamSubtitle: {
    marginTop: 4,
    color: '#868e96',
    fontWeight: '600'
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#212529',
    marginBottom: 8,
    marginTop: 8
  },
  selectedContainer: {
    backgroundColor: '#fffdf5',
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderRadius: 12,
    padding: 8
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
    paddingVertical: 8,
    paddingHorizontal: 6
  },
  selectedImage: {
    width: 44,
    height: 44
  },
  selectedInfo: {
    flex: 1,
    marginLeft: 8
  },
  selectedName: {
    fontWeight: '700',
    color: '#212529'
  },
  selectedId: {
    color: '#868e96',
    fontSize: 12
  },
  removeButton: {
    backgroundColor: '#fa5252',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  removeButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12
  },
  emptyText: {
    color: '#868e96',
    fontStyle: 'italic',
    padding: 8
  },
  searchInput: {
    backgroundColor: '#fffdf5',
    borderWidth: 2,
    borderColor: '#dee2e6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8
  },
  listContent: {
    paddingBottom: 20
  },
  pokemonItem: {
    backgroundColor: '#fffdf5',
    borderWidth: 2,
    borderColor: '#2b2d42',
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center'
  },
  pokemonImage: {
    width: 52,
    height: 52
  },
  pokemonInfo: {
    flex: 1,
    marginLeft: 8
  },
  pokemonName: {
    fontWeight: '700',
    color: '#212529'
  },
  pokemonId: {
    color: '#868e96',
    fontSize: 12
  },
  addButton: {
    backgroundColor: '#2f9e44',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  addButtonDisabled: {
    backgroundColor: '#adb5bd'
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12
  },
  loadingMoreText: {
    textAlign: 'center',
    color: '#868e96',
    fontWeight: '600',
    marginTop: 6,
    marginBottom: 8
  }
});

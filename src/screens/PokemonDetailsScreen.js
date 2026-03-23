import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  PanResponder
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchEvolutionChainByPokemonId, fetchPokemonDetails } from '../services/pokeapi';
import { getFavoriteIds, toggleFavoriteId } from '../services/favoritesStorage';
import { getTypeColor, getTypeTextColor, getTypeBackgroundColor } from '../utils/pokemonTypes';

const TYPE_EFFECTIVENESS = {
  normal: { weakTo: ['fighting'], resistantTo: [], immuneTo: ['ghost'] },
  fighting: { weakTo: ['flying', 'psychic', 'fairy'], resistantTo: ['rock', 'bug', 'dark'], immuneTo: [] },
  flying: { weakTo: ['rock', 'electric', 'ice'], resistantTo: ['fighting', 'bug', 'grass'], immuneTo: ['ground'] },
  poison: { weakTo: ['ground', 'psychic'], resistantTo: ['fighting', 'poison', 'bug', 'grass'], immuneTo: [] },
  ground: { weakTo: ['water', 'grass', 'ice'], resistantTo: ['poison', 'rock'], immuneTo: ['electric'] },
  rock: { weakTo: ['water', 'grass', 'fighting', 'ground', 'steel'], resistantTo: ['normal', 'flying', 'poison', 'fire'], immuneTo: [] },
  bug: { weakTo: ['flying', 'rock', 'fire'], resistantTo: ['fighting', 'ground', 'grass'], immuneTo: [] },
  ghost: { weakTo: ['ghost', 'dark'], resistantTo: ['poison', 'bug'], immuneTo: ['normal', 'fighting'] },
  steel: { weakTo: ['fire', 'water', 'ground'], resistantTo: ['normal', 'flying', 'rock', 'bug', 'grass', 'psychic', 'ice', 'dragon', 'fairy'], immuneTo: ['poison'] },
  fire: { weakTo: ['water', 'ground', 'rock'], resistantTo: ['bug', 'steel', 'grass', 'fairy', 'fire', 'ice'], immuneTo: [] },
  water: { weakTo: ['electric', 'grass'], resistantTo: ['steel', 'fire', 'water', 'ice'], immuneTo: [] },
  grass: { weakTo: ['flying', 'poison', 'bug', 'fire', 'ice'], resistantTo: ['ground', 'water', 'grass', 'electric'], immuneTo: [] },
  electric: { weakTo: ['ground'], resistantTo: ['flying', 'steel', 'electric'], immuneTo: [] },
  psychic: { weakTo: ['bug', 'ghost', 'dark'], resistantTo: ['fighting', 'psychic'], immuneTo: [] },
  ice: { weakTo: ['fire', 'fighting', 'rock', 'steel'], resistantTo: ['ice'], immuneTo: [] },
  dragon: { weakTo: ['ice', 'dragon', 'fairy'], resistantTo: ['fire', 'water', 'grass', 'electric'], immuneTo: [] },
  dark: { weakTo: ['fighting', 'bug', 'fairy'], resistantTo: ['ghost', 'dark'], immuneTo: ['psychic'] },
  fairy: { weakTo: ['poison', 'steel'], resistantTo: ['fighting', 'bug', 'dark'], immuneTo: [] }
};

const TYPE_COLORS_MAP = {
  normal: '#A8A878', fighting: '#C03028', flying: '#A890F0', poison: '#A040A0',
  ground: '#E0C068', rock: '#B8A038', bug: '#A8B820', ghost: '#705898',
  steel: '#B8B8D0', fire: '#F08030', water: '#6890F0', grass: '#78C850',
  electric: '#F8D030', psychic: '#F85888', ice: '#98D8D8', dragon: '#7038F8',
  dark: '#705848', fairy: '#EE99AC'
};

function formatNumber(id) {
  return `#${String(id).padStart(3, '0')}`;
}

function formatStatName(statName) {
  return statName.replace('-', ' ').toUpperCase();
}

export default function PokemonDetailsScreen({ route, navigation }) {
  const { pokemonId } = route.params;
  const [pokemon, setPokemon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [evolutionChain, setEvolutionChain] = useState([]);
  const [showShiny, setShowShiny] = useState(false);
  const [locations, setLocations] = useState([]);
  const panResponderRef = useRef(null);
  const showShinyRef = useRef(false);
  const detailsRequestIdRef = useRef(0);
  const shinyProgress = useRef(new Animated.Value(0)).current;

  const animateToMode = useCallback((nextShowShiny) => {
    setShowShiny(nextShowShiny);
    Animated.timing(shinyProgress, {
      toValue: nextShowShiny ? 1 : 0,
      duration: 260,
      useNativeDriver: true
    }).start();
  }, [shinyProgress]);

  useEffect(() => {
    showShinyRef.current = showShiny;
  }, [showShiny]);

  useEffect(() => {
    const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderRelease: (evt, { dx }) => {
        if (Math.abs(dx) > 50) {
          animateToMode(!showShinyRef.current);
        }
      }
    });
    panResponderRef.current = panResponder;
  }, [animateToMode]);

  useEffect(() => {
    const requestId = ++detailsRequestIdRef.current;

    async function loadDetails() {
      try {
        setLoading(true);
        setError('');
        setLocations([]);
        setEvolutionChain([]);
        setIsFavorite(false);

        const details = await fetchPokemonDetails(pokemonId);
        if (requestId !== detailsRequestIdRef.current) {
          return;
        }

        setPokemon(details);
        setShowShiny(false);
        showShinyRef.current = false;
        shinyProgress.setValue(0);

        const evolution = await fetchEvolutionChainByPokemonId(details.id);
        if (requestId !== detailsRequestIdRef.current) {
          return;
        }

        setEvolutionChain(evolution);

        const favoriteIds = await getFavoriteIds();
        if (requestId !== detailsRequestIdRef.current) {
          return;
        }

        setIsFavorite(favoriteIds.includes(details.id));

        loadLocations(details.id, requestId);
      } catch (err) {
        if (requestId === detailsRequestIdRef.current) {
          setError(err.message || 'Erro ao carregar detalhes.');
        }
      } finally {
        if (requestId === detailsRequestIdRef.current) {
          setLoading(false);
        }
      }
    }

    loadDetails();
  }, [pokemonId, shinyProgress]);

  const loadLocations = async (pokemonId, requestId) => {
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}/encounters`);
      if (!response.ok) {
        return;
      }

      const data = await response.json();

      if (requestId !== detailsRequestIdRef.current) {
        return;
      }

      if (data && Array.isArray(data)) {
        const uniqueLocations = [...new Set(data.map(e => e.location_area?.name || ''))].filter(Boolean).slice(0, 5);
        setLocations(uniqueLocations);
      }
    } catch (err) {
      console.error('Error loading locations:', err);
    }
  };

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#e63946" />
      </View>
    );
  }

  if (error || !pokemon) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>{error || 'Pokémon não encontrado.'}</Text>
      </View>
    );
  }

  async function handleToggleFavorite() {
    try {
      const ids = await toggleFavoriteId(pokemon.id);
      setIsFavorite(ids.includes(pokemon.id));
    } catch {
      setError('Não foi possível atualizar os favoritos.');
    }
  }

  const heightMeters = pokemon.height / 10;
  const weightKg = pokemon.weight / 10;
  const bmi = heightMeters > 0 ? (weightKg / (heightMeters * heightMeters)).toFixed(1) : '0.0';
  const primaryType = pokemon.types[0];
  const typeData = TYPE_EFFECTIVENESS[primaryType] || { weakTo: [], resistantTo: [], immuneTo: [] };
  const normalImageUri = pokemon.image;
  const shinyImageUri = pokemon.shinyImage || pokemon.image;
  const normalOpacity = shinyProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0]
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.headerCard, { backgroundColor: getTypeColor(primaryType) }]}>
        <Text style={[styles.number, { color: getTypeTextColor(primaryType) }]}>{formatNumber(pokemon.id)}</Text>
        <Pressable onPress={handleToggleFavorite} style={styles.favoriteButton}>
          <Text style={styles.favoriteButtonText}>
            {isFavorite ? '★ Favorito' : '☆ Marcar favorito'}
          </Text>
        </Pressable>
        <Pressable {...panResponderRef.current?.panHandlers} style={styles.imageContainer}>
          <View style={styles.imageStack}>
            <Animated.Image
              source={{ uri: normalImageUri }}
              style={[styles.image, styles.imageLayer, { opacity: normalOpacity }]}
            />
            <Animated.Image
              source={{ uri: shinyImageUri }}
              style={[styles.image, styles.imageLayer, { opacity: shinyProgress }]}
            />
          </View>
        </Pressable>
        <View style={styles.imageModeRow}>
          <Pressable
            style={[styles.imageModeButton, !showShiny && styles.imageModeButtonActive]}
            onPress={() => animateToMode(false)}
          >
            <Text style={[styles.imageModeText, !showShiny && styles.imageModeTextActive]}>Normal</Text>
          </Pressable>
          <Pressable
            style={[styles.imageModeButton, showShiny && styles.imageModeButtonActive]}
            onPress={() => animateToMode(true)}
          >
            <Text style={[styles.imageModeText, showShiny && styles.imageModeTextActive]}>Shiny</Text>
          </Pressable>
        </View>
        <Text style={styles.name}>{pokemon.name}</Text>
        <View style={styles.typesRow}>
          {pokemon.types.map((type) => (
            <View key={type} style={[styles.typeBadge, { backgroundColor: getTypeBackgroundColor(type) }]}>
              <Text style={[styles.typeText, { color: getTypeTextColor(type) }]}>{type}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Informações básicas</Text>
        <Text style={styles.infoText}>Altura: {heightMeters} m</Text>
        <Text style={styles.infoText}>Peso: {weightKg} kg</Text>
        <Text style={styles.infoText}>IMC estimado: {bmi}</Text>
        <Text style={styles.infoText}>Experiência base: {pokemon.baseExperience}</Text>
        <Text style={styles.infoText}>Ordem interna: {pokemon.order}</Text>
        <Text style={styles.infoText}>Total de status: {pokemon.totalStats}</Text>
        <Text style={styles.infoText}>Quantidade de movimentos: {pokemon.movesCount}</Text>
        <Text style={styles.infoText}>Itens segurados: {pokemon.heldItemsCount}</Text>

        <Text style={[styles.sectionTitle, styles.marginTop]}>Habilidades</Text>
        {pokemon.abilities.map((ability) => (
          <Text key={ability} style={styles.infoText}>
            - {ability}
          </Text>
        ))}

        <Text style={[styles.sectionTitle, styles.marginTop]}>Status base</Text>
        {pokemon.stats.map((stat) => (
          <View key={stat.name} style={styles.statRow}>
            <View style={styles.statLabelRow}>
              <Text style={styles.statName}>{formatStatName(stat.name)}</Text>
              <Text style={styles.statValue}>{stat.base}</Text>
            </View>
            <View style={styles.statTrack}>
              <View style={[styles.statFill, { width: `${Math.min((stat.base / 180) * 100, 100)}%`, backgroundColor: getTypeColor(primaryType) }]} />
            </View>
          </View>
        ))}

        <Text style={[styles.sectionTitle, styles.marginTop]}>Super efetivo</Text>
        <View style={styles.effectivenessContainer}>
          <View style={styles.effectivenessSection}>
            <Text style={styles.effectivenessLabel}>🔴 Sofre de:</Text>
            <View style={styles.typeTagsRow}>
              {typeData.weakTo.length > 0 ? (
                typeData.weakTo.map(type => (
                  <View key={type} style={[styles.typeTag, { backgroundColor: TYPE_COLORS_MAP[type] }]}>
                    <Text style={styles.typeTagText}>{type}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noneText}>Nenhum</Text>
              )}
            </View>
          </View>
          <View style={styles.effectivenessSection}>
            <Text style={styles.effectivenessLabel}>🟢 Resiste a:</Text>
            <View style={styles.typeTagsRow}>
              {typeData.resistantTo.length > 0 ? (
                typeData.resistantTo.map(type => (
                  <View key={type} style={[styles.typeTag, { backgroundColor: TYPE_COLORS_MAP[type], opacity: 0.7 }]}>
                    <Text style={styles.typeTagText}>{type}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noneText}>Nenhum</Text>
              )}
            </View>
          </View>
        </View>

        {locations.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, styles.marginTop]}>Localizações</Text>
            {locations.map((loc, idx) => (
              <Text key={idx} style={styles.infoText}>
                • {loc.replace('-', ' ')}
              </Text>
            ))}
          </>
        )}

        <Pressable style={styles.movesButton} onPress={() => navigation.navigate('Moves', { pokemon })}>
          <Text style={styles.movesButtonText}>Ver Movimentos →</Text>
        </Pressable>

        <Text style={[styles.sectionTitle, styles.marginTop]}>Cadeia evolutiva</Text>
        {evolutionChain.length === 0 ? (
          <Text style={styles.infoText}>Cadeia evolutiva indisponível.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.evolutionRow}>
              {evolutionChain.map((evolution, index) => (
                <View key={evolution.id} style={styles.evolutionItem}>
                  <Image source={{ uri: evolution.image }} style={styles.evolutionImage} />
                  <Text style={styles.evolutionName}>{evolution.name}</Text>
                  {index < evolutionChain.length - 1 && <Text style={styles.evolutionArrow}>→</Text>}
                </View>
              ))}
            </View>
          </ScrollView>
        )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f1ee' },
  centeredContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f1ee', padding: 20 },
  errorText: { color: '#c92a2a', fontWeight: '600', textAlign: 'center' },
  container: { padding: 16, backgroundColor: '#f5f1ee' },
  headerCard: { borderRadius: 22, padding: 16, alignItems: 'center', borderWidth: 3, borderColor: '#2b2d42', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 11, elevation: 8 },
  number: { fontWeight: '700', fontSize: 14, alignSelf: 'flex-start' },
  favoriteButton: { marginTop: 8, backgroundColor: '#fffdf5', borderRadius: 999, borderWidth: 2, borderColor: '#2b2d42', paddingHorizontal: 14, paddingVertical: 8 },
  favoriteButtonText: { fontWeight: '800', color: '#2b2d42' },
  imageContainer: { alignItems: 'center', marginVertical: 8 },
  imageStack: {
    width: 180,
    height: 180,
    position: 'relative'
  },
  imageLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0
  },
  image: { width: 180, height: 180 },
  imageModeRow: {
    flexDirection: 'row',
    backgroundColor: '#fffdf5',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#2b2d42',
    padding: 3,
    marginBottom: 6
  },
  imageModeButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999
  },
  imageModeButtonActive: {
    backgroundColor: '#2b2d42'
  },
  imageModeText: {
    color: '#2b2d42',
    fontWeight: '700',
    fontSize: 12
  },
  imageModeTextActive: {
    color: '#fff'
  },
  name: { fontSize: 28, fontWeight: '800', color: '#fff' },
  typesRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  typeBadge: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  typeText: { fontWeight: '700', textTransform: 'uppercase', textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 1 },
  infoCard: { marginTop: 16, backgroundColor: '#faf8f6', borderRadius: 22, padding: 16, borderWidth: 2, borderColor: '#e0d5ce' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#343a40', marginBottom: 6 },
  marginTop: { marginTop: 14 },
  infoText: { fontSize: 15, color: '#495057', marginBottom: 4 },
  statRow: { borderBottomWidth: 1, borderBottomColor: '#f1f3f5', paddingVertical: 6 },
  statLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  statName: { fontSize: 14, color: '#868e96', fontWeight: '700' },
  statValue: { fontSize: 14, color: '#212529', fontWeight: '800' },
  statTrack: { width: '100%', height: 8, borderRadius: 4, backgroundColor: '#e9ecef', overflow: 'hidden' },
  statFill: { height: '100%', borderRadius: 4 },
  effectivenessContainer: { gap: 12 },
  effectivenessSection: { marginBottom: 8 },
  effectivenessLabel: { fontSize: 13, fontWeight: '700', color: '#495057', marginBottom: 6 },
  typeTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  typeTag: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  typeTagText: { color: '#fff', fontWeight: '700', fontSize: 11 },
  noneText: { fontSize: 13, color: '#868e96', fontStyle: 'italic' },
  movesButton: { marginTop: 14, backgroundColor: '#cf1124', borderRadius: 12, borderWidth: 2, borderColor: '#2b2d42', paddingVertical: 12, alignItems: 'center' },
  movesButtonText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  evolutionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 8 },
  evolutionItem: { alignItems: 'center', position: 'relative' },
  evolutionImage: { width: 72, height: 72 },
  evolutionName: { fontWeight: '700', color: '#343a40' },
  evolutionArrow: { position: 'absolute', right: -14, top: 24, fontSize: 20, fontWeight: '900', color: '#495057' }
});

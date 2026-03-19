import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { fetchEvolutionChainByPokemonId, fetchPokemonDetails } from '../services/pokeapi';
import { getFavoriteIds, toggleFavoriteId } from '../services/favoritesStorage';
import { getTypeColor, getTypeTextColor, getTypeBackgroundColor } from '../utils/pokemonTypes';

function formatNumber(id) {
  return `#${String(id).padStart(3, '0')}`;
}

function formatStatName(statName) {
  return statName.replace('-', ' ').toUpperCase();
}

export default function PokemonDetailsScreen({ route }) {
  const { pokemonId } = route.params;
  const [pokemon, setPokemon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [evolutionChain, setEvolutionChain] = useState([]);

  useEffect(() => {
    async function loadDetails() {
      try {
        setLoading(true);
        const details = await fetchPokemonDetails(pokemonId);
        setPokemon(details);
        const evolution = await fetchEvolutionChainByPokemonId(details.id);
        setEvolutionChain(evolution);

        const favoriteIds = await getFavoriteIds();
        setIsFavorite(favoriteIds.includes(details.id));
      } catch (err) {
        setError(err.message || 'Erro ao carregar detalhes.');
      } finally {
        setLoading(false);
      }
    }

    loadDetails();
  }, [pokemonId]);

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
        <Text style={styles.errorText}>{error || 'Pokemon nao encontrado.'}</Text>
      </View>
    );
  }

  async function handleToggleFavorite() {
    try {
      const ids = await toggleFavoriteId(pokemon.id);
      setIsFavorite(ids.includes(pokemon.id));
    } catch {
      setError('Nao foi possivel atualizar os favoritos.');
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View
        style={[
          styles.headerCard,
          { backgroundColor: getTypeColor(pokemon.types[0]) }
        ]}
      >
        <Text style={[styles.number, { color: getTypeTextColor(pokemon.types[0]) }]}>{formatNumber(pokemon.id)}</Text>
        <Pressable onPress={handleToggleFavorite} style={styles.favoriteButton}>
          <Text style={styles.favoriteButtonText}>
            {isFavorite ? '★ Favorito' : '☆ Marcar favorito'}
          </Text>
        </Pressable>
        <Image source={{ uri: pokemon.image }} style={styles.image} />
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
        <Text style={styles.sectionTitle}>Informacoes basicas</Text>
        <Text style={styles.infoText}>Altura: {pokemon.height / 10} m</Text>
        <Text style={styles.infoText}>Peso: {pokemon.weight / 10} kg</Text>

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
              <View
                style={[
                  styles.statFill,
                  {
                    width: `${Math.min((stat.base / 180) * 100, 100)}%`,
                    backgroundColor: getTypeColor(pokemon.types[0])
                  }
                ]}
              />
            </View>
          </View>
        ))}

        <Text style={[styles.sectionTitle, styles.marginTop]}>Cadeia evolutiva</Text>
        {evolutionChain.length === 0 ? (
          <Text style={styles.infoText}>Cadeia evolutiva indisponivel.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.evolutionRow}>
              {evolutionChain.map((evolution, index) => (
                <View key={evolution.id} style={styles.evolutionItem}>
                  <Image source={{ uri: evolution.image }} style={styles.evolutionImage} />
                  <Text style={styles.evolutionName}>{evolution.name}</Text>
                  {index < evolutionChain.length - 1 ? (
                    <Text style={styles.evolutionArrow}>→</Text>
                  ) : null}
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f1ee',
    padding: 20
  },
  errorText: {
    color: '#c92a2a',
    fontWeight: '600',
    textAlign: 'center'
  },
  container: {
    padding: 16,
    backgroundColor: '#f5f1ee'
  },
  headerCard: {
    borderRadius: 22,
    padding: 16,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#2b2d42',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 11,
    elevation: 8
  },
  number: {
    fontWeight: '700',
    fontSize: 14,
    alignSelf: 'flex-start'
  },
  favoriteButton: {
    marginTop: 8,
    backgroundColor: '#fffdf5',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#2b2d42',
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  favoriteButtonText: {
    fontWeight: '800',
    color: '#2b2d42'
  },
  image: {
    width: 180,
    height: 180
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff'
  },
  typesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12
  },
  typeBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  typeText: {
    fontWeight: '700',
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1
  },
  infoCard: {
    marginTop: 16,
    backgroundColor: '#faf8f6',
    borderRadius: 22,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e0d5ce'
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#343a40',
    marginBottom: 6
  },
  marginTop: {
    marginTop: 14
  },
  infoText: {
    fontSize: 15,
    color: '#495057',
    marginBottom: 4
  },
  statRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
    paddingVertical: 6
  },
  statLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  statName: {
    fontSize: 14,
    color: '#868e96',
    fontWeight: '700'
  },
  statValue: {
    fontSize: 14,
    color: '#212529',
    fontWeight: '800'
  },
  statTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e9ecef',
    overflow: 'hidden'
  },
  statFill: {
    height: '100%',
    borderRadius: 4
  },
  evolutionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8
  },
  evolutionItem: {
    alignItems: 'center',
    position: 'relative'
  },
  evolutionImage: {
    width: 72,
    height: 72
  },
  evolutionName: {
    fontWeight: '700',
    color: '#343a40'
  },
  evolutionArrow: {
    position: 'absolute',
    right: -14,
    top: 24,
    fontSize: 20,
    fontWeight: '900',
    color: '#495057'
  }
});

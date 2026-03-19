import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { getTypeColor, getTypeBackgroundColor, getTypeTextColor } from '../utils/pokemonTypes';

function formatNumber(id) {
  return `#${String(id).padStart(3, '0')}`;
}

export default function PokemonCard({ pokemon, onPress, isFavorite, onToggleFavorite }) {
  const primaryType = pokemon.types[0];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: getTypeBackgroundColor(primaryType) },
        pressed && styles.cardPressed
      ]}
      onPress={onPress}
    >
      <View style={styles.pokeballAccent} />
      <View style={styles.topLine}>
        <Text style={[styles.number, { color: getTypeColor(primaryType) }]}>{formatNumber(pokemon.id)}</Text>
        <Pressable
          hitSlop={8}
          onPress={(event) => {
            event.stopPropagation?.();
            onToggleFavorite?.(pokemon.id);
          }}
          style={styles.favoriteButton}
        >
          <Text style={styles.favoriteIcon}>{isFavorite ? '★' : '☆'}</Text>
        </Pressable>
      </View>

      <View style={styles.typeContainer}>
        {pokemon.types.map((typeName) => (
          <View
            key={`${pokemon.id}-${typeName}`}
            style={[
              styles.typeBadge,
              { backgroundColor: getTypeColor(typeName) }
            ]}
          >
            <Text style={[styles.typeText, { color: getTypeTextColor(typeName) }]}>{typeName}</Text>
          </View>
        ))}
      </View>

      <Image source={{ uri: pokemon.image }} style={styles.image} />
      <Text style={styles.name}>{pokemon.name}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#222',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 6
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95
  },
  topLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  pokeballAccent: {
    position: 'absolute',
    right: -30,
    top: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 8,
    borderColor: 'rgba(255,255,255,0.25)'
  },
  number: {
    fontWeight: '700',
    fontSize: 13
  },
  favoriteButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)'
  },
  favoriteIcon: {
    fontSize: 20,
    color: '#ffd43b'
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 6
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1
  },
  image: {
    width: 120,
    height: 120,
    alignSelf: 'center'
  },
  name: {
    marginTop: 8,
    color: '#212529',
    textAlign: 'center',
    fontSize: 19,
    fontWeight: '800'
  }
});

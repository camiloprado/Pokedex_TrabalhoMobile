import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  ScrollView,
  Text,
  StyleSheet,
  Pressable
} from 'react-native';

const POKEMON_TYPES = [
  'normal',
  'fighting',
  'flying',
  'poison',
  'ground',
  'rock',
  'bug',
  'ghost',
  'steel',
  'fire',
  'water',
  'grass',
  'electric',
  'psychic',
  'ice',
  'dragon',
  'dark',
  'fairy'
];

const TYPE_EFFECTIVENESS = {
  normal: {
    weakTo: ['fighting'],
    resistantTo: [],
    immuneTo: ['ghost']
  },
  fighting: {
    weakTo: ['flying', 'psychic', 'fairy'],
    resistantTo: ['rock', 'bug', 'dark'],
    immuneTo: []
  },
  flying: {
    weakTo: ['rock', 'electric', 'ice'],
    resistantTo: ['fighting', 'bug', 'grass'],
    immuneTo: ['ground']
  },
  poison: {
    weakTo: ['ground', 'psychic'],
    resistantTo: ['fighting', 'poison', 'bug', 'grass'],
    immuneTo: []
  },
  ground: {
    weakTo: ['water', 'grass', 'ice'],
    resistantTo: ['poison', 'rock'],
    immuneTo: ['electric']
  },
  rock: {
    weakTo: ['water', 'grass', 'fighting', 'ground', 'steel'],
    resistantTo: ['normal', 'flying', 'poison', 'fire'],
    immuneTo: []
  },
  bug: {
    weakTo: ['flying', 'rock', 'fire'],
    resistantTo: ['fighting', 'ground', 'grass'],
    immuneTo: []
  },
  ghost: {
    weakTo: ['ghost', 'dark'],
    resistantTo: ['poison', 'bug'],
    immuneTo: ['normal', 'fighting']
  },
  steel: {
    weakTo: ['fire', 'water', 'ground'],
    resistantTo: [
      'normal',
      'flying',
      'rock',
      'bug',
      'grass',
      'psychic',
      'ice',
      'dragon',
      'fairy'
    ],
    immuneTo: ['poison']
  },
  fire: {
    weakTo: ['water', 'ground', 'rock'],
    resistantTo: ['bug', 'steel', 'grass', 'fairy', 'fire', 'ice'],
    immuneTo: []
  },
  water: {
    weakTo: ['electric', 'grass'],
    resistantTo: ['steel', 'fire', 'water', 'ice'],
    immuneTo: []
  },
  grass: {
    weakTo: ['flying', 'poison', 'bug', 'fire', 'ice'],
    resistantTo: ['ground', 'water', 'grass', 'electric'],
    immuneTo: []
  },
  electric: {
    weakTo: ['ground'],
    resistantTo: ['flying', 'steel', 'electric'],
    immuneTo: []
  },
  psychic: {
    weakTo: ['bug', 'ghost', 'dark'],
    resistantTo: ['fighting', 'psychic'],
    immuneTo: []
  },
  ice: {
    weakTo: ['fire', 'fighting', 'rock', 'steel'],
    resistantTo: ['ice'],
    immuneTo: []
  },
  dragon: {
    weakTo: ['ice', 'dragon', 'fairy'],
    resistantTo: ['fire', 'water', 'grass', 'electric'],
    immuneTo: []
  },
  dark: {
    weakTo: ['fighting', 'bug', 'fairy'],
    resistantTo: ['ghost', 'dark'],
    immuneTo: ['psychic']
  },
  fairy: {
    weakTo: ['poison', 'steel'],
    resistantTo: ['fighting', 'bug', 'dark'],
    immuneTo: []
  }
};

const TYPE_COLORS = {
  normal: '#A8A878',
  fighting: '#C03028',
  flying: '#A890F0',
  poison: '#A040A0',
  ground: '#E0C068',
  rock: '#B8A038',
  bug: '#A8B820',
  ghost: '#705898',
  steel: '#B8B8D0',
  fire: '#F08030',
  water: '#6890F0',
  grass: '#78C850',
  electric: '#F8D030',
  psychic: '#F85888',
  ice: '#98D8D8',
  dragon: '#7038F8',
  dark: '#705848',
  fairy: '#EE99AC'
};

export default function EffectivenessMatrixScreen() {
  const [selectedType, setSelectedType] = useState('normal');
  const [viewMode, setViewMode] = useState('defending');

  const typeData = TYPE_EFFECTIVENESS[selectedType];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Matriz de Efetividade</Text>

        <View style={styles.modeSelector}>
          <Pressable
            style={[
              styles.modeButton,
              viewMode === 'defending' && styles.modeButtonActive
            ]}
            onPress={() => setViewMode('defending')}
          >
            <Text
              style={[
                styles.modeButtonText,
                viewMode === 'defending' && styles.modeButtonTextActive
              ]}
            >
              Tipo Defensivo
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.modeButton,
              viewMode === 'attacking' && styles.modeButtonActive
            ]}
            onPress={() => setViewMode('attacking')}
          >
            <Text
              style={[
                styles.modeButtonText,
                viewMode === 'attacking' && styles.modeButtonTextActive
              ]}
            >
              Tipo Ofensivo
            </Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.typeSelector}
        >
          {POKEMON_TYPES.map((type) => (
            <Pressable
              key={type}
              style={[
                styles.typeButton,
                selectedType === type && styles.typeButtonActive
              ]}
              onPress={() => setSelectedType(type)}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  selectedType === type && styles.typeButtonTextActive
                ]}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <ScrollView style={styles.dataContainer}>
          <Text style={styles.sectionTitle}>
            {viewMode === 'defending'
              ? `${selectedType.toUpperCase()} sofre super efetivo de:`
              : `${selectedType.toUpperCase()} é super efetivo contra:`}
          </Text>

          {viewMode === 'defending' ? (
            <>
              <View style={styles.dataSection}>
                <Text style={styles.subsectionTitle}>
                  🔴 Super Efetivo ({typeData.weakTo.length})
                </Text>
                <View style={styles.typeTagsContainer}>
                  {typeData.weakTo.length > 0 ? (
                    typeData.weakTo.map((type) => (
                      <View
                        key={type}
                        style={[
                          styles.typeTag,
                          {
                            backgroundColor: TYPE_COLORS[type],
                            opacity: 0.8
                          }
                        ]}
                      >
                        <Text style={styles.typeTagText}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noneText}>Nenhum</Text>
                  )}
                </View>
              </View>

              <View style={styles.dataSection}>
                <Text style={styles.subsectionTitle}>
                  🟢 Resistente a ({typeData.resistantTo.length})
                </Text>
                <View style={styles.typeTagsContainer}>
                  {typeData.resistantTo.length > 0 ? (
                    typeData.resistantTo.map((type) => (
                      <View
                        key={type}
                        style={[
                          styles.typeTag,
                          {
                            backgroundColor: TYPE_COLORS[type],
                            opacity: 0.5
                          }
                        ]}
                      >
                        <Text style={styles.typeTagText}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noneText}>Nenhum</Text>
                  )}
                </View>
              </View>

              <View style={styles.dataSection}>
                <Text style={styles.subsectionTitle}>
                  ⚪ Imune a ({typeData.immuneTo.length})
                </Text>
                <View style={styles.typeTagsContainer}>
                  {typeData.immuneTo.length > 0 ? (
                    typeData.immuneTo.map((type) => (
                      <View
                        key={type}
                        style={[
                          styles.typeTag,
                          {
                            backgroundColor: TYPE_COLORS[type]
                          }
                        ]}
                      >
                        <Text style={styles.typeTagText}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noneText}>Nenhum</Text>
                  )}
                </View>
              </View>
            </>
          ) : (
            <>
              <View style={styles.dataSection}>
                <Text style={styles.subsectionTitle}>
                  🔴 Super efetivo contra:
                </Text>
                <View style={styles.typeTagsContainer}>
                  {POKEMON_TYPES.filter((type) =>
                    typeData.weakTo.includes(type)
                  ).length > 0 ? (
                    POKEMON_TYPES.map((type) => {
                      const defendingData = TYPE_EFFECTIVENESS[type];
                      if (defendingData.weakTo.includes(selectedType)) {
                        return (
                          <View
                            key={type}
                            style={[
                              styles.typeTag,
                              {
                                backgroundColor: TYPE_COLORS[type],
                                opacity: 0.8
                              }
                            ]}
                          >
                            <Text style={styles.typeTagText}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </Text>
                          </View>
                        );
                      }
                      return null;
                    }).filter(Boolean)
                  ) : (
                    <Text style={styles.noneText}>Nenhum</Text>
                  )}
                </View>
              </View>
            </>
          )}
        </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#212529',
    marginBottom: 12,
    marginTop: 8
  },
  modeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12
  },
  modeButton: {
    flex: 1,
    backgroundColor: '#fffdf5',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#dee2e6',
    paddingVertical: 8,
    alignItems: 'center'
  },
  modeButtonActive: {
    backgroundColor: '#cf1124',
    borderColor: '#cf1124'
  },
  modeButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#495057'
  },
  modeButtonTextActive: {
    color: '#fff'
  },
  typeSelector: {
    paddingRight: 16,
    gap: 6,
    marginBottom: 12
  },
  typeButton: {
    backgroundColor: '#fffdf5',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#dee2e6',
    paddingHorizontal: 10,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 88,
    maxWidth: 118
  },
  typeButtonActive: {
    backgroundColor: '#cf1124',
    borderColor: '#cf1124'
  },
  typeButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#495057',
    textAlign: 'center'
  },
  typeButtonTextActive: {
    color: '#fff'
  },
  dataContainer: {
    marginBottom: 12,
    paddingHorizontal: 12
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#212529',
    marginBottom: 12,
    textTransform: 'capitalize'
  },
  dataSection: {
    marginBottom: 16
  },
  subsectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#495057',
    marginBottom: 8
  },
  typeTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  typeTag: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 4
  },
  typeTagText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12
  },
  noneText: {
    fontSize: 13,
    color: '#868e96',
    fontStyle: 'italic'
  }
});

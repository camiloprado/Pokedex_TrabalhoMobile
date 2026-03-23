import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function translateMoveDescriptionToPtBr(rawText) {
  if (!rawText) {
    return null;
  }

  const dictionary = {
    'Inflicts regular damage with no additional effect.': 'Causa dano normal sem efeito adicional.',
    'Has no effect in battle.': 'Não tem efeito em batalha.',
    "Lowers the target's Attack by one stage.": 'Diminui o Ataque do alvo em um estágio.',
    "Lowers the target's Defense by one stage.": 'Diminui a Defesa do alvo em um estágio.',
    "Lowers the target's Speed by one stage.": 'Diminui a Velocidade do alvo em um estágio.',
    "Raises the user's Attack by one stage.": 'Aumenta o Ataque do usuário em um estágio.',
    "Raises the user's Defense by one stage.": 'Aumenta a Defesa do usuário em um estágio.',
    "Raises the user's Speed by one stage.": 'Aumenta a Velocidade do usuário em um estágio.',
    "Raises the user's Special Attack by one stage.": 'Aumenta o Ataque Especial do usuário em um estágio.',
    "Raises the user's Special Defense by one stage.": 'Aumenta a Defesa Especial do usuário em um estágio.',
    'User foregoes its next turn to recharge.': 'O usuário precisa recarregar e perde o próximo turno.',
    'User sleeps for two turns, completely healing itself.': 'O usuário dorme por dois turnos e recupera totalmente o HP.',
    'User faints.': 'O usuário desmaia.',
    'Always goes first.': 'Sempre ataca primeiro.',
    'This move does not check accuracy.': 'Este movimento não verifica precisão.'
  };

  if (dictionary[rawText]) {
    return dictionary[rawText];
  }

  return null;
}

export default function MovesScreen({ route }) {
  const { pokemon } = route.params;
  const [moves, setMoves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedMove, setExpandedMove] = useState(null);
  const [filterMethod, setFilterMethod] = useState('all');
  const [moveDetailsByName, setMoveDetailsByName] = useState({});
  const [loadingMoveName, setLoadingMoveName] = useState('');
  const movesRequestIdRef = useRef(0);

  useEffect(() => {
    loadMoves();
  }, [pokemon]);

  const loadMoves = useCallback(async () => {
    const requestId = ++movesRequestIdRef.current;

    try {
      setLoading(true);
      setExpandedMove(null);
      setMoveDetailsByName({});

      const response = await fetch(
        `https://pokeapi.co/api/v2/pokemon/${pokemon.id}`
      );

      if (!response.ok) {
        throw new Error('Falha ao carregar lista de movimentos');
      }

      const data = await response.json();

      const movesData = data.moves.map((moveData) => {
        const versionGroups =
          moveData.version_group_details[0] || {};
        return {
          name: moveData.move.name,
          method: versionGroups.move_learn_method?.name || 'unknown',
          level: versionGroups.level_learned_at || '-'
        };
      });

      if (requestId === movesRequestIdRef.current) {
        setMoves(movesData);
      }
    } catch (error) {
      console.error('Error loading moves:', error);
      if (requestId === movesRequestIdRef.current) {
        setMoves([]);
      }
    } finally {
      if (requestId === movesRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, [pokemon]);

  const groupedMoves = useCallback(() => {
    const groups = {};

    moves.forEach((move) => {
      const method = move.method || 'unknown';
      if (!groups[method]) {
        groups[method] = [];
      }
      groups[method].push(move);
    });

    Object.keys(groups).forEach((key) => {
      if (key === 'level-up') {
        groups[key].sort((a, b) => (a.level || 0) - (b.level || 0));
      } else {
        groups[key].sort((a, b) => a.name.localeCompare(b.name));
      }
    });

    return groups;
  }, [moves]);

  const groups = groupedMoves();

  const filteredGroups =
    filterMethod === 'all'
      ? groups
      : { [filterMethod]: groups[filterMethod] || [] };

  const getMoveMethodLabel = (method) => {
    const labels = {
      'level-up': 'Nível',
      machine: 'Máquina',
      tutor: 'Tutor',
      egg: 'Ovo',
      'form-change': 'Mudança de Forma',
      'move-reminder': 'Lembrador de Movimento',
      unknown: 'Desconhecido'
    };
    return labels[method] || method;
  };

  const getDamageClassLabel = (damageClass) => {
    const labels = {
      physical: 'Físico',
      special: 'Especial',
      status: 'Status'
    };
    return labels[damageClass] || 'Desconhecido';
  };

  const fetchMoveDetails = useCallback(async (moveName) => {
    if (!moveName || moveDetailsByName[moveName]) {
      return;
    }

    const requestId = movesRequestIdRef.current;

    try {
      setLoadingMoveName(moveName);
      const response = await fetch(`https://pokeapi.co/api/v2/move/${moveName}`);
      if (!response.ok) {
        throw new Error('Falha ao carregar movimento');
      }

      const data = await response.json();
      const shortEffectEntry = data.effect_entries.find((entry) => entry.language.name === 'en');

      if (requestId !== movesRequestIdRef.current) {
        return;
      }

      setMoveDetailsByName((prev) => ({
        ...prev,
        [moveName]: {
          power: data.power,
          accuracy: data.accuracy,
          pp: data.pp,
          type: data.type?.name || 'unknown',
          damageClass: data.damage_class?.name || 'unknown',
          descriptionOriginal: shortEffectEntry?.short_effect || 'No description available.',
          descriptionPtBr: translateMoveDescriptionToPtBr(shortEffectEntry?.short_effect)
        }
      }));
    } catch {
      if (requestId !== movesRequestIdRef.current) {
        return;
      }

      setMoveDetailsByName((prev) => ({
        ...prev,
        [moveName]: {
          power: null,
          accuracy: null,
          pp: null,
          type: 'unknown',
          damageClass: 'unknown',
          descriptionOriginal: 'Unable to load move description.',
          descriptionPtBr: null
        }
      }));
    } finally {
      if (requestId === movesRequestIdRef.current) {
        setLoadingMoveName('');
      }
    }
  }, [moveDetailsByName]);

  const getMoveMethodColor = (method) => {
    const colors = {
      'level-up': '#6890F0',
      machine: '#A8B820',
      tutor: '#C03028',
      egg: '#F8D030',
      'form-change': '#B8A038',
      'move-reminder': '#A040A0',
      unknown: '#868e96'
    };
    return colors[method] || '#495057';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#cf1124" />
          <Text style={styles.loadingText}>Carregando movimentos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.pokemonHeader}>
            <Text style={styles.pokemonName}>
              {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
            </Text>
            <Text style={styles.pokemonId}>#{pokemon.id}</Text>
          </View>
          <Text style={styles.movesCount}>
            {moves.length} movimento{moves.length !== 1 ? 's' : ''}
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          <Pressable
            style={[
              styles.filterButton,
              filterMethod === 'all' && styles.filterButtonActive
            ]}
            onPress={() => setFilterMethod('all')}
          >
            <Text
              style={[
                styles.filterButtonText,
                filterMethod === 'all' && styles.filterButtonTextActive
              ]}
            >
              Todos ({moves.length})
            </Text>
          </Pressable>
          {Object.keys(groups).map((method) => (
            <Pressable
              key={method}
              style={[
                styles.filterButton,
                filterMethod === method && styles.filterButtonActive
              ]}
              onPress={() => setFilterMethod(method)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filterMethod === method && styles.filterButtonTextActive
                ]}
              >
                {getMoveMethodLabel(method)} ({groups[method].length})
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <FlatList
          data={Object.entries(filteredGroups).flatMap(([method, methodMoves]) =>
            methodMoves.map((move) => ({
              ...move,
              method,
              key: `${method}-${move.name}`
            }))
          )}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <View style={styles.moveCard}>
              <Pressable
                style={styles.moveCardContent}
                onPress={() => {
                  const nextExpanded = expandedMove === item.key ? null : item.key;
                  setExpandedMove(nextExpanded);
                  if (nextExpanded) {
                    fetchMoveDetails(item.name);
                  }
                }}
              >
                <View style={styles.moveInfo}>
                  <Text style={styles.moveName}>
                    {item.name.charAt(0).toUpperCase() +
                      item.name.slice(1).replace('-', ' ')}
                  </Text>
                  <View style={styles.moveMetaTags}>
                    <View
                      style={[
                        styles.methodTag,
                        {
                          backgroundColor: getMoveMethodColor(
                            item.method
                          )
                        }
                      ]}
                    >
                      <Text style={styles.methodTagText}>
                        {getMoveMethodLabel(item.method)}
                      </Text>
                    </View>
                    {item.level !== '-' && (
                      <View style={styles.levelTag}>
                        <Text style={styles.levelTagText}>
                          Nível {item.level}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text style={styles.expandIcon}>
                  {expandedMove === item.key ? '▼' : '▶'}
                </Text>
              </Pressable>

              {expandedMove === item.key && (
                <View style={styles.moveDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Tipo:</Text>
                    <Text style={styles.detailValue}>
                      {(moveDetailsByName[item.name]?.type || 'unknown').replace('-', ' ')}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Classe:</Text>
                    <Text style={styles.detailValue}>
                      {getDamageClassLabel(moveDetailsByName[item.name]?.damageClass)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Método:</Text>
                    <Text style={styles.detailValue}>
                      {getMoveMethodLabel(item.method)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Poder:</Text>
                    <Text style={styles.detailValue}>
                      {moveDetailsByName[item.name]?.power ?? '-'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Precisão:</Text>
                    <Text style={styles.detailValue}>
                      {moveDetailsByName[item.name]?.accuracy ?? '-'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>PP:</Text>
                    <Text style={styles.detailValue}>
                      {moveDetailsByName[item.name]?.pp ?? '-'}
                    </Text>
                  </View>
                  {item.level !== '-' && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Aprende em:</Text>
                      <Text style={styles.detailValue}>
                        Nível {item.level}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.detailNote}>
                    {loadingMoveName === item.name
                      ? 'Carregando descrição...'
                      : moveDetailsByName[item.name]?.descriptionPtBr || 'Tradução precisa indisponível para este movimento.'}
                  </Text>
                  <Text style={styles.detailNoteOriginal}>
                    {loadingMoveName === item.name
                      ? ''
                      : moveDetailsByName[item.name]?.descriptionOriginal || ''}
                  </Text>
                </View>
              )}
            </View>
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              Nenhum movimento encontrado
            </Text>
          }
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#495057',
    fontWeight: '600'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  pokemonHeader: {
    flex: 1
  },
  pokemonName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#212529',
    marginBottom: 2
  },
  pokemonId: {
    fontSize: 13,
    color: '#868e96',
    fontWeight: '600'
  },
  movesCount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#495057',
    backgroundColor: '#fffdf5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  filterContainer: {
    paddingRight: 16,
    gap: 6,
    marginBottom: 12
  },
  filterButton: {
    backgroundColor: '#fffdf5',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#dee2e6',
    paddingHorizontal: 10,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 92,
    maxWidth: 150
  },
  filterButtonActive: {
    backgroundColor: '#cf1124',
    borderColor: '#cf1124'
  },
  filterButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#495057',
    textAlign: 'center'
  },
  filterButtonTextActive: {
    color: '#fff'
  },
  listContent: {
    paddingBottom: 12
  },
  moveCard: {
    backgroundColor: '#fffdf5',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2b2d42',
    marginBottom: 8,
    overflow: 'hidden'
  },
  moveCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12
  },
  moveInfo: {
    flex: 1
  },
  moveName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#212529',
    marginBottom: 6
  },
  moveMetaTags: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap'
  },
  methodTag: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  methodTagText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700'
  },
  levelTag: {
    backgroundColor: '#6890F0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  levelTagText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700'
  },
  expandIcon: {
    fontSize: 16,
    color: '#868e96',
    fontWeight: '600',
    marginLeft: 8
  },
  moveDetails: {
    backgroundColor: '#f9f9f9',
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#495057'
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#212529'
  },
  detailNote: {
    fontSize: 11,
    color: '#868e96',
    fontStyle: 'italic',
    marginTop: 4
  },
  detailNoteOriginal: {
    fontSize: 10,
    color: '#adb5bd',
    marginTop: 2
  },
  emptyText: {
    textAlign: 'center',
    color: '#868e96',
    fontSize: 15,
    marginTop: 40,
    fontWeight: '600'
  }
});

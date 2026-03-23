import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ActivityIndicator,
  PanResponder
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const REGION_OPTIONS = [
  {
    key: 'kanto',
    label: 'Kanto',
    generationId: 1,
    emoji: '🏔️',
    mapImage: 'https://raw.githubusercontent.com/PokeAPI/pokeapi-static/master/official-artwork/regions/kanto.png',
    backgroundColor: '#FFE4B5',
    description: 'A primeira região dos Pokémons, inspirada no Japão'
  },
  {
    key: 'johto',
    label: 'Johto',
    generationId: 2,
    emoji: '⛩️',
    mapImage: 'https://raw.githubusercontent.com/PokeAPI/pokeapi-static/master/official-artwork/regions/johto.png',
    backgroundColor: '#E8B4E8',
    description: 'Uma região ao oeste de Kanto, conhecida por seus Pokémons raros'
  },
  {
    key: 'hoenn',
    label: 'Hoenn',
    generationId: 3,
    emoji: '🌊',
    mapImage: 'https://raw.githubusercontent.com/PokeAPI/pokeapi-static/master/official-artwork/regions/hoenn.png',
    backgroundColor: '#87CEEB',
    description: 'Uma região tropical com muita água'
  },
  {
    key: 'sinnoh',
    label: 'Sinnoh',
    generationId: 4,
    emoji: '⛰️',
    mapImage: 'https://raw.githubusercontent.com/PokeAPI/pokeapi-static/master/official-artwork/regions/sinnoh.png',
    backgroundColor: '#D3D3D3',
    description: 'Uma região montanhosa com clima frio'
  },
  {
    key: 'unova',
    label: 'Unova',
    generationId: 5,
    emoji: '🏙️',
    mapImage: 'https://raw.githubusercontent.com/PokeAPI/pokeapi-static/master/official-artwork/regions/unova.png',
    backgroundColor: '#778899',
    description: 'Uma região urbana inspirada em Nova York'
  },
  {
    key: 'kalos',
    label: 'Kalos',
    generationId: 6,
    emoji: '🗼',
    mapImage: 'https://raw.githubusercontent.com/PokeAPI/pokeapi-static/master/official-artwork/regions/kalos.png',
    backgroundColor: '#FFB6C1',
    description: 'Uma região elegante inspirada na França'
  },
  {
    key: 'alola',
    label: 'Alola',
    generationId: 7,
    emoji: '🏝️',
    mapImage: 'https://raw.githubusercontent.com/PokeAPI/pokeapi-static/master/official-artwork/regions/alola.png',
    backgroundColor: '#FFD700',
    description: 'Uma região arquipélago tropical'
  },
  {
    key: 'galar',
    label: 'Galar',
    generationId: 8,
    emoji: '🏰',
    mapImage: 'https://raw.githubusercontent.com/PokeAPI/pokeapi-static/master/official-artwork/regions/galar.png',
    backgroundColor: '#98D8C8',
    description: 'Uma região inspirada no Reino Unido'
  },
  {
    key: 'paldea',
    label: 'Paldea',
    generationId: 9,
    emoji: '🌟',
    mapImage: 'https://raw.githubusercontent.com/PokeAPI/pokeapi-static/master/official-artwork/regions/paldea.png',
    backgroundColor: '#F0E68C',
    description: 'Uma região mediterrânea inspirada na Ibéria'
  }
];

const REGION_KEYS = REGION_OPTIONS.map((region) => region.key);
const HABITAT_PAGE_SIZE = 6;
const AREA_PAGE_SIZE = 4;

const fetchRegionPokemonLocations = async (regionKey) => {
  try {
    const regionMap = {
      kanto: 1,
      johto: 2,
      hoenn: 3,
      sinnoh: 4,
      unova: 5,
      kalos: 6,
      alola: 7,
      galar: 8,
      paldea: 9
    };

    const generationId = regionMap[regionKey];
    if (!generationId) {
      return [];
    }

    const response = await fetch(
      `https://pokeapi.co/api/v2/generation/${generationId}`
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    const speciesSlice = data.pokemon_species.slice(0, 12);
    const speciesResults = await Promise.allSettled(
      speciesSlice.map(async (speciesRef) => {
        const speciesId = speciesRef.url.split('/').filter(Boolean).pop();
        const speciesResponse = await fetch(
          `https://pokeapi.co/api/v2/pokemon-species/${speciesId}`
        );

        if (!speciesResponse.ok) {
          return null;
        }

        const speciesData = await speciesResponse.json();
        if (!speciesData.name || !speciesData.id) {
          return null;
        }

        return {
          pokemon: speciesData.name,
          habitat: speciesData.habitat?.name || 'Diverso',
          id: speciesData.id,
          color: speciesData.color?.name || 'unknown'
        };
      })
    );

    const locations = speciesResults
      .filter((result) => result.status === 'fulfilled' && result.value)
      .map((result) => result.value);

    return locations.sort((a, b) => a.id - b.id);
  } catch (error) {
    console.error('Erro ao buscar localizações:', error);
    return [];
  }
};

export default function MapsScreen() {
  const [selectedRegion, setSelectedRegion] = useState('kanto');
  const [pokemonLocations, setPokemonLocations] = useState([]);
  const [areaEncounters, setAreaEncounters] = useState([]);
  const [habitatPage, setHabitatPage] = useState(1);
  const [areaPage, setAreaPage] = useState(1);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [mapImageStatus, setMapImageStatus] = useState('loading');
  const [mapRetryCount, setMapRetryCount] = useState(0);
  
  const panResponderRef = useRef(null);
  const locationsCacheRef = useRef(new Map());
  const areasCacheRef = useRef(new Map());
  const requestIdRef = useRef(0);

  useEffect(() => {
    // Criar PanResponder com selectedRegion atualizado
    panResponderRef.current = PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const absDx = Math.abs(gestureState.dx);
        const absDy = Math.abs(gestureState.dy);
        return absDx > 24 && absDx > absDy;
      },
      onPanResponderRelease: (evt, gestureState) => {
        const currentIndex = REGION_KEYS.indexOf(selectedRegion);
        
        if (gestureState.dx > 50 && currentIndex > 0) {
          // Swipe right - previous region
          setSelectedRegion(REGION_KEYS[currentIndex - 1]);
        } else if (gestureState.dx < -50 && currentIndex < REGION_KEYS.length - 1) {
          // Swipe left - next region
          setSelectedRegion(REGION_KEYS[currentIndex + 1]);
        }
      }
    });
  }, [selectedRegion]);

  useEffect(() => {
    const regionMap = {
      kanto: 1,
      johto: 2,
      hoenn: 3,
      sinnoh: 4,
      unova: 5,
      kalos: 6,
      alola: 7,
      galar: 8,
      paldea: 9
    };

    const formatName = (raw) => {
      if (!raw) {
        return '';
      }
      return raw
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
    };

    const loadAreaEncounters = async (regionKey) => {
      try {
        const regionId = regionMap[regionKey];
        const regionResponse = await fetch(`https://pokeapi.co/api/v2/region/${regionId}`);
        if (!regionResponse.ok) {
          return [];
        }

        const regionData = await regionResponse.json();
        const locationSamples = (regionData.locations || []).slice(0, 4);
        const areaCards = [];

        for (const location of locationSamples) {
          try {
            const locationResponse = await fetch(location.url);
            if (!locationResponse.ok) {
              continue;
            }

            const locationData = await locationResponse.json();
            const areaSamples = (locationData.areas || []).slice(0, 2);

            for (const area of areaSamples) {
              try {
                const areaResponse = await fetch(area.url);
                if (!areaResponse.ok) {
                  continue;
                }

                const areaData = await areaResponse.json();
                const pokemonNames = (areaData.pokemon_encounters || [])
                  .slice(0, 8)
                  .map((encounter) => formatName(encounter.pokemon?.name))
                  .filter(Boolean);

                if (pokemonNames.length > 0) {
                  areaCards.push({
                    areaName: formatName(areaData.name),
                    locationName: formatName(locationData.name),
                    pokemonNames
                  });
                }
              } catch {
                continue;
              }
            }
          } catch {
            continue;
          }
        }

        return areaCards;
      } catch {
        return [];
      }
    };

    const loadLocations = async () => {
      const requestId = ++requestIdRef.current;
      setLoadingLocations(true);
      setMapImageStatus('loading');
      setMapRetryCount(0);
      setHabitatPage(1);
      setAreaPage(1);

      let locations = locationsCacheRef.current.get(selectedRegion);
      let areas = areasCacheRef.current.get(selectedRegion);

      if (!locations || !areas) {
        const result = await Promise.all([
          locations ? Promise.resolve(locations) : fetchRegionPokemonLocations(selectedRegion),
          areas ? Promise.resolve(areas) : loadAreaEncounters(selectedRegion)
        ]);

        locations = result[0];
        areas = result[1];

        locationsCacheRef.current.set(selectedRegion, locations);
        areasCacheRef.current.set(selectedRegion, areas);
      }

      // Ignore stale responses when user changes region quickly.
      if (requestId !== requestIdRef.current) {
        return;
      }

      setPokemonLocations(locations);
      setAreaEncounters(areas);
      setLoadingLocations(false);
    };
    loadLocations();
  }, [selectedRegion]);

  const visibleAreaEncounters = useMemo(() => {
    return areaEncounters.slice(0, areaPage * AREA_PAGE_SIZE);
  }, [areaEncounters, areaPage]);

  const visibleHabitats = useMemo(() => {
    return pokemonLocations.slice(0, habitatPage * HABITAT_PAGE_SIZE);
  }, [pokemonLocations, habitatPage]);

  const hasMoreHabitats = visibleHabitats.length < pokemonLocations.length;
  const hasMoreAreaEncounters = visibleAreaEncounters.length < areaEncounters.length;

  const selectedRegionData = REGION_OPTIONS.find(
    (r) => r.key === selectedRegion
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={true}>
        <View style={styles.container}>
          <Text style={styles.title}>Mapas das Regiões</Text>

          <View style={styles.regionSelectorContainer}>
            <Text style={styles.swipeHintText}>👆 Deslize para navegar entre regiões</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.regionSelector}
            >
            {REGION_OPTIONS.map((region) => (
              <Pressable
                key={region.key}
                style={[
                  styles.regionChip,
                  selectedRegion === region.key &&
                    styles.regionChipActive
                ]}
                onPress={() => setSelectedRegion(region.key)}
              >
                <Text style={styles.regionChipEmoji}>{region.emoji}</Text>
                <Text
                  style={[
                    styles.regionChipLabel,
                    selectedRegion === region.key &&
                      styles.regionChipLabelActive
                  ]}
                >
                  {region.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View
          style={[styles.mapContainer, { backgroundColor: selectedRegionData?.backgroundColor }]}
          {...panResponderRef.current?.panHandlers}
        >
          {mapImageStatus === 'loading' && (
            <View style={styles.mapLoadingOverlay}>
              <ActivityIndicator size="large" color="#cf1124" />
              <Text style={styles.mapLoadingText}>Carregando mapa...</Text>
            </View>
          )}
          <Image
            source={{ uri: `${selectedRegionData?.mapImage}?retry=${mapRetryCount}` }}
            style={styles.mapImage}
            resizeMode="contain"
            onLoad={() => setMapImageStatus('loaded')}
            onError={() => setMapImageStatus('error')}
          />
          {mapImageStatus === 'error' && (
            <View style={styles.mapFallback}>
              <Text style={styles.mapFallbackEmoji}>{selectedRegionData?.emoji}</Text>
              <Text style={styles.mapFallbackText}>{selectedRegionData?.label}</Text>
              <Pressable
                style={styles.retryMapButton}
                onPress={() => {
                  setMapImageStatus('loading');
                  setMapRetryCount((prev) => prev + 1);
                }}
              >
                <Text style={styles.retryMapButtonText}>Tentar carregar mapa novamente</Text>
              </Pressable>
            </View>
          )}
          <View style={styles.mapOverlay}>
            <Text style={styles.mapTitle}>
              Região de {selectedRegionData?.label}
            </Text>
            <Text style={styles.mapSubtitle}>
              Geração {selectedRegionData?.generationId}
            </Text>
            <Text style={styles.mapDescription}>
              {selectedRegionData?.description}
            </Text>
          </View>
        </View>

        <View style={styles.regionDataContainer}>
          <Text style={styles.sectionTitle}>Informações da Região</Text>
          <View style={styles.dataCard}>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Nome:</Text>
              <Text style={styles.dataValue}>
                {selectedRegionData?.label}
              </Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Geração:</Text>
              <Text style={styles.dataValue}>
                Gen {selectedRegionData?.generationId}
              </Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Status:</Text>
              <Text style={styles.dataValue}>Disponível</Text>
            </View>
          </View>
        </View>

        <View style={styles.locationsContainer}>
          <Text style={styles.sectionTitle}>Pokémons e Habitats</Text>
          {loadingLocations ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#cf1124" />
              <Text style={styles.loadingText}>Carregando habitats...</Text>
            </View>
          ) : pokemonLocations.length > 0 ? (
            <View style={styles.habitatsList}>
              {visibleHabitats.map((item, index) => (
                <View key={`${item.pokemon}-${index}`} style={styles.habitatItem}>
                  <Text style={styles.habitatPokemon}>
                    📍 {item.pokemon.toUpperCase()}
                  </Text>
                  <Text style={styles.habitatText}>
                    Habitat: {item.habitat || 'Diversos'}
                  </Text>
                </View>
              ))}
              {hasMoreHabitats && (
                <Pressable
                  style={styles.loadMoreButton}
                  onPress={() => setHabitatPage((prev) => prev + 1)}
                >
                  <Text style={styles.loadMoreButtonText}>Carregar mais habitats</Text>
                </Pressable>
              )}
            </View>
          ) : (
            <Text style={styles.noDataText}>
              Sem dados de habitat disponíveis
            </Text>
          )}
        </View>

        <View style={styles.locationsContainer}>
          <Text style={styles.sectionTitle}>Encontros por Área</Text>
          {loadingLocations ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#cf1124" />
              <Text style={styles.loadingText}>Carregando áreas...</Text>
            </View>
          ) : areaEncounters.length > 0 ? (
            <View style={styles.habitatsList}>
              {visibleAreaEncounters.map((area, index) => (
                <View key={`${area.areaName}-${index}`} style={styles.areaItem}>
                  <Text style={styles.areaTitle}>📌 {area.areaName}</Text>
                  <Text style={styles.areaLocation}>Local: {area.locationName}</Text>
                  <Text style={styles.areaPokemonList}>
                    Encontros: {area.pokemonNames.join(', ')}
                  </Text>
                </View>
              ))}
              {hasMoreAreaEncounters && (
                <Pressable
                  style={styles.loadMoreButton}
                  onPress={() => setAreaPage((prev) => prev + 1)}
                >
                  <Text style={styles.loadMoreButtonText}>Carregar mais áreas</Text>
                </Pressable>
              )}
            </View>
          ) : (
            <Text style={styles.noDataText}>
              Sem dados de encontro por área para esta região
            </Text>
          )}
        </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f1ee'
  },
  scrollView: {
    flex: 1
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#212529',
    marginBottom: 16,
    marginTop: 8
  },
  regionSelectorContainer: {
    marginBottom: 16
  },
  regionSelector: {
    paddingRight: 16,
    gap: 8
  },
  swipeHintText: {
    fontSize: 12,
    color: '#868e96',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    fontStyle: 'italic'
  },
  regionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffdf5',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#dee2e6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6
  },
  regionChipActive: {
    backgroundColor: '#cf1124',
    borderColor: '#cf1124'
  },
  regionChipEmoji: {
    fontSize: 16
  },
  regionChipLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#495057'
  },
  regionChipLabelActive: {
    color: '#fff'
  },
  mapContainer: {
    backgroundColor: '#fffdf5',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#2b2d42',
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    height: 320,
    position: 'relative'
  },
  mapImage: {
    width: '100%',
    height: '100%',
    position: 'absolute'
  },
  mapLoadingOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 253, 245, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10
  },
  mapLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#495057',
    fontWeight: '600'
  },
  mapFallback: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 253, 245, 0.9)',
    zIndex: 3
  },
  mapFallbackEmoji: {
    fontSize: 72,
    marginBottom: 12
  },
  mapFallbackText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#212529'
  },
  retryMapButton: {
    marginTop: 10,
    backgroundColor: '#2b2d42',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  retryMapButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12
  },
  mapOverlay: {
    backgroundColor: 'rgba(255, 253, 245, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 8,
    zIndex: 5
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#212529',
    marginBottom: 6
  },
  mapSubtitle: {
    fontSize: 14,
    color: '#868e96',
    marginBottom: 8,
    fontWeight: '600'
  },
  mapDescription: {
    fontSize: 13,
    color: '#495057',
    fontStyle: 'italic'
  },
  regionDataContainer: {
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#212529',
    marginBottom: 8
  },
  dataCard: {
    backgroundColor: '#fffdf5',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2b2d42',
    padding: 12,
    gap: 10
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  dataLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#495057'
  },
  dataValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#212529'
  },
  locationsContainer: {
    marginBottom: 16,
    backgroundColor: '#fffdf5',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2b2d42',
    padding: 12
  },
  habitatsList: {
    gap: 8
  },
  habitatItem: {
    backgroundColor: '#faf8f6',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#cf1124',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#dee2e6'
  },
  habitatPokemon: {
    fontSize: 14,
    fontWeight: '800',
    color: '#212529',
    marginBottom: 4
  },
  habitatText: {
    fontSize: 12,
    color: '#495057',
    fontWeight: '600'
  },
  areaItem: {
    backgroundColor: '#faf8f6',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#3b5bdb',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#dee2e6'
  },
  areaTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#212529',
    marginBottom: 4
  },
  areaLocation: {
    fontSize: 12,
    color: '#495057',
    fontWeight: '700',
    marginBottom: 6
  },
  areaPokemonList: {
    fontSize: 12,
    color: '#495057',
    lineHeight: 18
  },
  loadMoreButton: {
    backgroundColor: '#2b2d42',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4
  },
  loadMoreButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#495057',
    fontWeight: '600'
  },
  noDataText: {
    fontSize: 14,
    color: '#868e96',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16
  }
});

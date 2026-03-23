import React from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Text
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StartScreen({ navigation }) {
  const menuItems = [
    {
      key: 'pokedex',
      label: 'Pokédex',
      description: 'Explore todos os Pokémons',
      icon: '📚',
      screen: 'PokemonList'
    },
    {
      key: 'teams',
      label: 'Meus Times',
      description: 'Crie e gerencie times',
      icon: '⚔️',
      screen: 'Teams'
    },
    {
      key: 'maps',
      label: 'Mapas',
      description: 'Locais de encontro',
      icon: '🗺️',
      screen: 'Maps'
    },
    {
      key: 'effectiveness',
      label: 'Matriz de Efetividade',
      description: 'Comparar tipos',
      icon: '⚡',
      screen: 'EffectivenessMatrix'
    }
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerSection}>
          <Text style={styles.title}>POKÉDEX</Text>
          <Text style={styles.subtitle}>Todas as Regiões</Text>
        </View>

        <View style={styles.menuGrid}>
          {menuItems.map((item) => (
            <Pressable
              key={item.key}
              style={({ pressed }) => [
                styles.menuButton,
                pressed && styles.menuButtonPressed
              ]}
              onPress={() => navigation.navigate(item.screen)}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuDescription}>{item.description}</Text>
            </Pressable>
          ))}
        </View>
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
    paddingVertical: 20
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#cf1124',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: '#495057',
    fontWeight: '600'
  },
  menuGrid: {
    flexDirection: 'column',
    gap: 12,
    flex: 1
  },
  menuButton: {
    flex: 1,
    backgroundColor: '#fffdf5',
    borderRadius: 18,
    borderWidth: 3,
    borderColor: '#2b2d42',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  menuButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9
  },
  menuIcon: {
    fontSize: 40,
    marginBottom: 12
  },
  menuLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#212529',
    marginBottom: 4
  },
  menuDescription: {
    fontSize: 13,
    color: '#868e96',
    fontWeight: '500',
    textAlign: 'center'
  }
});

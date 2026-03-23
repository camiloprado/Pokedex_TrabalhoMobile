import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import StartScreen from './src/screens/StartScreen';
import HomeScreen from './src/screens/HomeScreen';
import PokemonDetailsScreen from './src/screens/PokemonDetailsScreen';
import TeamsScreen from './src/screens/TeamsScreen';
import TeamDetailScreen from './src/screens/TeamDetailScreen';
import MapsScreen from './src/screens/MapsScreen';
import EffectivenessMatrixScreen from './src/screens/EffectivenessMatrixScreen';
import MovesScreen from './src/screens/MovesScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator
        initialRouteName="Start"
        screenOptions={{
          headerStyle: { backgroundColor: '#cf1124' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '900' },
          contentStyle: { backgroundColor: '#f5f1ee' }
        }}
      >
        <Stack.Screen
          name="Start"
          component={StartScreen}
          options={{ title: 'Pokédex' }}
        />
        <Stack.Screen
          name="PokemonList"
          component={HomeScreen}
          options={{ title: 'Pokédex' }}
        />
        <Stack.Screen
          name="PokemonDetails"
          component={PokemonDetailsScreen}
          options={{ title: 'Detalhes do Pokémon' }}
        />
        <Stack.Screen
          name="Teams"
          component={TeamsScreen}
          options={{ title: 'Meus Times' }}
        />
        <Stack.Screen
          name="TeamDetail"
          component={TeamDetailScreen}
          options={{ title: 'Editar Time' }}
        />
        <Stack.Screen
          name="Maps"
          component={MapsScreen}
          options={{ title: 'Mapas das Regiões' }}
        />
        <Stack.Screen
          name="EffectivenessMatrix"
          component={EffectivenessMatrixScreen}
          options={{ title: 'Matriz de Efetividade' }}
        />
        <Stack.Screen
          name="Moves"
          component={MovesScreen}
          options={{ title: 'Movimentos' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

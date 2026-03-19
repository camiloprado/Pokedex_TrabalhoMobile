import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './src/screens/HomeScreen';
import PokemonDetailsScreen from './src/screens/PokemonDetailsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: '#cf1124' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '900' },
          contentStyle: { backgroundColor: '#f5f1ee' }
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Pokédex Kanto' }}
        />
        <Stack.Screen
          name="PokemonDetails"
          component={PokemonDetailsScreen}
          options={{ title: 'Detalhes do Pokémon' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

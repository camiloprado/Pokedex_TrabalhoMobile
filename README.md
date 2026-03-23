# Pokédex Multirregiões (Mobile + Web)

Projeto de Pokédex com React Native + Expo, integrado à PokeAPI, cobrindo múltiplas regiões (Kanto até Paldea).

## Funcionalidades

- Menu inicial com atalhos para Pokédex, Times, Mapas e Matriz de Efetividade.
- Pokédex por região com busca por nome/id, sugestões e ordenação.
- Filtros por tipo e modo de favoritos globais.
- Lista de cards com ação de favorito e pull-to-refresh.
- Tela de detalhes com:
	- imagem normal e shiny com animação
	- status, habilidades, medidas e dados adicionais
	- cadeia evolutiva
	- resumo de efetividade por tipo
	- localizações de encontro
	- acesso para tela de movimentos
- Tela de movimentos com agrupamento por método de aprendizado, detalhes e tradução PT-BR com fallback.
- Tela de times com criação, remoção e edição de time (até 6 Pokémons).
- Tela de mapas por região com swipe horizontal, fallback/retry de mapa, habitats e encontros por área.
- Tela de matriz de efetividade (visão defensiva/ofensiva).

## Tecnologias

- Expo
- React Native
- React Navigation (native-stack)
- AsyncStorage
- react-native-safe-area-context
- PokeAPI

## Estrutura principal

- App.js: navegação principal
- src/services/pokeapi.js: integração e cache de dados da PokeAPI
- src/services/favoritesStorage.js: persistência de favoritos
- src/components/PokemonCard.js: card reutilizável da listagem
- src/screens/HomeScreen.js: listagem, busca, filtros e favoritos
- src/screens/PokemonDetailsScreen.js: detalhes completos
- src/screens/MovesScreen.js: movimentos e detalhes
- src/screens/TeamsScreen.js: CRUD de times
- src/screens/TeamDetailScreen.js: edição de time e seleção de Pokémons
- src/screens/MapsScreen.js: mapas, habitats e encontros por área
- src/screens/EffectivenessMatrixScreen.js: matriz de efetividade
- src/utils/pokemonTypes.js: cores e utilitários de tipo

## Requisitos

- Node.js LTS
- npm
- Expo Go (para teste em dispositivo)

## Como rodar

1. Instale dependências:

```bash
npm install
```

2. Inicie o projeto:

```bash
npm start
```

## Scripts

- npm start: inicia Expo
- npm run web: roda no navegador
- npm run android: execução Android nativa
- npm run ios: execução iOS nativa (macOS)

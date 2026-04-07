# Arquitetura do Projeto Pokedex Mobile

## Visao geral
Aplicativo mobile React Native + Expo com navegacao em stack. A interface fica em screens/components, regras de integracao ficam em services e utilitarios em utils.

## Diagrama de arquitetura
```mermaid
flowchart TD
  subgraph APP[Aplicacao Mobile Expo]
    A[App.js\nNavigationContainer + Native Stack]

    subgraph UI[Camada de Interface]
      S0[StartScreen]
      S1[HomeScreen]
      S2[PokemonDetailsScreen]
      S3[MovesScreen]
      S4[MapsScreen]
      S5[EffectivenessMatrixScreen]
      S6[TeamsScreen]
      S7[TeamDetailScreen]
      C1[PokemonCard component]
    end

    subgraph DOMAIN[Camada de Dominio e Integracao]
      P1[pokeapi service\nfetch/search/details/evolution\ncache em memoria]
      P2[favoritesStorage service\nget/set/toggle favoritos]
      U1[pokemonTypes util\ncores + tipos + contraste]
    end
  end

  subgraph EXT[Recursos Externos]
    E1[PokeAPI REST]
    E2[AsyncStorage]
    E3[expo-av Audio]
    E4[Imagens externas de mapas]
  end

  A --> S0
  A --> S1
  A --> S2
  A --> S3
  A --> S4
  A --> S5
  A --> S6
  A --> S7

  S0 -->|menu| S1
  S0 -->|menu| S6
  S0 -->|menu| S4
  S0 -->|menu| S5
  S0 --> E3

  S1 --> C1
  C1 --> U1
  S1 --> P1
  S1 --> P2
  S1 --> U1
  S1 -->|seleciona pokemon| S2

  S2 --> P1
  S2 --> P2
  S2 --> U1
  S2 -->|abre movimentos| S3
  S2 --> E1

  S3 --> E1

  S4 --> E1
  S4 --> E4

  S5 -->|matriz local| U1

  S6 --> E2
  S6 -->|editar time| S7

  S7 --> E2
  S7 --> E1

  P1 --> E1
  P2 --> E2
```

## Responsabilidades por camada
- App.js: define navegacao global e rotas.
- Screens: composicao de UI, estado local e fluxo entre funcionalidades.
- Components: blocos reutilizaveis de apresentacao, ex.: card de pokemon.
- Services: acesso a dados remotos e persistencia.
- Utils: regras pequenas e puras de apoio visual/formatacao.

## Fluxos principais
- Exploracao da pokedex: Start -> Home -> PokemonDetails -> Moves.
- Favoritos globais: Home/PokemonDetails -> favoritesStorage -> AsyncStorage.
- Gerenciamento de times: Teams -> TeamDetail -> AsyncStorage e lista de Pokemon.
- Mapas por regiao: Maps -> PokeAPI + imagens externas.

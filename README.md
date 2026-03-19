# Pokedex Kanto (Mobile + Web)

Projeto completo de Pokedex da 1a geracao (Kanto) com React Native + Expo, integrado a PokeAPI.

## Funcionalidades implementadas

- Lista completa com os 151 Pokemon de Kanto
- Busca por nome ou numero (ex: pikachu, 25)
- Filtros por tipo
- Filtro para ver apenas favoritos
- Ordenacao por numero ou nome
- Limpar filtros com um toque
- Favoritos persistidos localmente com AsyncStorage
- Tela de detalhes com:
	- tipos
	- habilidades
	- altura e peso
	- barras de status base
	- cadeia evolutiva
- Tema visual inspirado na Pokedex classica
- Pull-to-refresh para recarregar dados
- Execucao em Android, iOS e Web

## Tecnologias

- Expo
- React Native
- React Navigation (native-stack)
- AsyncStorage
- PokeAPI

## Estrutura principal

- App.js: navegacao principal
- src/services/pokeapi.js: integracao com PokeAPI
- src/services/favoritesStorage.js: persistencia de favoritos
- src/screens/HomeScreen.js: listagem, busca, filtros e ordenacao
- src/screens/PokemonDetailsScreen.js: detalhes completos de Pokemon
- src/components/PokemonCard.js: card de Pokemon com acao de favorito
- src/utils/pokemonTypes.js: cores e tipos da 1a geracao

## Requisitos

- Node.js LTS instalado
- npm instalado
- Expo Go no celular (para teste mobile sem build nativa)

## Passo a passo para rodar

### 1) Instalar dependencias

```bash
npm install
```

### 2) Iniciar o servidor Expo

```bash
npm start
```

Isso abre o painel do Expo com QR Code e opcao de abrir na web.

## Acesso pelo celular

### Android

1. Instale o app Expo Go pela Play Store.
2. Conecte o celular e o computador na mesma rede Wi-Fi.
3. Rode npm start no projeto.
4. Abra o Expo Go e escaneie o QR Code mostrado no terminal/painel do Expo.
5. O app carregara a Pokedex no celular.

### iOS

1. Instale o app Expo Go pela App Store.
2. Conecte iPhone e computador na mesma rede Wi-Fi.
3. Rode npm start no projeto.
4. Escaneie o QR Code com a camera do iPhone (ou pelo Expo Go).
5. Toque no link detectado para abrir a Pokedex.

## Acesso pela web

1. Rode o comando abaixo:

```bash
npm run web
```

2. Abra no navegador o endereco mostrado no terminal (normalmente http://localhost:19006).
3. A Pokedex sera exibida em modo web responsivo.

## Scripts uteis

- npm start: inicia Expo (menu para Android/iOS/Web)
- npm run web: abre direto em modo web
- npm run android: build/run Android nativo (ambiente Android configurado)
- npm run ios: build/run iOS nativo (somente macOS com Xcode)

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  ScrollView,
  Pressable,
  StyleSheet,
  Text,
  View,
  Vibration
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function bytesToBase64(bytes) {
  let output = '';

  for (let i = 0; i < bytes.length; i += 3) {
    const byte1 = bytes[i];
    const byte2 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const byte3 = i + 2 < bytes.length ? bytes[i + 2] : 0;

    const chunk = (byte1 << 16) | (byte2 << 8) | byte3;

    output += BASE64_ALPHABET[(chunk >> 18) & 63];
    output += BASE64_ALPHABET[(chunk >> 12) & 63];
    output += i + 1 < bytes.length ? BASE64_ALPHABET[(chunk >> 6) & 63] : '=';
    output += i + 2 < bytes.length ? BASE64_ALPHABET[chunk & 63] : '=';
  }

  return output;
}

function createRetroClickWavDataUri() {
  const sampleRate = 22050;
  const durationSeconds = 0.09;
  const sampleCount = Math.floor(sampleRate * durationSeconds);
  const pcm = new Int16Array(sampleCount);

  for (let i = 0; i < sampleCount; i += 1) {
    const t = i / sampleRate;
    const frequency = t < 0.046 ? 988 : 740;
    const phase = (t * frequency) % 1;
    const square = phase < 0.5 ? 1 : -1;
    const decay = Math.max(0, 1 - t / durationSeconds);
    const gate = t < 0.082 ? 1 : 0;
    const amplitude = 0.38 * decay * gate;

    pcm[i] = Math.round(square * amplitude * 32767);
  }

  const dataSize = pcm.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeAscii = (offset, text) => {
    for (let i = 0; i < text.length; i += 1) {
      view.setUint8(offset + i, text.charCodeAt(i));
    }
  };

  writeAscii(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(8, 'WAVE');
  writeAscii(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(36, 'data');
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < pcm.length; i += 1) {
    view.setInt16(44 + i * 2, pcm[i], true);
  }

  const bytes = new Uint8Array(buffer);
  const base64 = bytesToBase64(bytes);

  return `data:audio/wav;base64,${base64}`;
}

const MENU_CLICK_SOUND_URI = createRetroClickWavDataUri();

export default function StartScreen({ navigation }) {
  const bootMessages = useMemo(
    () => [
      'Initializing regional database...',
      'Syncing PokeAPI signal...',
      'Calibrating encounter radar...',
      'System ready.'
    ],
    []
  );
  const [bootStep, setBootStep] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const scanAnimation = useRef(new Animated.Value(0)).current;
  const clickSoundRef = useRef(null);

  useEffect(() => {
    if (bootStep >= bootMessages.length) return;
    const timer = setTimeout(() => {
      setBootStep((current) => current + 1);
    }, 450);

    return () => clearTimeout(timer);
  }, [bootMessages.length, bootStep]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible((value) => !value);
    }, 420);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(scanAnimation, {
        toValue: 1,
        duration: 1900,
        easing: Easing.linear,
        useNativeDriver: true
      })
    );

    loop.start();
    return () => loop.stop();
  }, [scanAnimation]);

  useEffect(() => {
    let isActive = true;

    const prepareSound = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false
        });

        const { sound } = await Audio.Sound.createAsync(
          { uri: MENU_CLICK_SOUND_URI },
          { shouldPlay: false, volume: 0.35 }
        );

        if (!isActive) {
          await sound.unloadAsync();
          return;
        }

        clickSoundRef.current = sound;
      } catch (error) {
        clickSoundRef.current = null;
      }
    };

    prepareSound();

    return () => {
      isActive = false;

      if (clickSoundRef.current) {
        clickSoundRef.current.unloadAsync();
        clickSoundRef.current = null;
      }
    };
  }, []);

  const isBootCompleted = bootStep >= bootMessages.length;
  const scanLineTranslateY = scanAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 210]
  });

  const triggerTactileFeedback = () => {
    if (Platform.OS !== 'web') {
      Vibration.vibrate(12);
    }
  };

  const triggerMenuAudioFeedback = async () => {
    if (!soundEnabled || !clickSoundRef.current) {
      return;
    }

    try {
      await clickSoundRef.current.replayAsync();
    } catch (error) {
      try {
        await clickSoundRef.current.setPositionAsync(0);
        await clickSoundRef.current.playAsync();
      } catch (innerError) {
        // Ignore sound playback failures so navigation still works.
      }
    }
  };

  const menuItems = [
    {
      key: 'pokedex',
      label: 'Pokédex',
      description: 'Explore todos os Pokémons',
      icon: '📚',
      accent: '#ef233c',
      screen: 'PokemonList'
    },
    {
      key: 'teams',
      label: 'Meus Times',
      description: 'Crie e gerencie times',
      icon: '⚔️',
      accent: '#2b9348',
      screen: 'Teams'
    },
    {
      key: 'maps',
      label: 'Mapas',
      description: 'Locais de encontro',
      icon: '🗺️',
      accent: '#277da1',
      screen: 'Maps'
    },
    {
      key: 'effectiveness',
      label: 'Matriz de Efetividade',
      description: 'Comparar tipos',
      icon: '⚡',
      accent: '#f59f00',
      screen: 'EffectivenessMatrix'
    }
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.deviceWrapper}>
          <View style={styles.sideHinge}>
            <View style={styles.hingePin} />
            <View style={styles.hingeCore} />
            <View style={styles.hingePin} />
          </View>

          <View style={styles.deviceShell}>
            <View style={styles.screwTopLeft}>
              <View style={styles.screwSlot} />
            </View>
            <View style={styles.screwTopRight}>
              <View style={styles.screwSlot} />
            </View>
            <View style={styles.screwBottomLeft}>
              <View style={styles.screwSlot} />
            </View>
            <View style={styles.screwBottomRight}>
              <View style={styles.screwSlot} />
            </View>

            <View style={styles.deviceTopBar}>
              <View style={styles.mainLens}>
                <View style={styles.mainLensInner} />
              </View>
              <View style={styles.signalLightsRow}>
                <View style={[styles.signalLight, styles.lightRed]} />
                <View style={[styles.signalLight, styles.lightYellow]} />
                <View style={[styles.signalLight, styles.lightGreen]} />
              </View>
            </View>

            <View style={styles.screenFrame}>
              <View style={styles.screenGlow} />
              <Animated.View
                style={[styles.scanLine, { transform: [{ translateY: scanLineTranslateY }] }]}
              />
              <Text style={styles.monitorLabel}>SYSTEM BOOT</Text>
              <View style={styles.bootConsole}>
                {bootMessages.slice(0, bootStep).map((message) => (
                  <Text key={message} style={styles.bootLine}>
                    {'>'} {message}
                  </Text>
                ))}
                {!isBootCompleted && (
                  <Text style={styles.bootCursor}>{cursorVisible ? '_' : ' '}</Text>
                )}
              </View>
              <Text style={styles.title}>POKEDEX</Text>
              <Text style={styles.subtitle}>Terminal de Pesquisa Pokemon</Text>
              <Text style={styles.statusText}>
                {isBootCompleted ? 'ONLINE EM TODAS AS REGIOES' : 'INICIANDO SISTEMA...'}
              </Text>
            </View>

            <View style={styles.separator} />

            <View style={styles.soundControlRow}>
              <Text style={styles.soundControlLabel}>Feedback sonoro</Text>
              <Pressable
                style={({ pressed }) => [
                  styles.soundToggle,
                  !soundEnabled && styles.soundToggleOff,
                  pressed && styles.soundTogglePressed
                ]}
                onPress={() => setSoundEnabled((current) => !current)}
              >
                <Text style={styles.soundToggleText}>{soundEnabled ? 'SOM ON' : 'SOM OFF'}</Text>
              </Pressable>
            </View>

            <View style={styles.menuGrid}>
              {menuItems.map((item) => (
                <Pressable
                  key={item.key}
                  style={({ pressed }) => [
                    styles.menuButton,
                    { borderColor: item.accent },
                    pressed && styles.menuButtonPressed
                  ]}
                  onPress={() => {
                    triggerTactileFeedback();
                    triggerMenuAudioFeedback();
                    navigation.navigate(item.screen);
                  }}
                >
                  <View style={[styles.menuIndicator, { backgroundColor: item.accent }]} />
                  <Text style={styles.menuIcon}>{item.icon}</Text>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuDescription}>{item.description}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#b50f1f'
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 14,
    paddingVertical: 14
  },
  deviceWrapper: {
    position: 'relative',
    paddingLeft: 14
  },
  sideHinge: {
    position: 'absolute',
    top: 72,
    bottom: 88,
    left: 0,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#710a14',
    backgroundColor: '#b80d20',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    zIndex: 1
  },
  hingeCore: {
    width: 10,
    flex: 1,
    borderRadius: 99,
    marginVertical: 8,
    backgroundColor: '#950d1a'
  },
  hingePin: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2b2d42',
    backgroundColor: '#ffb703'
  },
  deviceShell: {
    flex: 1,
    backgroundColor: '#cf1124',
    borderRadius: 30,
    borderWidth: 4,
    borderColor: '#7f0915',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
    position: 'relative'
  },
  screwTopLeft: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2b2d42',
    backgroundColor: '#d9d9d9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  screwTopRight: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2b2d42',
    backgroundColor: '#d9d9d9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  screwBottomLeft: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2b2d42',
    backgroundColor: '#d9d9d9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  screwBottomRight: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2b2d42',
    backgroundColor: '#d9d9d9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  screwSlot: {
    width: 8,
    height: 2,
    borderRadius: 999,
    backgroundColor: '#6c757d'
  },
  deviceTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  mainLens: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#eaf4ff',
    borderWidth: 4,
    borderColor: '#2b2d42',
    alignItems: 'center',
    justifyContent: 'center'
  },
  mainLensInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#69c0ff',
    borderWidth: 2,
    borderColor: '#1d3557'
  },
  signalLightsRow: {
    flexDirection: 'row',
    gap: 8
  },
  signalLight: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2b2d42'
  },
  lightRed: {
    backgroundColor: '#ff6b6b'
  },
  lightYellow: {
    backgroundColor: '#ffd43b'
  },
  lightGreen: {
    backgroundColor: '#69db7c'
  },
  screenFrame: {
    backgroundColor: '#e9f7ef',
    borderRadius: 18,
    borderWidth: 4,
    borderColor: '#2b2d42',
    paddingVertical: 22,
    paddingHorizontal: 14,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden'
  },
  monitorLabel: {
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: '800',
    color: '#0f5132',
    marginBottom: 6
  },
  bootConsole: {
    width: '100%',
    minHeight: 88,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#8fd19e',
    backgroundColor: '#f5fff8',
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 8
  },
  bootLine: {
    fontSize: 11,
    color: '#2f6b2f',
    fontWeight: '700',
    marginBottom: 2
  },
  bootCursor: {
    fontSize: 12,
    color: '#2f6b2f',
    fontWeight: '900'
  },
  scanLine: {
    position: 'absolute',
    left: 8,
    right: 8,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(32, 201, 151, 0.28)'
  },
  screenGlow: {
    position: 'absolute',
    top: 0,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.35)'
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: '#2b2d42',
    letterSpacing: 1.1
  },
  subtitle: {
    fontSize: 13,
    color: '#495057',
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  statusText: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '800',
    color: '#2b2d42'
  },
  separator: {
    marginTop: 12,
    marginBottom: 10,
    borderRadius: 999,
    height: 6,
    backgroundColor: '#910b19'
  },
  soundControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 2
  },
  soundControlLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffe3e6',
    letterSpacing: 0.4,
    textTransform: 'uppercase'
  },
  soundToggle: {
    borderWidth: 2,
    borderColor: '#1b4332',
    backgroundColor: '#2b9348',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12
  },
  soundToggleOff: {
    borderColor: '#6c757d',
    backgroundColor: '#adb5bd'
  },
  soundTogglePressed: {
    opacity: 0.85
  },
  soundToggleText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12
  },
  menuButton: {
    width: '48%',
    backgroundColor: '#fffdf5',
    borderRadius: 16,
    borderWidth: 3,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 7,
    elevation: 4
  },
  menuButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9
  },
  menuIndicator: {
    width: 42,
    height: 6,
    borderRadius: 999,
    marginBottom: 10
  },
  menuIcon: {
    fontSize: 30,
    marginBottom: 8
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#212529',
    marginBottom: 4,
    textAlign: 'center'
  },
  menuDescription: {
    fontSize: 12,
    color: '#495057',
    fontWeight: '600',
    textAlign: 'center'
  }
});

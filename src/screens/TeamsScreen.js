import React, { useState, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  Modal,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const TEAMS_STORAGE_KEY = 'pokedex_teams';

export default function TeamsScreen({ navigation }) {
  const [teams, setTeams] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [teamName, setTeamName] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadTeams();
    }, [])
  );

  const loadTeams = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(TEAMS_STORAGE_KEY);
      if (raw) {
        setTeams(JSON.parse(raw));
      } else {
        setTeams([]);
      }
    } catch {
      setTeams([]);
    }
  }, []);

  const handleCreateTeam = useCallback(async () => {
    if (!teamName.trim()) {
      Alert.alert('Erro', 'Digite um nome para o time');
      return;
    }

    const newTeam = {
      id: Date.now(),
      name: teamName,
      pokemon: [],
      createdAt: new Date().toISOString()
    };

    try {
      const newTeams = [...teams, newTeam];
      await AsyncStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(newTeams));
      setTeams(newTeams);
      setTeamName('');
      setModalVisible(false);
    } catch {
      Alert.alert('Erro', 'Falha ao criar time');
    }
  }, [teamName, teams]);

  const handleDeleteTeam = useCallback(
    async (teamId) => {
      try {
        const newTeams = teams.filter((t) => t.id !== teamId);
        await AsyncStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(newTeams));
        setTeams(newTeams);
      } catch {
        Alert.alert('Erro', 'Falha ao deletar time');
      }
    },
    [teams]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Pressable
          style={styles.createButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.createButtonText}>+ Novo Time</Text>
        </Pressable>

        <FlatList
          data={teams}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <Pressable
              style={styles.teamCard}
              onPress={() =>
                navigation.navigate('TeamDetail', { teamId: item.id })
              }
            >
              <View style={styles.teamCardContent}>
                <Text style={styles.teamName}>{item.name}</Text>
                <Text style={styles.teamSubtitle}>
                  {item.pokemon.length}/6 Pokémons
                </Text>
              </View>
              <Pressable
                onPress={() => handleDeleteTeam(item.id)}
                hitSlop={8}
              >
                <Text style={styles.deleteIcon}>🗑️</Text>
              </Pressable>
            </Pressable>
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nenhum time criado ainda</Text>
          }
        />

        <Modal visible={modalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Novo Time</Text>
              <TextInput
                style={styles.input}
                placeholder="Nome do time"
                value={teamName}
                onChangeText={setTeamName}
              />
              <View style={styles.modalButtons}>
                <Pressable
                  style={styles.cancelButton}
                  onPress={() => {
                    setModalVisible(false);
                    setTeamName('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  style={styles.confirmButton}
                  onPress={handleCreateTeam}
                >
                  <Text style={styles.confirmButtonText}>Criar</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
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
  createButton: {
    backgroundColor: '#cf1124',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center'
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16
  },
  listContent: {
    paddingBottom: 20
  },
  teamCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fffdf5',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2b2d42',
    padding: 14,
    marginBottom: 10
  },
  teamCardContent: {
    flex: 1
  },
  teamName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#212529',
    marginBottom: 4
  },
  teamSubtitle: {
    fontSize: 13,
    color: '#868e96',
    fontWeight: '600'
  },
  deleteIcon: {
    fontSize: 20
  },
  emptyText: {
    textAlign: 'center',
    color: '#868e96',
    fontSize: 15,
    marginTop: 40,
    fontWeight: '600'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: '#fffdf5',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#2b2d42',
    padding: 20,
    width: '80%',
    maxWidth: 300
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#212529',
    marginBottom: 14
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 16
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 8
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#e9ecef',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center'
  },
  cancelButtonText: {
    color: '#495057',
    fontWeight: '700'
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#cf1124',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center'
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '700'
  }
});

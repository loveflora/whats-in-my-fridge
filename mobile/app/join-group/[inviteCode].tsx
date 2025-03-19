import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '@/context/AppContext';

import { API_URL } from "@/config/api"

export default function JoinGroupScreen() {
  const { inviteCode } = useLocalSearchParams<{ inviteCode: string }>();
  const { settings } = useAppContext();
  const darkMode = settings.theme === 'dark';
  
  const [isLoading, setIsLoading] = useState(true);
  const [groupInfo, setGroupInfo] = useState<{ groupId: string; name: string; memberCount: number } | null>(null);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!inviteCode) {
      setError('uc720ud6a8ud558uc9c0 uc54auc740 ucd08ub300 ucf54ub4dcuc785ub2c8ub2e4.');
      setIsLoading(false);
      return;
    }
    
    fetchGroupInfo();
  }, [inviteCode]);
  
  const fetchGroupInfo = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }
      
      const response = await fetch(`${API_URL}/api/groups/by-invite/${inviteCode}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setGroupInfo(data);
      } else {
        setError(data.message || 'uadf8ub8f9 uc815ubcf4ub97c uac00uc838uc62c uc218 uc5c6uc2b5ub2c8ub2e4.');
      }
    } catch (error) {
      console.error('Error fetching group info:', error);
      setError('uadf8ub8f9 uc815ubcf4ub97c uac00uc838uc624ub294 uc911 uc624ub958uac00 ubc1cuc0ddud588uc2b5ub2c8ub2e4.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleJoinGroup = async () => {
    setJoining(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }
      
      const response = await fetch(`${API_URL}/api/groups/join/${inviteCode}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        Alert.alert(
          'uc131uacf5', 
          `${groupInfo?.name || 'uadf8ub8f9'}uc5d0 uc131uacf5uc801uc73cub85c uac00uc785ud588uc2b5ub2c8ub2e4!`,
          [{ text: 'OK', onPress: () => router.replace('/(tabs)/fridge') }]
        );
      } else {
        Alert.alert('uc624ub958', data.message || 'uadf8ub8f9 uac00uc785uc5d0 uc2e4ud328ud588uc2b5ub2c8ub2e4.');
      }
    } catch (error) {
      console.error('Error joining group:', error);
      Alert.alert('uc624ub958', 'uadf8ub8f9 uac00uc785 uc911 uc624ub958uac00 ubc1cuc0ddud588uc2b5ub2c8ub2e4.');
    } finally {
      setJoining(false);
    }
  };
  
  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <Stack.Screen 
        options={{
          title: 'uadf8ub8f9 ucd08ub300',
          headerStyle: {
            backgroundColor: darkMode ? '#1a1a1a' : '#fff',
          },
          headerTintColor: darkMode ? '#fff' : '#000',
        }} 
      />
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E78B7" />
          <Text style={[styles.loadingText, darkMode && styles.darkText]}>uadf8ub8f9 uc815ubcf4ub97c uac00uc838uc624ub294 uc911...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color={darkMode ? "#ff6b6b" : "#ff4757"} />
          <Text style={[styles.errorTitle, darkMode && styles.darkText]}>uc624ub958uac00 ubc1cuc0ddud588uc2b5ub2c8ub2e4</Text>
          <Text style={[styles.errorMessage, darkMode && styles.darkSecondaryText]}>{error}</Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => router.replace('/(tabs)/fridge')}
          >
            <Text style={styles.buttonText}>ud648uc73cub85c ub3ccuc544uac00uae30</Text>
          </TouchableOpacity>
        </View>
      ) : groupInfo ? (
        <View style={styles.groupInfoContainer}>
          <View style={styles.groupHeader}>
            <Ionicons name="people-circle-outline" size={80} color={darkMode ? "#2E78B7" : "#2E78B7"} />
            <Text style={[styles.groupName, darkMode && styles.darkText]}>{groupInfo.name}</Text>
            <Text style={[styles.memberCount, darkMode && styles.darkSecondaryText]}>
              ud604uc7ac {groupInfo.memberCount}uba85uc758 uba64ubc84uac00 uac00uc785ud588uc2b5ub2c8ub2e4
            </Text>
          </View>
          
          <Text style={[styles.inviteMessage, darkMode && styles.darkText]}>
            uc774 uadf8ub8f9uc5d0 uac00uc785ud558uc2dcuaca0uc2b5ub2c8uae4c? uac00uc785ud558uba74 uadf8ub8f9uc758 ub0c9uc7a5uace0ub97c uacf5uc720ud558uace0 ub2e4ub978 uba64ubc84ub4e4uacfc ud568uaed8 uc0acuc6a9ud560 uc218 uc788uc2b5ub2c8ub2e4.
          </Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, joining && styles.disabledButton]}
              onPress={handleJoinGroup}
              disabled={joining}
            >
              {joining ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>uadf8ub8f9 uac00uc785ud558uae30</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.cancelButton, joining && styles.disabledButton]}
              onPress={() => router.replace('/(tabs)/fridge')}
              disabled={joining}
            >
              <Text style={styles.cancelButtonText}>ucde8uc18c</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    color: '#333',
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 30,
    color: '#666',
  },
  groupInfoContainer: {
    flex: 1,
    padding: 20,
  },
  groupHeader: {
    alignItems: 'center',
    marginVertical: 30,
  },
  groupName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 15,
    color: '#333',
  },
  memberCount: {
    fontSize: 16,
    marginTop: 5,
    color: '#666',
  },
  inviteMessage: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  buttonContainer: {
    gap: 10,
  },
  button: {
    backgroundColor: '#2E78B7',
    borderRadius: 5,
    padding: 15,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 15,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  darkText: {
    color: '#fff',
  },
  darkSecondaryText: {
    color: '#aaa',
  },
});

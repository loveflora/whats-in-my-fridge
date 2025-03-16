import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '@/context/AppContext';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';


// API URL을 여러 옵션 중에서 작동하는 것을 선택하도록 함
// 에뮬레이터와 실제 기기에서 각각 다른 URL이 필요할 수 있음
const API_URLS = [
  'http://192.168.20.8:5001',
  'http://localhost:5001',
  'http://127.0.0.1:5001'
];
let API_URL = API_URLS[0]; // 기본값

interface FridgeItem {
  _id: string;
  name: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  category: string;
}

interface ApiError {
  message: string;
}

export default function FridgeScreen() {
  const { settings } = useAppContext();
  const isDarkMode = settings.theme === 'dark';

  const [items, setItems] = useState<FridgeItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // API URL 테스트 함수
  const testApiConnection = async () => {
    for (const url of API_URLS) {
      try {
        console.log(`Testing connection to ${url}...`);
        
        // AbortController를 사용하여 타임아웃 구현
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3초 타임아웃
        
        const response = await fetch(`${url}/api/health`, {
          method: 'HEAD',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
        
          API_URL = url;
          return true;
        }
      } catch (err) {
        console.log(`Connection to ${url} failed:`, err);
      }
    }
    return false;
  };

  useFocusEffect(
    useCallback(() => {
      const initAndFetch = async () => {
        await testApiConnection();
        fetchItems();
      };

      initAndFetch();
    }, [])
  );

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      console.log("Fetching items from:", `${API_URL}/api/fridge/items`);
      const response = await fetch(`${API_URL}/api/fridge/items`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          await AsyncStorage.removeItem('userToken');
          router.replace('/auth/login');
          return;
        }
        const errorData = await response.json() as ApiError;
        throw new Error(errorData.message || 'Failed to fetch items');
      }

      const data = await response.json() as FridgeItem[];
      setItems(Array.isArray(data) ? data : []);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch items';
      setError(errorMessage);
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchItems();
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      const response = await fetch(`${API_URL}/api/fridge/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json() as ApiError;
        throw new Error(errorData.message || 'Failed to delete item');
      }

      setItems(items.filter(item => item._id !== itemId));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete item';
      Alert.alert('Error', errorMessage);
    }
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryColor = (daysUntilExpiry: number) => {
    if (daysUntilExpiry < 0) return '#FF0000';
    if (daysUntilExpiry <= 3) return '#FFA500';
    return '#4CAF50';
  };

  const renderItem = ({ item }: { item: FridgeItem }) => {
    if (!item || !item.expiryDate) {
      return null;
    }
    
    const daysUntilExpiry = getDaysUntilExpiry(item.expiryDate);
    const expiryColor = getExpiryColor(daysUntilExpiry);

    // 아이템 상세 페이지로 이동
    const handleItemPress = () => {
      router.push(`/item-details?id=${item._id}`);
    };

    return (
      <TouchableOpacity
        style={[styles.itemContainer, isDarkMode && styles.darkItemContainer]}
        onPress={handleItemPress}
      >
        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, isDarkMode && styles.darkText]}>{item.name}</Text>
          <Text style={[styles.itemDetails, isDarkMode && styles.darkItemDetails]}>
            {item.quantity} {item.unit} • {item.category}
          </Text>
          <Text style={[styles.expiryText, { color: expiryColor }]}>
            {daysUntilExpiry < 0
              ? 'Expired'
              : daysUntilExpiry === 0
              ? 'Expires today'
              : `Expires in ${daysUntilExpiry} days`}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              'Delete Item',
              'Are you sure you want to delete this item?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', onPress: () => handleDeleteItem(item._id), style: 'destructive' },
              ]
            );
          }}
        >
          <Ionicons name="trash-outline" size={24} color="#FF0000" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, isDarkMode && styles.darkContainer, styles.centerContent]}>
        <ActivityIndicator size="large" color={isDarkMode ? "#3478F6" : "#0000ff"} />
        <Text style={[styles.loadingText, isDarkMode && styles.darkText]}>Loading your fridge items...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, isDarkMode && styles.darkContainer, styles.centerContent]}>
        <Ionicons name="alert-circle-outline" size={48} color={isDarkMode ? "#ff6b6b" : "#ff0000"} />
        <Text style={[styles.errorText, isDarkMode && styles.darkText]}>Error loading items</Text>
        <Text style={[styles.errorSubText, isDarkMode && styles.darkSubText]}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchItems}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDarkMode && styles.darkContainer]}>
      <View style={[styles.header, isDarkMode && styles.darkHeader]}>
        <Text style={[styles.title, isDarkMode && styles.darkText]}>Categories</Text>
        <TouchableOpacity
          style={styles.addListButton}
          onPress={() => {
            router.push('/modal/addItem');
          }}
        >
          <Ionicons name="add-circle" size={24} color={isDarkMode ? '#fff' : '#3478F6'} />
        </TouchableOpacity>
      </View>

      {items.length > 0 ? (
        <>
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
</>
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="fridge-outline" size={64} color={isDarkMode ? '#555' : '#ccc'} />
          <Text
            style={[
              styles.emptyText,
              isDarkMode && styles.darkText,
            ]}
          >
            No items in this list
          </Text>
          <Text
            style={[
              styles.emptySubtext,
              isDarkMode && styles.darkText,
            ]}
          >
            Tap the + button to add items
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    position: 'relative',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  darkHeader: {
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  darkItemContainer: {
    backgroundColor: '#2c2c2c',
  },
  itemInfo: {
    flex: 1,
    marginRight: 16,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  darkText: {
    color: '#fff',
  },
  itemDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  darkItemDetails: {
    color: '#aaa',
  },
  expiryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    width: 70,
    height: 70,
    zIndex: 9999,
  },
  addListButton: {
    padding: 8,
  },
  addButton: {
    backgroundColor: '#3478F6',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 2,
    borderColor: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    color: '#666',
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  darkSubText: {
    color: '#777',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  errorText: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff0000',
    textAlign: 'center',
  },
  errorSubText: {
    marginTop: 5,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3478F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

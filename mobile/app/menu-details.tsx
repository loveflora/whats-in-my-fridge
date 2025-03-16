import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '@/context/AppContext';

const API_URL = 'http://192.168.20.8:5001';

interface Ingredient {
  name?: string;
  quantity?: number;
  unit?: string;
  item?: {
    name: string;
    category?: string;
  };
}

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  ingredients: Ingredient[];
  category?: string;
  type?: string;
  mealType?: string;
  date: string;
}

export default function MenuDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { settings } = useAppContext();
  const isDarkMode = settings.theme === 'dark';

  const [menu, setMenu] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMenuDetails();
  }, [id]);

  const fetchMenuDetails = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      // API 호출 전 로그 추가
      console.log(`메뉴 상세 정보 가져오기: ID=${id}, API URL=${API_URL}`);

      const response = await fetch(`${API_URL}/api/menu/${id}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      // API 응답 상태 확인 로그
      console.log('메뉴 상세 API 응답 상태:', response.status);

      if (!response.ok) {
        // 응답 본문 로그 (디버깅용)
        const errorText = await response.text();
        console.error('API 오류 응답:', errorText);
        throw new Error('Failed to fetch menu details');
      }

      const data = await response.json();
      console.log("메뉴 디테일 데이터:", data);

      setMenu(data);
    } catch (error) {
      console.error('Error fetching menu details:', error);
      Alert.alert('Error', 'Failed to load menu details');
    } finally {
      setLoading(false);
    }
  };

  // 카테고리에 따른 색상 반환
  const getColorForCategory = (category: string) => {
    const colorMap: { [key: string]: string } = {
      breakfast: '#FFA500', // 주황색
      lunch: '#32CD32',     // 라임색
      dinner: '#1E90FF',    // 파란색
      dessert: '#FF69B4',   // 핑크색
      snack: '#9370DB',     // 보라색
      drink: '#00CED1',     // 청록색
      other: '#A9A9A9'      // 회색
    };

    return colorMap[category] || colorMap.other;
  };

  // 날짜를 보기 좋게 포맷팅하는 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return date.toLocaleDateString('ko-KR', options);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, isDarkMode && styles.darkContainer]}>
        <ActivityIndicator size="large" color={isDarkMode ? "#3478F6" : "#0000ff"} />
      </View>
    );
  }

  if (!menu) {
    return (
      <View style={[styles.container, isDarkMode && styles.darkContainer]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#fff' : '#333'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isDarkMode && styles.darkText]}>메뉴 상세</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={isDarkMode ? "#777" : "#ccc"} />
          <Text style={[styles.errorText, isDarkMode && styles.darkText]}>메뉴를 찾을 수 없습니다</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDarkMode && styles.darkContainer]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#fff' : '#333'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDarkMode && styles.darkText]}>메뉴 상세</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={[styles.menuHeader, { backgroundColor: getColorForCategory(menu.category || '') }]}>
          <Text style={styles.menuTitle}>{menu.name}</Text>
          <View style={styles.menuTypeContainer}>
            <Text style={styles.menuType}>{menu.mealType || menu.type || menu.category}</Text>
          </View>
        </View>

        <View style={[styles.detailsContainer, isDarkMode && styles.darkDetailsContainer]}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={20} color={isDarkMode ? '#ddd' : '#666'} />
            <Text style={[styles.detailText, isDarkMode && styles.darkText]}>
              {menu.date ? formatDate(menu.date) : '날짜 정보 없음'}
            </Text>
          </View>

          {menu.description && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>설명</Text>
              <Text style={[styles.description, isDarkMode && styles.darkText]}>
                {menu.description}
              </Text>
            </View>
          )}

          {menu.ingredients && menu.ingredients.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>재료</Text>
              {menu.ingredients.map((ingredient, idx) => {
                let ingredientName = '';
                let quantity = '';

                if (ingredient.item && ingredient.item.name) {
                  ingredientName = ingredient.item.name;
                  quantity = `${ingredient.quantity || ''} ${ingredient.unit || ''}`.trim();
                } else if (ingredient.name) {
                  ingredientName = ingredient.name;
                  quantity = `${ingredient.quantity || ''} ${ingredient.unit || ''}`.trim();
                } else if (typeof ingredient === 'string') {
                  ingredientName = ingredient;
                  quantity = '';
                } else {
                  ingredientName = JSON.stringify(ingredient).substring(0, 20);
                  quantity = '';
                }

                return (
                  <View key={idx} style={styles.ingredientItem}>
                    <Text style={[styles.ingredientName, isDarkMode && styles.darkText]}>
                      {ingredientName}
                    </Text>
                    {quantity && (
                      <Text style={[styles.ingredientQuantity, isDarkMode && styles.darkSubText]}>
                        {quantity}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    color: '#555',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingTop: 60,
  },
  darkHeader: {
    backgroundColor: '#1c1c1c',
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  menuHeader: {
    padding: 24,
    backgroundColor: '#3478F6',
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginBottom: 8,
  },
  menuTypeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  menuType: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  detailsContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  darkDetailsContainer: {
    backgroundColor: '#242424',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailText: {
    fontSize: 16,
    marginLeft: 8,
    color: '#444',
  },
  darkText: {
    color: '#e0e0e0',
  },
  darkSubText: {
    color: '#aaa',
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
  },
  ingredientsList: {
    marginTop: 8,
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  ingredientName: {
    fontSize: 16,
    color: '#333',
  },
  ingredientQuantity: {
    fontSize: 14,
    color: '#666',
  },
});
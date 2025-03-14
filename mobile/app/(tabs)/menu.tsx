import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, CalendarList, Agenda } from 'react-native-calendars';
import { useAppContext } from '@/context/AppContext';

const API_URL = 'http://192.168.20.8:5001';

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  ingredients: string[];
  category: string;
  date?: string;
}

const CATEGORIES = [
  'breakfast',
  'lunch',
  'dinner',
  'dessert',
  'snack',
  'drink',
  'other',
];

export default function MenuScreen() {
  const { settings } = useAppContext();
  const isDarkMode = settings.theme === 'dark';
  
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [markedDates, setMarkedDates] = useState<{[key: string]: any}>({});
  const [menusByDate, setMenusByDate] = useState<{[key: string]: MenuItem[]}>({});

  useFocusEffect(
    useCallback(() => {
      fetchMenus();
    }, [])
  );

  const fetchMenus = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      const response = await fetch(`${API_URL}/api/menu`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch menus');
      }

      const data = await response.json();
      setMenus(data);
      
      // 현재 날짜 선택
      const today = new Date().toISOString().split('T')[0];
      setSelectedDate(today);
      
      // 메뉴를 날짜별로 정리
      const menuDateMap: {[key: string]: MenuItem[]} = {};
      const marked: {[key: string]: any} = {};
      
      // 임시 데이터: 각 메뉴에 무작위 날짜 할당 (실제로는 API에서 날짜 정보가 와야 함)
      data.forEach((menu: MenuItem) => {
        // 일반적으로는 서버에서 날짜 정보가 와야 하지만 데모를 위해 랜덤 날짜 할당
        // 실제 앱에서는 이 부분을 API에서 받은 데이터로 대체해야 함
        const randomDayOffset = Math.floor(Math.random() * 14) - 7; // -7 ~ +7일
        const menuDate = new Date();
        menuDate.setDate(menuDate.getDate() + randomDayOffset);
        const dateString = menuDate.toISOString().split('T')[0];
        
        const menuWithDate = {...menu, date: dateString};
        
        if (!menuDateMap[dateString]) {
          menuDateMap[dateString] = [];
        }
        menuDateMap[dateString].push(menuWithDate);
        
        marked[dateString] = {
          marked: true,
          dotColor: getColorForCategory(menu.category)
        };
      });
      
      // 오늘 날짜는 항상 선택됨으로 표시
      marked[today] = {
        ...marked[today],
        selected: true,
        selectedColor: '#2E78B7'
      };
      
      setMenusByDate(menuDateMap);
      setMarkedDates(marked);
      
    } catch (error) {
      console.error('Error fetching menus:', error);
      Alert.alert('Error', 'Failed to load menus');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMenus();
  };
  
  const handleDateSelect = (day: any) => {
    const selectedDateString = day.dateString;
    
    // 선택된 날짜에 마커 업데이트
    const newMarkedDates = {...markedDates};
    
    // 이전 선택 날짜의 selected 속성 제거
    Object.keys(newMarkedDates).forEach(date => {
      if (newMarkedDates[date].selected) {
        newMarkedDates[date] = {
          ...newMarkedDates[date],
          selected: false
        };
      }
    });
    
    // 새 선택 날짜에 selected 속성 추가
    newMarkedDates[selectedDateString] = {
      ...newMarkedDates[selectedDateString],
      selected: true,
      selectedColor: '#2E78B7'
    };
    
    setMarkedDates(newMarkedDates);
    setSelectedDate(selectedDateString);
  };
  
  // 카테고리에 따른 색상 반환
  const getColorForCategory = (category: string) => {
    const colorMap: {[key: string]: string} = {
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
  
  // 메뉴 추가하기 화면으로 이동
  const handleAddMenu = () => {
    router.push('/modal/addMenu');
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, isDarkMode && styles.darkContainer]}>
        <ActivityIndicator size="large" color={isDarkMode ? "#3478F6" : "#0000ff"} />
      </View>
    );
  }

  return (
    <View style={[styles.container, isDarkMode && styles.darkContainer]}>
      <ScrollView
        contentContainerStyle={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={[styles.calendarContainer, isDarkMode && styles.darkCalendarContainer]}>
          <Calendar
            markedDates={markedDates}
            onDayPress={handleDateSelect}
            theme={{
              backgroundColor: isDarkMode ? '#1c1c1c' : '#ffffff',
              calendarBackground: isDarkMode ? '#1c1c1c' : '#ffffff',
              textSectionTitleColor: isDarkMode ? '#9e9e9e' : '#b6c1cd',
              selectedDayBackgroundColor: '#2E78B7',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#2E78B7',
              dayTextColor: isDarkMode ? '#e0e0e0' : '#2d4150',
              textDisabledColor: isDarkMode ? '#484848' : '#d9e1e8',
              dotColor: '#00adf5',
              selectedDotColor: '#ffffff',
              arrowColor: '#2E78B7',
              monthTextColor: isDarkMode ? '#e0e0e0' : '#2d4150',
              indicatorColor: '#2E78B7',
            }}
          />
        </View>
      
        {/* 메뉴 추가 플로팅 버튼 */}
      <TouchableOpacity style={styles.addButton} onPress={handleAddMenu}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

        <View style={styles.menuListContainer}>
          <Text style={[styles.dateTitle, isDarkMode && styles.darkText]}>{formatDate(selectedDate)}</Text>
          {menusByDate[selectedDate] && menusByDate[selectedDate].length > 0 ? (
            menusByDate[selectedDate].map((menu, index) => (
              <View key={menu._id || index} style={[styles.menuItem, isDarkMode && styles.darkMenuItem]}>
                <View style={[styles.categoryBar, {backgroundColor: getColorForCategory(menu.category)}]} />
                <View style={styles.menuContent}>
                  <Text style={[styles.menuTitle, isDarkMode && styles.darkText]}>{menu.name}</Text>
                  <Text style={[styles.menuCategory, isDarkMode && styles.darkSubText]}>{menu.category}</Text>
                  {menu.description && (
                    <Text style={[styles.menuDescription, isDarkMode && styles.darkText]}>{menu.description}</Text>
                  )}

                  {/* {menu.ingredients && menu.ingredients.length > 0 && (
                    <Text style={[styles.menuIngredients, isDarkMode && styles.darkSubText]}>
                      <Text style={[styles.ingredientsLabel, isDarkMode && styles.darkText]}>재료: </Text>
                      {menu.ingredients.join(', ')}
                    </Text>
                  )} */}
                
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="restaurant-outline" size={48} color={isDarkMode ? "#666" : "#ccc"} />
              <Text style={[styles.emptyText, isDarkMode && styles.darkText]}>선택한 날짜에 계획된 메뉴가 없습니다.</Text>
              <Text style={[styles.emptySubText, isDarkMode && styles.darkSubText]}>'+' 버튼을 눌러 새 메뉴를 추가하세요.</Text>
            </View>
          )}
        </View>
      </ScrollView>
      
     
    </View>
  );
}

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  scrollView: {
    paddingBottom: 80, // 하단에 추가 버튼을 위한 공간
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  darkCalendarContainer: {
    backgroundColor: '#1c1c1c',
    borderBottomColor: '#333',
  },
  menuListContainer: {
    padding: 16,
  },
  dateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  darkText: {
    color: '#fff',
  },
  darkSubText: {
    color: '#aaa',
  },
  menuItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  darkMenuItem: {
    backgroundColor: '#2c2c2c',
    shadowColor: '#000',
    borderColor: '#333',
  },
  categoryBar: {
    width: 6,
    height: '100%',
  },
  menuContent: {
    flex: 1,
    padding: 16,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  menuCategory: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
    marginBottom: 8,
  },
  menuDescription: {
    fontSize: 14,
    color: '#444',
    marginBottom: 8,
  },
  menuIngredients: {
    fontSize: 13,
    color: '#666',
  },
  ingredientsLabel: {
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  addButton: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2E78B7',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
});

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

import { API_URL } from "@/config/api"

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  ingredients: string[];
  category: string;
  date?: string;
}

// interface MenuItem {
//   _id: string;
//   name: string;
//   description: string;
//   ingredients: any[];
//   category: string;
//   date: string;
//   mealType: string;
// }

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


//   useFocusEffect(
//     useCallback(() => {
//       // console.log('메뉴 화면이 포커스를 얻었습니다. 메뉴 데이터를 새로고침합니다.');
//       fetchMenus();
      
//       // 컴포넌트가 언마운트될 때 정리 함수
//       // return () => {
//         // console.log('메뉴 화면이 포커스를 잃었습니다.');
//       // };
//     }, []) // 빈 의존성 배열은 화면이 포커스될 때마다 실행됨
//   );

//   const fetchMenus = async () => {
//     try {
//       setLoading(true);
//       const token = await AsyncStorage.getItem('userToken');
//       if (!token) {
//         router.replace('/auth/login');
//         return;
//       }

//       const response = await fetch(`${API_URL}/api/menu`, {
//         method: 'GET',
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       if (!response.ok) {
//         throw new Error('Failed to fetch menus');
//       }

//       const data = await response.json();
//       // console.log('메뉴 데이터 전체:', JSON.stringify(data).substring(0, 200) + '...');
      
//       // 첫 번째 항목 상세 로그
//       // if (data && data.length > 0) {
//       //   console.log('첫 번째 메뉴 항목:', JSON.stringify(data[0]));
//       // }
      
//       setMenus(data);
      
//       // 현재 날짜 선택
//       const today = new Date().toISOString().split('T')[0];
//       setSelectedDate(today);
      
//       // 메뉴를 날짜별로 정리
//       const menuDateMap: {[key: string]: MenuItem[]} = {};
//       const marked: {[key: string]: any} = {};
      
//       // 서버에서 받은 데이터를 날짜별로 그룹화
//       data.forEach((menu: MenuItem) => {
//         // API에서 날짜 정보가 있으면 사용하고, 없으면 오늘 날짜를 기본값으로 사용
//         const dateString = menu.date || today;
        
//         if (!menuDateMap[dateString]) {
//           menuDateMap[dateString] = [];
//         }
//         menuDateMap[dateString].push(menu);
        
//         // 마커 정보 업데이트
//         if (!marked[dateString]) {
//           marked[dateString] = {
//             marked: true,
//             dots: []
//           };
//         }
        
//         // category 또는 type 필드 사용 (둘 다 없으면 'other' 기본값 사용)
//         const categoryValue = menu.category || menu.mealType || 'other';
//         console.log(`메뉴 ${menu.name}의 카테고리: ${categoryValue}`);
        
//         // 카테고리 색상으로 점 추가
//         marked[dateString].dots.push({
//           color: getColorForCategory(categoryValue),
//           key: menu._id
//         });
//       });
      
//       // 오늘 날짜는 항상 선택됨으로 표시
//       marked[today] = {
//         ...marked[today],
//         selected: true,
//         selectedColor: '#2E78B7'
//       };
      
//       setMenusByDate(menuDateMap);
//       setMarkedDates(marked);
      
//     } catch (error) {
//       console.error('Error fetching menus:', error);
//       Alert.alert('Error', 'Failed to load menus');
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   const handleRefresh = () => {
//     setRefreshing(true);
//     fetchMenus();
//   };
  
//   const handleDateSelect = (day: any) => {
//     const selectedDateString = day.dateString;
    
//     // 선택된 날짜에 마커 업데이트
//     const newMarkedDates = {...markedDates};
    
//     // 이전 선택 날짜의 selected 속성 제거
//     Object.keys(newMarkedDates).forEach(date => {
//       if (newMarkedDates[date].selected) {
//         newMarkedDates[date] = {
//           ...newMarkedDates[date],
//           selected: false
//         };
//       }
//     });
    
//     // 새 선택 날짜에 selected 속성 추가
//     newMarkedDates[selectedDateString] = {
//       ...newMarkedDates[selectedDateString],
//       selected: true,
//       selectedColor: '#2E78B7'
//     };
    
//     setMarkedDates(newMarkedDates);
//     setSelectedDate(selectedDateString);
//   };
  
//   // 카테고리에 따른 색상 반환
//   const getColorForCategory = (category: string) => {
//     const colorMap: {[key: string]: string} = {
//       breakfast: '#FFA500', // 주황색
//       lunch: '#32CD32',     // 라임색
//       dinner: '#1E90FF',    // 파란색
//       dessert: '#FF69B4',   // 핑크색
//       snack: '#9370DB',     // 보라색
//       drink: '#00CED1',     // 청록색
//       other: '#A9A9A9'      // 회색
//     };
    
//     return colorMap[category] || colorMap.other;
//   };
  
//   // 메뉴 추가하기 화면으로 이동
//   const handleAddMenu = () => {
//     router.push('/modal/addMenu');
//   };

//   // 메뉴 상세 페이지로 이동
//   const handleMenuPress = (menu: MenuItem) => {
//     // 상세 페이지로 메뉴 ID를 전달하여 이동
//     router.push({
//       pathname: "/menuDetails",
//       params: { id: menu._id }
//     });
//   };

//   if (loading) {
//     return (
//       <View style={[styles.loadingContainer, isDarkMode && styles.darkContainer]}>
//         <ActivityIndicator size="large" color={isDarkMode ? "#3478F6" : "#0000ff"} />
//       </View>
//     );
//   }

//   console.log("setMarkedDates>>>>>", markedDates)

//   return (
//     <View style={[styles.container, isDarkMode && styles.darkContainer]}>
//       <ScrollView
//         contentContainerStyle={styles.scrollView}
//         refreshControl={
//           <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
//         }
//       >
//         <View style={[styles.calendarContainer, isDarkMode && styles.darkCalendarContainer]}>
//           <Calendar
//             markedDates={markedDates}
//             onDayPress={handleDateSelect}
//             theme={{
//               backgroundColor: isDarkMode ? '#1c1c1c' : '#ffffff',
//               calendarBackground: isDarkMode ? '#1c1c1c' : '#ffffff',
//               textSectionTitleColor: isDarkMode ? '#9e9e9e' : '#b6c1cd',
//               selectedDayBackgroundColor: '#2E78B7',
//               selectedDayTextColor: '#ffffff',
//               todayTextColor: '#2E78B7',
//               dayTextColor: isDarkMode ? '#e0e0e0' : '#2d4150',
//               textDisabledColor: isDarkMode ? '#484848' : '#d9e1e8',
//               dotColor: '#00adf5',
//               selectedDotColor: '#ffffff',
//               arrowColor: '#2E78B7',
//               monthTextColor: isDarkMode ? '#e0e0e0' : '#2d4150',
//               indicatorColor: '#2E78B7',
//             }}
//           />
//         </View>
      
//         {/* 메뉴 추가 플로팅 버튼 */}
//       <TouchableOpacity style={styles.addButton} onPress={handleAddMenu}>
//         <Ionicons name="add" size={28} color="#fff" />
//       </TouchableOpacity>

//         <View style={styles.menuListContainer}>
//           <Text style={[styles.dateTitle, isDarkMode && styles.darkText]}>{formatDate(selectedDate)}</Text>
//           {menusByDate[selectedDate] && menusByDate[selectedDate].length > 0 ? (
//             menusByDate[selectedDate].map((menu, index) => (
//               <TouchableOpacity
//                 key={menu._id || index}
//                 style={[styles.menuItem, isDarkMode && styles.darkMenuItem]}
//                 onPress={() => handleMenuPress(menu)}
//               >
//                 <View style={[styles.categoryBar, {backgroundColor: getColorForCategory(menu.category)}]} />
//                 <View style={styles.menuContent}>
//                   <View style={styles.menuHeader}>
//                     <Text style={[styles.menuTitle, isDarkMode && styles.darkText]}>{menu.name}</Text>
//                     <Text style={[styles.menuCategory, isDarkMode && styles.darkSubText]}>{menu.category}</Text>
//                   </View>
                  
//                   {menu.description && (
//                     <Text 
//                       style={[styles.menuDescription, isDarkMode && styles.darkText]}
//                       numberOfLines={2}
//                       ellipsizeMode="tail"
//                     >
//                       {menu.description}
//                     </Text>
//                   )}
                  
//                   {menu.ingredients && menu.ingredients.length > 0 && (
//                     <Text 
//                       style={[styles.menuIngredients, isDarkMode && styles.darkSubText]}
//                       numberOfLines={1}
//                       ellipsizeMode="tail"
//                     >
//                       <Text style={{fontWeight: '500'}}>재료: </Text>
//                       {menu.ingredients.map(ing => 
//                         typeof ing === 'string' ? ing : (ing.name || '')
//                       ).join(', ')}
//                     </Text>
//                   )}
//                 </View>
//                 <Ionicons 
//                   name="chevron-forward" 
//                   size={20} 
//                   color={isDarkMode ? "#666" : "#ccc"} 
//                   style={styles.menuArrow} 
//                 />
//               </TouchableOpacity>
//             ))
//           ) : (
//             <View style={styles.emptyState}>
//               <Ionicons name="restaurant-outline" size={48} color={isDarkMode ? "#666" : "#ccc"} />
//               <Text style={[styles.emptyText, isDarkMode && styles.darkText]}>선택한 날짜에 계획된 메뉴가 없습니다.</Text>
//               <Text style={[styles.emptySubText, isDarkMode && styles.darkSubText]}>'+' 버튼을 눌러 새 메뉴를 추가하세요.</Text>
//             </View>
//           )}
//         </View>
//       </ScrollView>
      
     
//     </View>
//   );
// }

// // 날짜를 보기 좋게 포맷팅하는 함수
// const formatDate = (dateString: string) => {
//   const date = new Date(dateString);
//   const options: Intl.DateTimeFormatOptions = { 
//     weekday: 'long', 
//     year: 'numeric', 
//     month: 'long', 
//     day: 'numeric' 
//   };
//   return date.toLocaleDateString('ko-KR', options);
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   darkContainer: {
//     backgroundColor: '#121212',
//   },
//   scrollView: {
//     paddingBottom: 80, // 하단에 추가 버튼을 위한 공간
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   calendarContainer: {
//     padding: 10,
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//   },
//   darkCalendarContainer: {
//     backgroundColor: '#1c1c1c',
//     borderBottomColor: '#333',
//   },
//   menuListContainer: {
//     padding: 16,
//   },
//   dateTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     marginBottom: 16,
//     color: '#333',
//   },
//   darkText: {
//     color: '#fff',
//   },
//   darkSubText: {
//     color: '#aaa',
//   },
//   menuItem: {
//     flexDirection: 'row',
//     backgroundColor: '#fff',
//     borderRadius: 8,
//     marginBottom: 12,
//     overflow: 'hidden',
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.2,
//     shadowRadius: 2,
//   },
//   darkMenuItem: {
//     backgroundColor: '#242424',
//   },
//   categoryBar: {
//     width: 6,
//     backgroundColor: '#3478F6',
//   },
//   menuContent: {
//     flex: 1,
//     padding: 12,
//   },
//   menuHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 4,
//   },
//   menuTitle: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     flex: 1,
//   },
//   mealType: {
//     fontSize: 12,
//     fontWeight: '500',
//     padding: 4,
//     paddingHorizontal: 8,
//     borderRadius: 12,
//     overflow: 'hidden',
//     marginLeft: 8,
//   },
//   menuDescription: {
//     fontSize: 14,
//     marginTop: 4,
//     color: '#555',
//   },
//   menuIngredients: {
//     fontSize: 13,
//     marginTop: 6,
//     color: '#777',
//   },
//   menuArrow: {
//     alignSelf: 'center',
//     marginRight: 12,
//   },
//   addButton: {
//     position: 'absolute',
//     right: 24,
//     bottom: 24,
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     backgroundColor: '#2E78B7',
//     justifyContent: 'center',
//     alignItems: 'center',
//     elevation: 4,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//     zIndex: 1000,
//   },
//   emptyState: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 32,
//   },
//   emptyText: {
//     fontSize: 16,
//     color: '#666',
//     marginTop: 16,
//     textAlign: 'center',
//   },
//   emptySubText: {
//     fontSize: 14,
//     color: '#999',
//     marginTop: 8,
//     textAlign: 'center',
//   },
// });












  



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

      // console.log("메뉴나와라>>>>>>>>", data)
      

      //! 날짜 시차 때문인지 맞지 않음
      // 현재 날짜 선택
      const today = new Date().toISOString().split('T')[0];
      setSelectedDate(today);
      
      // console.log("오늘 날짜는???????????/", today)
      
      
      // 메뉴를 날짜별로 정리
      const menuDateMap: {[key: string]: MenuItem[]} = {};
      const marked: {[key: string]: any} = {};
      
      // 임시 데이터: 각 메뉴에 무작위 날짜 할당 (실제로는 API에서 날짜 정보가 와야 함)
      // data.forEach((menu: MenuItem) => {
      //   // 일반적으로는 서버에서 날짜 정보가 와야 하지만 데모를 위해 랜덤 날짜 할당
      //   // 실제 앱에서는 이 부분을 API에서 받은 데이터로 대체해야 함
      //   const randomDayOffset = Math.floor(Math.random() * 14) - 7; // -7 ~ +7일
      //   const menuDate = new Date();
      //   menuDate.setDate(menuDate.getDate() + randomDayOffset);
      //   const dateString = menuDate.toISOString().split('T')[0];
        
      //   const menuWithDate = {...menu, date: dateString};
        
      //   if (!menuDateMap[dateString]) {
      //     menuDateMap[dateString] = [];
      //   }
      //   menuDateMap[dateString].push(menuWithDate);
        
      //   marked[dateString] = {
      //     marked: true,
      //     dotColor: getColorForCategory(menu.category)
      //   };
      // });
      
      // data.forEach((menu: MenuItem) => {
      //           // API에서 날짜 정보가 있으면 사용하고, 없으면 오늘 날짜를 기본값으로 사용
      //           const dateString = menu.date || today;
                
      //           if (!menuDateMap[dateString]) {
      //             menuDateMap[dateString] = [];
      //           }
      //           menuDateMap[dateString].push(menu);
                
      //           // 마커 정보 업데이트
      //           if (!marked[dateString]) {
      //             marked[dateString] = {
      //               marked: true,
      //               dots: []
      //             };
      //           }
                
      //           // category 또는 type 필드 사용 (둘 다 없으면 'other' 기본값 사용)
      //           const categoryValue = menu.category || 'other';
      //           console.log(`메뉴 ${menu.name}의 카테고리: ${categoryValue}`);
                
      //           // 카테고리 색상으로 점 추가
      //           marked[dateString].dots.push({
      //             color: getColorForCategory(categoryValue),
      //             key: menu._id
      //           });

                
      //         });


      data.forEach((menu: MenuItem) => {
        // 1️⃣ menu.date가 존재하면 변환, 없으면 오늘 날짜 사용
        const dateString = menu.date 
          ? new Date(menu.date).toISOString().split('T')[0] 
          : today;
      
        // console.log(`✅ 메뉴: ${menu.name}, 변환된 날짜: ${dateString}`); // 디버깅용 로그
      
        // 2️⃣ 날짜별 데이터 저장
        if (!menuDateMap[dateString]) {
          menuDateMap[dateString] = [];
        }
        menuDateMap[dateString].push(menu);
      
        // 3️⃣ 마커 정보 업데이트
        if (!marked[dateString]) {
          marked[dateString] = {
            marked: true,
            dots: []
          };
        }
      
        // 4️⃣ 카테고리 색상 적용
        const categoryValue = menu.category || 'other';
        marked[dateString].dots.push({
          color: getColorForCategory(categoryValue),
          key: menu._id
        });
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


  // 메뉴 상세 페이지로 이동
  const handleMenuPress = (menu: MenuItem) => {
    // 상세 페이지로 메뉴 ID를 전달하여 이동
  router.push(`/MenuDetails?id=${menu._id}`)
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
             {/* 메뉴 추가 플로팅 버튼 */}
             <TouchableOpacity style={styles.addButton} onPress={handleAddMenu}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

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
      



        <View style={styles.menuListContainer}>
          <Text style={[styles.dateTitle, isDarkMode && styles.darkText]}>{formatDate(selectedDate)}</Text>
          {menusByDate[selectedDate] && menusByDate[selectedDate].length > 0 ? (
            menusByDate[selectedDate].map((menu, index) => (
              <TouchableOpacity
                 key={menu._id || index}
                 style={[styles.menuItem, isDarkMode && styles.darkMenuItem]}
                onPress={() => handleMenuPress(menu)}
              >
              
                <View style={[styles.categoryBar, {backgroundColor: getColorForCategory(menu.category)}]} />
                <View style={styles.menuContent}>
                <View style={styles.menuHeader}>
                  <Text style={[styles.menuTitle, isDarkMode && styles.darkText]}>{menu.name}</Text>
                  <Text style={[styles.menuCategory, isDarkMode && styles.darkSubText]}>{menu.category}</Text>
                  </View>
                  {menu.description && (
                    <Text style={[styles.menuDescription, isDarkMode && styles.darkText]}>{menu.description}</Text>
                  )}

        {menu.ingredients && menu.ingredients.length > 0 && (
                    <Text style={[styles.menuIngredients, isDarkMode && styles.darkSubText]}>
                      <Text style={[styles.ingredientsLabel, isDarkMode && styles.darkText]}>재료: </Text>
                      {menu.ingredients.join(', ')}
                    </Text>
                  )} 
                
                </View>
              </TouchableOpacity>
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
     position: 'relative'
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
    menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
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
    bottom: 100,
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

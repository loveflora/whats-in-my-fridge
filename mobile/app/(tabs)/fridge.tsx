import React, { useState, useEffect, useCallback, useRef} from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Animated,
  TextInput,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useAppContext } from '@/context/AppContext';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { GestureHandlerRootView, Swipeable, RectButton } from 'react-native-gesture-handler';
import DraggableFlatList from 'react-native-draggable-flatlist';
import DateTimePicker from '@react-native-community/datetimepicker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import Search from "@/components/fridge/Search"
import { useCategoryContext } from '@/context/CategoryContext';


// config/api.js에서 사용하는 URL을 여기서도 동일하게 사용하기 위해 API_BASE_URL 가져오기
import { API_ENDPOINTS } from '../../config/api';
import { API_URL } from '../../config/api';

interface Category {
  _id: string;
  name: string;
  color: string;
  icon: string;
  owner: string;
}

interface FridgeItem {
  _id: string;
  name: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  category: Category | string; // Updated to support both string and Category object
  favorite: boolean;
  completed: boolean;
}

interface ApiError {
  message: string;
}

export default function FridgeScreen() {
  const { settings } = useAppContext();
  const isDarkMode = settings.theme === 'dark';
  const navigation = useNavigation();

  const [items, setItems] = useState<FridgeItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Category state
  // const [categories, setCategories] = useState<Category[]>([]);
  // const [showCategoryModal, setShowCategoryModal] = useState(false);
  
  // const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const { 
    categories, 
    fetchCategories, 
    deleteCategory, 
    setEditingCategory 
  } = useCategoryContext();


    // item List 수정 상태 관리
    const [editingListId, setEditingListId] = useState<string | null>(null);
    const [editingListName, setEditingListName] = useState<string>('');
  
      // const [completed, setCompleted] = useState<{ [key: string]: boolean }>({});
  const [favorites, setFavorites] = useState<{ [key: string]: boolean }>({});
  const swipeableRefs = useRef<{ [key: string]: Swipeable | null }>({});
  const [currentList, setCurrentList] = useState<FridgeItem | null>(null);



  // // API URL 테스트 함수
  // const testApiConnection = async () => {
  //   for (const url of API_URLS) {
  //     try {
  //       console.log(`Testing connection to ${url}...`);
        
  //       // AbortController를 사용하여 타임아웃 구현
  //       const controller = new AbortController();
  //       const timeoutId = setTimeout(() => controller.abort(), 3000); // 3초 타임아웃
        
  //       const response = await fetch(`${url}/api/health`, {
  //         method: 'HEAD',
  //         signal: controller.signal
  //       });
        
  //       clearTimeout(timeoutId);
        
  //       if (response.ok) {
  //         API_URL = url;
  //         return true;
  //       }
  //     } catch (err) {
  //       console.log(`Connection to ${url} failed:`, err);
  //     }
  //   }
  //   return false;
  // };

  useFocusEffect(
    useCallback(() => {
      const initAndFetch = async () => {
      // testApiConnection();
      await   fetchItems();
          fetchCategories();
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

      // console.log("Fetching items from:", `${API_URL}/api/fridge/items`);
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

   //_ 빈 리스트 추가
   const handleAddList = async () => {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      router.replace('/auth/login');
      return;
    }
  
    try {
      const newList = { name: '', 
     quantity: 1, unit: "", expiryDate: new Date().toISOString().split('T')[0],    category: null }; // 빈 리스트 생성
  
      const response = await fetch(`${API_URL}/api/fridge/items`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newList),
      });
  
      if (!response.ok) {
        throw new Error('Failed to create list');
      }
  
      const createdList = await response.json();
  
    // 리스트 목록 업데이트 - 새로운 리스트를 맨 뒤에 추가
    setItems((prevLists) => [...prevLists, createdList]);
  
      // 자동으로 인라인 편집 모드로 전환
      setEditingListId(createdList._id);
      setEditingListName('');
    } catch (error) {
      console.error('Error creating list:', error);
      Alert.alert('Error', 'Failed to create list');
    }
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

    //_ Edit 시작
    const startInlineListEdit = (list: FridgeItem) => {
      setEditingListId(list._id);
      setEditingListName(list.name);
    };


    //_ Edit 완료
    const finishInlineListEdit = async () => {
      if (!editingListId || !editingListName.trim()) {
        setEditingListId(null);
        return;
      }

      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/fridge/items/${editingListId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ name: editingListName }),
        });

        if (!response.ok) {
          throw new Error('Failed to update list');
        }

        // 리스트 상태 업데이트
        const updatedLists = items.map(list => 
          list._id === editingListId ? { ...list, name: editingListName } : list
        );
        setItems(updatedLists);

        // 현재 선택된 리스트인 경우 currentList도 업데이트
        if (currentList && currentList._id === editingListId) {
          setCurrentList({ ...currentList, name: editingListName });
        }

        setEditingListId(null);
      } catch (error) {
        console.error('Error updating list:', error);
        Alert.alert('Error', 'Failed to update list');
        setEditingListId(null);
      }
    };


  //_ 즐겨찾기 토글 기능
  const toggleFavorite = async (id: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      const updatedFavorites = { ...favorites };
      updatedFavorites[id] = !updatedFavorites[id];
      setFavorites(updatedFavorites);   

      const response = await fetch(`${API_URL}/api/fridge/items/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          favorite: updatedFavorites[id]  // favorite 업데이트
        }),
      });

         // Swipe 닫기
         if (swipeableRefs.current[id]) {
          swipeableRefs.current[id].close();
        }


      if (!response.ok) {
        throw new Error('Failed to update favorite status');
      }

    } catch (error) {
      console.error('Error updating favorite status:', error);
      Alert.alert('Error', 'Failed to update favorite status');
    }
  };

   //_ 리스트 완료 상태 토글
   const toggleListCompleted = async (id: string, currentStatus: boolean) => {
    try {

      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }


  const response = await fetch(`${API_URL}/api/fridge/items/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      completed:  !currentStatus,
    }),
  });

  console.log(">>>>>>", response)
  console.log("!currentStatus>>>>>>", !currentStatus)

      if (!response.ok) {
        throw new Error('Failed to update list status');
      }


      // 로컬 상태 업데이트
      const updatedLists = items.map(list => 
        list._id === id ? { ...list, completed: !currentStatus } : list
      );
      setItems(updatedLists);

      // 현재 선택된 리스트인 경우 currentList도 업데이트
      if (currentList && currentList._id === id) {
        setCurrentList({ ...currentList, completed: !currentStatus });
      }
    } catch (error) {
      console.error('Error toggling list status:', error);
      Alert.alert('Error', 'Failed to update list status');
    }
  };

     // 아이템 상세 페이지로 이동
     const navigateToDetail = (item: FridgeItem) => {
      router.push(`/item-details?id=${item._id}`);
    };

  const renderRightActions =(item: FridgeItem) =>  (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>, id: string) => {
    const translateX = dragX.interpolate({
      inputRange: [-160, 0],
      outputRange: [0, 160],
      extrapolate: 'clamp',
    });

  // 상세 버튼 
  const detailButton = () => (
    <RectButton
      style={[styles.swipeButton, { backgroundColor: '#3478F6' }]}
      onPress={() => {
        swipeableRefs.current[item._id]?.close();
        navigateToDetail(item);
      }}
    >
      <Ionicons name="information-circle-outline" size={24} color="#fff" />
      <Text style={styles.swipeButtonText}>상세</Text>
    </RectButton>
  );

  // 즐겨찾기 버튼
  const favoriteButton = () => (
    <RectButton
      style={[styles.swipeButton, { backgroundColor: '#FFD60A'}]}
      onPress={() => {
        toggleFavorite(item._id);
      }}
    >
      <FontAwesome name={favorites[item._id] ? "star" : "star-o"} size={20} color="#fff" />
    </RectButton>
  );

  // 삭제 버튼
  const deleteButton = () => (
    <RectButton
      style={[styles.swipeButton, { backgroundColor: '#FF3B30'}]}
      onPress={() => {
        handleDeleteItem(item._id);
      }}
    >
      <Ionicons name="trash-outline" size={24} color="#fff" />
    </RectButton>
  );

  return ( 
    <View style={{ flexDirection: 'row', width: 120 }}>

{/* 상세 Swipe */}
<Animated.View style={[styles.rightAction, { 
    transform: [{ translateX: dragX.interpolate({
      inputRange: [-120, 0],
      outputRange: [0, 120], 
      extrapolate: 'clamp',
    }) }],
  }]}>
    {detailButton()}
  </Animated.View>

{/* 즐겨찾기 Swipe */}
  <Animated.View style={[styles.rightAction, { 
    transform: [{ translateX: dragX.interpolate({
      inputRange: [-120, 0],
      outputRange: [0, 120], 
      extrapolate: 'clamp',
    }) }],
  }]}>
    {favoriteButton()}
  </Animated.View>

{/* 삭제 Swipe */}
  <Animated.View style={[styles.rightAction, { 
    transform: [{ translateX: dragX.interpolate({
      inputRange: [-120, 0],
      outputRange: [0, 60], 
      extrapolate: 'clamp',
    }) }],
  }]}>
    {deleteButton()}
  </Animated.View>
  </View>


  );
};

    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [currentEditingItemId, setCurrentEditingItemId] = useState<string | null>(null);
    // const [expiryDate, setExpiryDate] = useState(item.expiryDate || new Date().toISOString().split('T')[0]);

    const handleConfirm = async (date) => {
      const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD 형식
      item.expiryDate = formattedDate; // item의 expiryDate 변경
      try {
                const token = await AsyncStorage.getItem('userToken');
                if (!token) {
                 router.replace('/auth/login');
                return;
              }
        
               // Update the expiry date in the backend
              const response = await fetch(`${API_URL}/api/fridge/items/${item._id}`, {
                  method: 'PUT',
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    expiryDate: formattedDate
                  }),
                });
        
                if (!response.ok) {
                  throw new Error('Failed to update expiry date');
                }
        
              // Update the local state
                const updatedItems = items.map(listItem => 
                  listItem._id === item._id 
                    ? { ...listItem, expiryDate: formattedDate } 
                    : listItem
                );
                setItems(updatedItems);
        
                // If this item is also in search results, update it there too
                if (isSearching && searchResults.length > 0) {
                  const updatedSearchResults = searchResults.map(searchItem => 
                    searchItem._id === item._id 
                      ? { ...searchItem, expiryDate: formattedDate } 
                    : searchItem
                );
                  setSearchResults(updatedSearchResults);
                }
              } catch (error) {
                console.error('Error updating expiry date:', error);
                Alert.alert('Error', 'Failed to update expiry date');
              }
        
        
            };
  
    const hideDatePicker = () => setDatePickerVisibility(false);

    const [showDatePicker, setShowDatePicker] = useState(false);


  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const onDateChange = (event: any, selectedDate: any) => {
    const currentDate = selectedDate || new Date();
    setShowDatePicker(false);
    // setEditFormData({...editFormData, expiryDate: currentDate.toISOString().split('T')[0]});
  };


  //++ 개별 List Rendering 
  const renderItem = ({ item, drag, isActive }: { item: FridgeItem, drag: any, isActive: boolean }) => {
    const daysUntilExpiry = getDaysUntilExpiry(item.expiryDate);
    const expiryColor = getExpiryColor(daysUntilExpiry);

    const showDatePicker = () => {
          setCurrentEditingItemId(item._id);
            setDatePickerVisibility(true);
          };

    // hideDatePicker();
    
    //; 수정 중
    if (editingListId === item._id ) {
      return (
        <View style={[
          styles.listItemEditContainer,
          isDarkMode && styles.darkListItem,
        ]}>

          {/* check box */}
          <TouchableOpacity
                      style={styles.listItemCheckbox}
                      onPress={() => toggleListCompleted(item._id, item.completed || false)}
                    >
                      <MaterialIcons
                        name={item.completed ? 'radio-button-checked' : 'radio-button-unchecked'}
                        size={24}
                        color={isDarkMode ? '#fff' : '#e2e2e2'}
                      />
                    </TouchableOpacity>
       <TextInput
                    style={[
                      styles.listItemEditInput,
                      isDarkMode && styles.darkText,
                    ]}
                    value={editingListName}
                    onChangeText={setEditingListName}
                    autoFocus
                    onBlur={finishInlineListEdit} // 포커스 해제 시 저장
                    onSubmitEditing={finishInlineListEdit}  // 엔터 키 입력 시 저장
                  />
        </View>
      );
    }

    //; 일반 항목
    return (
    
      <Swipeable
        ref={(ref) => { swipeableRefs.current[item._id] = ref; }}
        renderRightActions={renderRightActions(item)}
        friction={1}
        rightThreshold={1}
        overshootRight={false}
      >
     <TouchableOpacity
              style={[
                styles.listItem,
                // currentList && currentList._id === item._id && styles.activeListItem,
                isDarkMode && styles.darkListItem,
                currentList && currentList._id === item._id && isDarkMode && styles.darkActiveListItem,
              ]}
              onPress={() => startInlineListEdit(item)} // 터치 시 수정 모드로 전환
              onLongPress={drag} // 길게 누르면 드래그 시작
              delayLongPress={150} // 길게 누르는 시간 설정 (ms)
              activeOpacity={0.7}
              disabled={isActive} // 드래그 중일 때는 다른 터치 이벤트 비활성화
              >
                <View style={styles.listItemContent}>
                    <TouchableOpacity
                      style={styles.listItemCheckbox}
                      onPress={() => toggleListCompleted(item._id, item.completed || false)}
                    >
                    <MaterialIcons
                        name={item.completed ? 'radio-button-checked' : 'radio-button-unchecked'}
                        size={24}
                        color={isDarkMode ? '#fff' : '#e2e2e2'}
                      />
                    </TouchableOpacity>

            <View style={[styles.listItemTextContainer]}>

              {/* item name */}
              <Text
                style={[
                  styles.listItemText,
                        item.completed && styles.completedListText,
                  isDarkMode && styles.darkText,
                ]}
              >
                {item.name} 
                 </Text>  

<View style={[styles.infoContainer]}>
{/* quantity */}
<Text style={[
                  styles.quantityText,
                  item.completed && styles.completedListText,
                  isDarkMode && styles.darkText,
                ]}
              >
              X  {item.quantity}
              </Text>



{/* expiry date */}
  <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                <Text style={[styles.expiryText, item.completed && styles.completedListText, { color: expiryColor }]}>
            {daysUntilExpiry < 0
            ? 'Expired'
          : daysUntilExpiry === 0
            ? 'Expires today'
            : `Expires in ${daysUntilExpiry} days`}
         </Text>
         </TouchableOpacity>

         {showDatePicker && (
                <DateTimePicker
                  // value={editFormData.expiryDate ? new Date(editFormData.expiryDate) : new Date()}
                  value={new Date()}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                />
              )}


                 {/* favorites */}
                {favorites[item._id] && <FontAwesome name="star" size={20} color="#FFD60A" />}
            </View>
          </View>
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };




  //++ 전체 List Rendering
  const renderListSelector = () => {
    if (lists.length === 0) {
      return null;
    }

    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}> 

      <View style={styles.listSelectorContainer}>
      {/* 전체 List */}
        <DraggableFlatList
          data={lists}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          onDragEnd={({ data }) => {
            setLists(data); 
        }}
          // 리스트 아래 빈 화면 클릭하면 리스트 추가
          // ListFooterComponent={
          //   <TouchableOpacity onPress={handleAddList} activeOpacity={0.7}>
          //     <View style={styles.emptyContainer}>
          //     </View>
          //   </TouchableOpacity>
          // }
        />

      </View>
      </TouchableWithoutFeedback>

    );
  };



  // const renderItem = ({ item }: { item: FridgeItem }) => {
  //   if (!item || !item.expiryDate) {
  //     return null;
  //   }
    
    // const daysUntilExpiry = getDaysUntilExpiry(item.expiryDate);
    // const expiryColor = getExpiryColor(daysUntilExpiry);

 

  //   return (
  //     <TouchableOpacity
  //       style={[styles.itemContainer, isDarkMode && styles.darkItemContainer]}
  //       onPress={handleItemPress}
  //     >
  //       <View style={styles.itemInfo}>
  //         <Text style={[styles.itemName, isDarkMode && styles.darkText]}>{item.name}</Text>
  //         <Text style={[styles.itemDetails, isDarkMode && styles.darkItemDetails]}>
  //           {item.quantity} {item.unit} • {item.category}
  //         </Text>
  //         <Text style={[styles.expiryText, { color: expiryColor }]}>
  //           {daysUntilExpiry < 0
  //             ? 'Expired'
  //             : daysUntilExpiry === 0
  //             ? 'Expires today'
  //             : `Expires in ${daysUntilExpiry} days`}
  //         </Text>
  //       </View>
  //       <TouchableOpacity
  //         onPress={() => {
  //           Alert.alert(
  //             'Delete Item',
  //             'Are you sure you want to delete this item?',
  //             [
  //               { text: 'Cancel', style: 'cancel' },
  //               { text: 'Delete', onPress: () => handleDeleteItem(item._id), style: 'destructive' },
  //             ]
  //           );
  //         }}
  //       >
  //         <Ionicons name="trash-outline" size={24} color="#FF0000" />
  //       </TouchableOpacity>
  //     </TouchableOpacity>
  //   );
  // };



  const startEditCategory = (category: Category) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setNewCategoryColor(category.color);
    setNewCategoryIcon(category.icon);
    setShowCategoryModal(true);
  };

    // 카테고리 추가하기 화면으로 이동
  const navigateAddCategory = () => {
    router.push({
      pathname: '/modal/addCategory',
    });
  };

   // 삭제 로직도 context 사용
   const handleDeleteCategoryClick = async (categoryId: string) => {
    try {
      await deleteCategory(categoryId);
      Alert.alert('Success', 'Category deleted successfully');
    } catch (error) {
      // 에러는 context 내부에서 처리됨
    }
  };

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        { backgroundColor: item.color + '20' }, // 20% opacity version of the category color
        isDarkMode && styles.darkCategoryItem,
      ]}
      onPress={() => startEditCategory(item)}
    >
      <View style={styles.categoryIconContainer}>
        <Ionicons name={item.icon as any} size={24} color={item.color} />
      </View>
      <Text style={[styles.categoryName, isDarkMode && styles.darkText]}>
        {item.name}
      </Text>
      <TouchableOpacity
        style={styles.categoryDeleteButton}
        onPress={() => {
          Alert.alert(
            'Delete Category',
            `Are you sure you want to delete "${item.name}"?`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => handleDeleteCategoryClick(item._id) },
            ]
          );
        }}
      >
        <Ionicons name="trash-outline" size={20} color={isDarkMode ? '#fff' : '#FF3B30'} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

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
     
     
{/* 검색창 */}
<Search isDarkMode={isDarkMode} />
    
      {/* <View style={[styles.header, isDarkMode && styles.darkHeader]}>
        <Text style={[styles.title, isDarkMode && styles.darkText]}>Category</Text>
       
        <TouchableOpacity
          style={styles.addListButton}
          onPress={() => {
            router.push('/modal/addItem');
          }}
          >
          <Text style={[styles.itemTitle, isDarkMode && styles.darkText]}>물품</Text>
          <Ionicons name="add-circle" size={24} color={isDarkMode ? '#fff' : '#3478F6'} />
        </TouchableOpacity>
      </View> */}

      <View style={styles.categoryListContainer}>
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.categoryList}
          numColumns={2}
          columnWrapperStyle={styles.categoryRow} 
        />
      </View>

{/* 새 카테고리 추가 버튼 */}
      <TouchableOpacity
        style={styles.addCategoryButton}
        onPress={navigateAddCategory}
        >
        <Ionicons name="add-circle" size={24} color="#888" />
      <Text  style={styles.addCategoryText}>New Category</Text>
      </TouchableOpacity>


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
        <TouchableOpacity onPress={handleAddList} activeOpacity={0.7} style={styles.emptyContainer}>
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
           Click here to create your first list
          </Text>
        </TouchableOpacity>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  itemTitle :{
    fontSize: 18,
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
    flexDirection: "row",
    alignItems: "center",
    gap: 4
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
  categoryListContainer: {
    // padding: 16,
    // backgroundColor: '#f5f5f5',
    // borderTopWidth: 1,
    // borderTopColor: '#f0f0f0',
//  justifyContent: 'space-between',
// width: "100%" 
},
  categoryList: {
  paddingVertical: 4,
    paddingHorizontal: 16,
  },
  categoryRow: {
    justifyContent: 'space-between',
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 10,
    width: 180
  },
  darkCategoryItem: {
    backgroundColor: '#2c2c2c',
  },
  categoryIconContainer: {
    // width: 40,
    // height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryName: {
    fontSize: 16,
    // fontWeight: 'bold',
    color: '#333',
  },
  categoryDeleteButton: {
    padding: 8,
  },
  addCategoryButton: {
    alignItems: 'center',
    flexDirection: "row",
    gap: 10,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 4 },
    // shadowOpacity: 0.5,
    // shadowRadius: 8,
    // elevation: 10,
    marginHorizontal: 20,
  },
  addCategoryText: {
    color: "#888", 
    fontSize: 16,
    fontWeight: 'bold',
  },


  //; 수정
  listItemEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    // marginVertical: 4,
    // marginHorizontal: 9,
    borderRadius: 8,
  },
  listItemEditInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    paddingTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 14,
    borderBottomColor: '#f0f0f0',
    borderBottomWidth: 1,
  },


  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // flex: 1,
    gap: 10,
  },
  quantityText: {
  fontSize: 14,
  color: "#565656",
  },
  listItemCheckbox: {
    marginRight: 8,
  },
  completedListText: {
    textDecorationLine: 'line-through',
    color: '#888',
  },

   listSelectorContainer: {
    flex: 1,
  },
  listSelectorContent: {
    paddingVertical: 5,
    borderRadius: 10,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    marginLeft: 10,
  },
  darkListItem: {
    backgroundColor: '#2c2c2e',
  },
  darkActiveListItem: {
    backgroundColor: '#32325D',
  },
// name, star
  listItemTextContainer: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    width: '90%',
    borderBottomColor: '#f0f0f0',
    borderBottomWidth: 1,
    paddingRight: 10,
  },
  // name
  listItemText: {
    fontSize: 16,
    color: '#000',
    paddingTop: 14,
    paddingHorizontal: 6,
    paddingVertical: 14,
  },

  swipeButton: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    height: "100%",
    zIndex: 1
  },
  swipeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    // marginTop: 4,
  },
  // favoriteItemText: {
  //   fontWeight: 'bold',
  // },

  leftAction: {
    backgroundColor: '#4CAF50', // 녹색 (수정 버튼)
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderRadius: 10,
  },
  rightAction: {
    justifyContent: 'center',
    alignItems: 'center',
    // marginVertical: 10
    zIndex: 1
  },
  listItemActions: {
    flexDirection: 'row',
  },
  listItemAction: {
    padding: 5,
    marginLeft: 10,
  },
  currentListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
  },
  currentListTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  listActions: {
    flexDirection: 'row',
  },
  listAction: {
    padding: 8,
    marginLeft: 8,
  },
});

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import {
  StyleSheet,
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Animated, 
  TextInput
} from 'react-native';
import { API_URL } from "@/config/api"
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { GestureHandlerRootView, Swipeable, RectButton } from 'react-native-gesture-handler';
import { useAppContext } from '@/context/AppContext';
import { Category, FridgeItem } from '@/types/Fridge';
import { CustomHeader } from '@/components/CustomHeader';
import { useCategoryContext } from '@/context/CategoryContext';
import { Calendar } from 'react-native-calendars';

export default function CategoryDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = params.id as string;
  const { settings } = useAppContext();
  const isDarkMode = settings.theme === 'dark';

  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Category>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [categoryItems, setCategoryItems] = useState([]);
  const [fetchingItems, setFetchingItems] = useState(false);

  const [favorites, setFavorites] = useState<{ [key: string]: boolean }>({});
  const swipeableRefs = useRef<{ [key: string]: Swipeable | null }>({});
  const [currentList, setCurrentList] = useState<FridgeItem | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  
      // item List 수정 상태 관리
      const [editingListId, setEditingListId] = useState<string | null>(null);
      const [editingListName, setEditingListName] = useState<string>('');

  const { 
    addCategory, 
    updateCategory, 
    editingCategory, 
    setEditingCategory,
    selectedColor,
    selectedIcon,
    deleteCategory 
  } = useCategoryContext();

  useFocusEffect(
    useCallback(() => {
      console.log('카테고리 상세 화면 포커스 - 데이터 다시 불러오기');
      fetchCategoryDetails();
      fetchCategoryItems();
      return () => {
        // 화면에서 벗어날 때 정리 작업이 필요하다면 여기에 구현
      };
    }, [id])
  );

  const fetchCategoryDetails = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      // console.log(`카테고리 상세 정보 가져오기: ID=${id}`);
      const response = await fetch(`${API_URL}/api/categories/${id}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API 오류 응답:', errorText);
        throw new Error('Failed to fetch category details');
      }

      const data = await response.json();
      console.log('카테고리 상세 정보:', data);
      setCategory(data);
    } catch (error) {
      console.error('Error fetching category details:', error);
      Alert.alert('Error', 'Failed to load category details');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryItems = async () => {
    try {
      setFetchingItems(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      // Use the new API endpoint for retrieving items by category
      const response = await fetch(`${API_URL}/api/categories/${id}/items`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API 오류 응답:', errorText);
        throw new Error('Failed to fetch category items');
      }

      const data = await response.json();
      console.log('카테고리 아이템:', data);
      setCategoryItems(data);
    } catch (error) {
      console.error('Error fetching category items:', error);
      Alert.alert('Error', 'Failed to load category items');
    } finally {
      setFetchingItems(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '날짜 없음';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysUntilExpiry = (expiryDate) => {
    if (!expiryDate) return -1;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const getExpiryColor = (daysRemaining) => {
    if (daysRemaining < 0) return '#FF3B30'; // 빨간색 (유통기한 지남)
    if (daysRemaining <= 3) return '#FF9500'; // 주황색 (3일 이내)
    return '#34C759'; // 초록색 (안전)
  };

  const getExpiryText = (daysRemaining) => {
    if (daysRemaining < 0) return `${Math.abs(daysRemaining)}일 지남`;
    if (daysRemaining === 0) return '오늘 만료';
    return `${daysRemaining}일 남음`;
  };

  const handleDeleteCategoryClick = async (categoryId: string) => {
    try {
      await deleteCategory(categoryId);
      router.back();
    } catch (error) {
      // 에러는 context 내부에서 처리됨
    }
  };

  const handleEditCategory = () => {
    router.push({
      pathname: '/modal/addCategory',
      params: { 
        isEdited: "true",
        categoryId: category._id,
        categoryName: category.name,
        categoryColor: category.color,
        categoryIcon: category.icon
      }, 
    });
  };

  const handleDeleteCategory = () => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category?.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => handleDeleteCategoryClick(category._id) },
      ]
    );
  };

  // 항목 삭제
  const handleDeleteItem = (itemId) => {
    Alert.alert(
      '아이템 삭제',
      '정말 이 아이템을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '삭제', 
          style: 'destructive', 
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('userToken');
              if (!token) return;
              
              const response = await fetch(`${API_URL}/api/fridge/items/${itemId}`, {
                method: 'DELETE',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });
              
              if (response.ok) {
                // 성공적으로 삭제되면 목록에서 제거
                setCategoryItems(categoryItems.filter(item => item._id !== itemId));
                Alert.alert('성공', '아이템이 삭제되었습니다.');
              } else {
                Alert.alert('오류', '아이템 삭제에 실패했습니다.');
              }
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('오류', '아이템 삭제 중 오류가 발생했습니다.');
            }
          } 
        },
      ]
    );
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
      const updatedLists = categoryItems.map(list => 
        list._id === editingListId ? { ...list, name: editingListName } : list
      );
      setCategoryItems(updatedLists);

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


      if (!response.ok) {
        throw new Error('Failed to update list status');
      }


      // 로컬 상태 업데이트
      const updatedLists = categoryItems.map(list => 
        list._id === id ? { ...list, completed: !currentStatus } : list
      );
      setCategoryItems(updatedLists);

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
      // screens 폴더의 ItemDetails로 이동
      // router.push()는 파일 기반 라우팅 경로로 이동하는데 사용
      router.push({
        pathname: "/ItemDetails",
        params: { id: item._id }
      });
    };


  const { height } = Dimensions.get('window');
  //_ lists의 길이에 따라 footerHeight 동적 계산
  const getFooterHeight = () => {
    // 리스트가 비어있거나 적을 때는 더 큰 공간을, 많을 때는 작은 공간을
    const minFooterHeight = 100; // 최소 높이
    const maxFooterHeight = height * 0.6; // 최대 높이 (화면의 60%)
    
    if (!categoryItems || categoryItems.length === 0) {
      return maxFooterHeight;
    }
    
    // 리스트 개수에 반비례하여 높이 계산
    const calculatedHeight = maxFooterHeight - (categoryItems.length * 20);
    return Math.max(calculatedHeight, minFooterHeight);
  };



  const renderRightActions =(item: FridgeItem) =>  (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>, id: string) => {
    const translateX = dragX.interpolate({
      inputRange: [-240, 0],  
      outputRange: [0, 240],  
      extrapolate: 'clamp',
    });

    const calendarButton = () => (
      <RectButton
        style={[styles.swipeButton, { backgroundColor: '#34C759' }]}  
        onPress={() => {
          swipeableRefs.current[item._id]?.close();
          setSelectedItemId(item._id);
          setShowDatePicker(true);
        }}
      >
        <Ionicons name="calendar-outline" size={24} color="#fff" />
      </RectButton>
    );

    const detailButton = () => (
      <RectButton
        style={[styles.swipeButton, { backgroundColor: '#3478F6' }]}
        onPress={() => {
          swipeableRefs.current[item._id]?.close();
          navigateToDetail(item);
        }}
      >
        <Ionicons name="create" size={24} color="#fff" />
      </RectButton>
    );

    const favoriteButton = () => (
      <RectButton
        style={[styles.swipeButton, { backgroundColor: '#FFD60A' }]}
        onPress={() => {
          toggleFavorite(item._id);
        }}
      >
        <FontAwesome name={favorites[item._id] ? "star" : "star-o"} size={20} color="#fff" />
      </RectButton>
    );

    const deleteButton = () => (
      <RectButton
        style={[styles.swipeButton, { backgroundColor: '#FF3B30' }]}
        onPress={() => {
          handleDeleteItem(item._id);
        }}
      >
        <Ionicons name="trash-outline" size={24} color="#fff" />
      </RectButton>
    );

    return (
      <Animated.View style={{ flexDirection: 'row', transform: [{ translateX }] }}>
        {calendarButton()}
        {detailButton()}
        {favoriteButton()}
        {deleteButton()}
      </Animated.View>
    );
  };

   //_ 빈 리스트 추가
   const handleAddList = async () => {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      router.replace('/auth/login');
      return;
    }


    try {
       // 빈 리스트 생성
      const newList = { name: '', 
     quantity: 1, 
     unit: "", 
     expiryDate: new Date().toISOString().split('T')[0], 
     category: category?._id,
    };
  
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
    setCategoryItems((prevLists) => [...prevLists, createdList]);
  
      // 자동으로 인라인 편집 모드로 전환
      setEditingListId(createdList._id);
      setEditingListName('');
    } catch (error) {
      console.error('Error creating list:', error);
      Alert.alert('Error', 'Failed to create list');
    }
  };




  //++ 개별 List Rendering 
  const renderItem = ({ item, drag, isActive }: { item: FridgeItem, drag: any, isActive: boolean }) => {
    const daysUntilExpiry = getDaysUntilExpiry(item.expiryDate);
    const expiryColor = getExpiryColor(daysUntilExpiry);

    const showDatePicker = () => {
          setSelectedItemId(item._id);
            setShowDatePicker(true);
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
    <>
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
                numberOfLines={1}
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
  <TouchableOpacity onPress={() => showDatePicker()}>
                <Text style={[styles.expiryText, item.completed && styles.completedListText, { color: expiryColor }]}>
            {daysUntilExpiry < 0
            ? 'Expired'
          : daysUntilExpiry === 0
            ? 'today'
            : `${daysUntilExpiry} days`}
         </Text>
         </TouchableOpacity>

         {/* {showDatePicker && (
                <DateTimePicker
                  // value={editFormData.expiryDate ? new Date(editFormData.expiryDate) : new Date()}
                  value={new Date()}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                />
              )} */}


                 {/* favorites */}
                {favorites[item._id] && <FontAwesome name="star" size={20} color="#FFD60A" />}
            </View>
          </View>
          </View>
        </TouchableOpacity>
      </Swipeable>
      
      <Modal
  visible={showDatePicker}
  transparent={true}
  animationType="slide"
>
  <View style={{flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)'}}>
    <View style={{backgroundColor: 'white', margin: 20, padding: 20, borderRadius: 10}}>
      <Calendar
        onDayPress={day => {
          saveExpiryDate(new Date(day.timestamp));
        }}
        markedDates={{
          [selectedItemId && items.find(i => i._id === selectedItemId)?.expiryDate 
            ? formatDate(new Date(items.find(i => i._id === selectedItemId)!.expiryDate!)) 
            : formatDate(new Date())]: {selected: true}
        }}
      />
      <TouchableOpacity 
        style={{marginTop: 10, alignSelf: 'center'}} 
        onPress={() => {
          setShowDatePicker(false);
          setSelectedItemId(null);
        }}
      >
        <Text style={{color: 'blue', fontSize: 16}}>취소</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
      
      
      </>
    );
  };

  //++ 전체 목록 렌더링
  const renderListSelector = () => {
    if (categoryItems.length === 0) {
      return (
        <TouchableOpacity onPress={handleAddList} activeOpacity={0.7} style={styles.emptyContainer}>
          <Ionicons name="duplicate" size={50} color={isDarkMode ? '#555' : '#999'} />
          <Text style={[styles.emptyText, isDarkMode && styles.darkText]}>
            이 카테고리에 속한 아이템이 없습니다.
            </Text>
            <Text style={[styles.emptyText, isDarkMode && styles.darkText]}>
              아이템을 추가하려면 클릭하세요.
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}> 
      <View style={styles.listSelectorContainer}>
      {/* 전체 List */}
        <DraggableFlatList
          data={categoryItems}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          onDragEnd={({ data }) => {
            setCategoryItems(data); 
        }}
         // 리스트 아래 빈 화면 클릭하면 리스트 추가
         ListFooterComponent={
          <TouchableOpacity onPress={handleAddList} activeOpacity={0.7} >
             <View style={[
            styles.footerEmptyContainer,
            { height: getFooterHeight() }
          ]}>
            </View>
          </TouchableOpacity>
        }
      />
      </View>
      </TouchableWithoutFeedback>

    );
      // <View style={styles.listSelectorContainer}>
      //   <FlatList
      //     data={categoryItems}
      //     keyExtractor={(item) => item._id}
      //     renderItem={({ item }) => (
      //       <TouchableOpacity 
      //         style={[styles.itemCard, isDarkMode && styles.darkItemCard]}
      //         onPress={() => router.push(`/itemDetails?id=${item._id}`)}
      //       >
      //         <View style={styles.itemContent}>
      //           <Text style={[styles.itemName, isDarkMode && styles.darkText]} numberOfLines={1}>
      //             {item.name}
      //           </Text>
      //           <View style={styles.itemDetails}>
      //             <Text style={[styles.itemInfo, isDarkMode && styles.darkText]}>
      //               {item.quantity} {item.unit}
      //             </Text>
      //             <Text style={[
      //               styles.expiryDate, 
      //               {
      //                 color: getExpiryColor(getDaysUntilExpiry(item.expiryDate))
      //               }
      //             ]}>
      //               {getExpiryText(getDaysUntilExpiry(item.expiryDate))}
      //             </Text>
      //           </View>
      //         </View>
      //         <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#666' : '#999'} />
      //       </TouchableOpacity>
      //     )}
      //     contentContainerStyle={styles.itemsContainer}
      //   />
      // </View>
    // );
  };

  return (
    <View style={[styles.container, isDarkMode && styles.darkContainer]}>
      <CustomHeader />

      <ScrollView style={styles.scrollView}>
        {/* HEADER */}
        <View style={[styles.header, { backgroundColor: "#fff" }]}>
          {/* 뒤로 가기 */}
          <TouchableOpacity
            style={styles.backIcon}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={"#333"} />
          </TouchableOpacity>

          {/* icon & category name */}
          <View style={styles.categoryIconContainer}>
            {/* 아이콘 배경 */}
            {/* <View style={[styles.iconBackground, { backgroundColor: category?.color || "#ccc" }]}>
              <Ionicons name={category?.icon as any} size={24} color={"#fff"} />
            </View> */}
            <Text style={[styles.title, { color: category?.color }, isDarkMode && styles.darkText]} numberOfLines={1}>{category?.name}</Text>
          </View>
          <View style={styles.headerButtons}>

            <TouchableOpacity style={styles.headerButton} onPress={handleEditCategory}>
              <Ionicons name="create-outline" size={24} color={isDarkMode ? '#000' : '#333'} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={handleDeleteCategory}>
              <Ionicons name="trash-outline" size={24} color={isDarkMode ? '#333' : '#333'} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>

          {fetchingItems ? (
            <ActivityIndicator size="large" color="#3478F6" style={{ marginTop: 20 }} />
          ) : (
            renderListSelector()
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  darkContainer: {
    backgroundColor: '#333',
  },
  scrollView: {
    flex: 1,
    // backgroundColor: "red",
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backIcon: {
    marginRight: 16,
  },
  categoryIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBackground: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  darkText: {
    color: '#fff',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 16,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#000',
  },
  listSelectorContainer: {
    flex: 1,
    marginTop: 10,
  },
  itemCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  darkItemCard: {
    backgroundColor: '#333',
    borderBottomColor: '#444',
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#000',
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemInfo: {
    fontSize: 14,
    color: '#666',
  },
  expiryDate: {
    fontSize: 14,
    fontWeight: '500',
  },
  itemsContainer: {
    paddingVertical: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    // backgroundColor: "yellow",
  },
   listSelectorContainer: {
    flex: 1,
  },
  footerEmptyContainer:{
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
    overflow: 'hidden',
  
    width: '70%',

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
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Animated,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions
} from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppContext } from '@/context/AppContext';
import { GestureHandlerRootView, Swipeable, RectButton } from 'react-native-gesture-handler';
import DraggableFlatList from 'react-native-draggable-flatlist';

import { API_URL } from "@/config/api"

interface ShoppingItem {
  _id: string;
  name: string;
  completed: boolean;
  listId: string;
  createdAt: string;
  favorite?: boolean;
}

interface ShoppingList {
  _id: string;
  name: string;
  createdAt: string;
  completed: boolean;
}

export default function ShoppingListScreen() {
  const { settings } = useAppContext();
  const isDarkMode = settings.theme === 'dark';

  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [currentList, setCurrentList] = useState<ShoppingList | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 쇼핑 리스트 수정 상태 관리
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingListName, setEditingListName] = useState<string>('');

  // const [completed, setCompleted] = useState<{ [key: string]: boolean }>({});
  const [favorites, setFavorites] = useState<{ [key: string]: boolean }>({});
  const swipeableRefs = useRef<{ [key: string]: Swipeable | null }>({});

  useFocusEffect(
    useCallback(() => {
      fetchLists();
    }, [])
  );

  const fetchLists = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      const response = await fetch(`${API_URL}/api/shopping/items`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // console.log(response);

      if (!response.ok) {
        throw new Error('Failed to fetch shopping items');
      }

      const data = await response.json();
      setLists(data);

      // Select the first items if available and no items is currently selected
      if (data.length > 0 && !currentList) {
        setCurrentList(data[0]);
        fetchItem(data[0]._id);
      } else if (currentList) {
        // If we have a current items, refresh its items
        fetchItem(currentList._id);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching shopping items:', error);
      Alert.alert('Error', 'Failed to load shopping items');
      setLoading(false);
    }
  };

  const fetchItem = async (listId: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      const response = await fetch(`${API_URL}/api/shopping/items?listId=${listId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch shopping item');
      }

      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error('Error fetching shopping item:', error);
      Alert.alert('Error', 'Failed to load shopping item');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    if (currentList) {
      fetchItem(currentList._id);
    } else {
      fetchLists();
    }
  };

  // const toggleItemStatus = async (id: string, completed: boolean) => {
  //   try {
  //     const token = await AsyncStorage.getItem('userToken');
  //     if (!token) {
  //       router.replace('/auth/login');
  //       return;
  //     }

  //     const response = await fetch(`${API_URL}/api/shopping/items/${id}`, {
  //       method: 'PUT',
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         completed: !completed,
  //       }),
  //     });

  //     if (!response.ok) {
  //       throw new Error('Failed to update item status');
  //     }

  //     // Update local state
  //     setItems(
  //       items.map((item) =>
  //         item._id === id ? { ...item, completed: !completed } : item
  //       )
  //     );
  //   } catch (error) {
  //     console.error('Error updating item status:', error);
  //     Alert.alert('Error', 'Failed to update item status');
  //   }
  // };

  const handleDeleteList = async (id: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      const response = await fetch(`${API_URL}/api/shopping/items/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete list');
      }

      // Update local state
      const updatedLists = lists.filter((list) => list._id !== id);
      setLists(updatedLists);

      // If the current list was deleted, select the first available list
      if (currentList && currentList._id === id) {
        if (updatedLists.length > 0) {
          setCurrentList(updatedLists[0]);
          fetchItem(updatedLists[0]._id);
        } else {
          setCurrentList(null);
          setItems([]);
        }
      }
    } catch (error) {
      console.error('Error deleting list:', error);
      Alert.alert('Error', 'Failed to delete list');
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

    // // 기존 아이템을 찾기
    // const currentItem = lists.find((item) => item._id === id);
    
    // if (!currentItem) {
    //   throw new Error('Item not found in local state');
    //   }
    // console.log("currentItem>>>>>>", currentItem)      

      const response = await fetch(`${API_URL}/api/shopping/items/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // name: currentItem.name,         // 기존 name 유지
          // completed: currentItem.completed, // 기존 completed 유지
          favorite: updatedFavorites[id]  // favorite 업데이트
        }),
      });

         // Swipeable을 닫기
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

  const navigateToDetail = (item: ShoppingItem) => {
    router.push(`/shopping-detail/${item._id}`);
  };


    const renderRightActions =(item: ShoppingItem) =>  (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>, id: string) => {
      const translateX = dragX.interpolate({
        inputRange: [-160, 0],
        outputRange: [0, 160],
        extrapolate: 'clamp',
      });

    //? [보류] 상세 버튼 
    // const detailButton = () => (
    //   <RectButton
    //     style={[styles.swipeButton, { backgroundColor: '#3478F6' }]}
    //     onPress={() => {
    //       swipeableRefs.current[item._id]?.close();
    //       navigateToDetail(item);
    //     }}
    //   >
    //     <Ionicons name="information-circle-outline" size={24} color="#fff" />
    //     <Text style={styles.swipeButtonText}>상세</Text>
    //   </RectButton>
    // );

    // 즐겨찾기 버튼
    const favoriteButton = () => (
      <RectButton
        style={[styles.swipeButton, { backgroundColor: '#FFD60A'}]}
        onPress={() => {
          // swipeableRefs.current[item._id]?.close();
          toggleFavorite(item._id);
        }}
      >
        <FontAwesome name={favorites[item._id] ? "star" : "star-o"} size={20} color="#fff" />
        {/* <Text style={styles.swipeButtonText}>즐겨찾기</Text> */}
      </RectButton>
    );

    // 삭제 버튼
    const deleteButton = () => (
      <RectButton
        style={[styles.swipeButton, { backgroundColor: '#FF3B30'}]}
        onPress={() => {
          // swipeableRefs.current[item._id]?.close();
          handleDeleteList(item._id);
        }}
      >
        <Ionicons name="trash-outline" size={24} color="#fff" />
        {/* <Text style={styles.swipeButtonText}>삭제</Text> */}
      </RectButton>
    );

    return ( 
      <View style={{ flexDirection: 'row', width: 120 }}>
    <Animated.View style={[styles.rightAction, { 
      transform: [{ translateX: dragX.interpolate({
        inputRange: [-120, 0],
        outputRange: [0, 120], 
        extrapolate: 'clamp',
      }) }],
    }]}>
      {favoriteButton()}
    </Animated.View>


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

  //_ 빈 리스트 추가
  const handleAddList = async () => {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      router.replace('/auth/login');
      return;
    }
    try {
      const newList = { name: '', 
        "completed": false,
       "favorite": false }; // 빈 리스트 생성
  
      const response = await fetch(`${API_URL}/api/shopping/items`, {
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
    setLists((prevLists) => [...prevLists, createdList]);
  
      // 자동으로 인라인 편집 모드로 전환
      setEditingListId(createdList._id);
      setEditingListName('');
    } catch (error) {
      console.error('Error creating list:', error);
      Alert.alert('Error', 'Failed to create list');
    }
  };



    //_ Edit 시작
    const startInlineListEdit = (list: ShoppingList) => {
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
        const response = await fetch(`${API_URL}/api/shopping/items/${editingListId}`, {
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
        const updatedLists = lists.map(list => 
          list._id === editingListId ? { ...list, name: editingListName } : list
        );
        setLists(updatedLists);

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


    //_ 리스트 완료 상태 토글
    const toggleListCompleted = async (id: string, currentStatus: boolean) => {
      try {

        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
          router.replace('/auth/login');
          return;
        }


    const response = await fetch(`${API_URL}/api/shopping/items/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // name: currentItem.name,         // 기존 name 유지
        completed:  !currentStatus, // 기존 completed 유지
        // favorite: updatedFavorites[id]  // favorite 업데이트
      }),
    });

        if (!response.ok) {
          throw new Error('Failed to update list status');
        }


        // 로컬 상태 업데이트
        const updatedLists = lists.map(list => 
          list._id === id ? { ...list, completed: !currentStatus } : list
        );
        setLists(updatedLists);

        // 현재 선택된 리스트인 경우 currentList도 업데이트
        if (currentList && currentList._id === id) {
          setCurrentList({ ...currentList, completed: !currentStatus });
        }
      } catch (error) {
        console.error('Error toggling list status:', error);
        Alert.alert('Error', 'Failed to update list status');
      }
    };


    const dragX = useRef(new Animated.Value(0)).current; // 스와이프 상태를 추적하는 값

    const { height } = Dimensions.get('window');

  //_ lists의 길이에 따라 footerHeight 동적 계산
  const getFooterHeight = () => {
    // 리스트가 비어있거나 적을 때는 더 큰 공간을, 많을 때는 작은 공간을
    const minFooterHeight = 100; // 최소 높이
    const maxFooterHeight = height * 0.6; // 최대 높이 (화면의 60%)
    
    if (!lists || lists.length === 0) {
      return maxFooterHeight;
    }
    
    // 리스트 개수에 반비례하여 높이 계산
    const calculatedHeight = maxFooterHeight - (lists.length * 20);
    return Math.max(calculatedHeight, minFooterHeight);
  };

  //++ 개별 List Rendering 
  const renderItem = ({ item, drag, isActive }: { item: ShoppingItem, drag: any, isActive: boolean }) => {
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

                    {/* <Animated.View
        style={{
          transform: [
            {
              translateX: dragX.interpolate({
                inputRange: [-240, 0],
                outputRange: [0, 180],  // 스와이프 범위에 맞게 텍스트 인풋의 위치를 이동시킴
                extrapolate: 'clamp',   // 스와이프 범위 벗어나는 부분을 클램프
              }),
            },
          ],
        }}
      > */}
      {/* text input */}
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
                    {/* </Animated.View> */}
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
              <Text
                style={[
                  styles.listItemText,
                  // currentList && currentList._id === item._id && styles.activeListItemText,
                        item.completed && styles.completedListText,
                  isDarkMode && styles.darkText,
                ]}
              >
                {item.name} 
                 </Text>  
                {favorites[item._id] && <FontAwesome name="star" size={20} color="#FFD60A" />}
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
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3478F6" />
        <Text
          style={[
            styles.loadingText,
            isDarkMode && styles.darkText,
          ]}
        >
          Loading shopping lists...
        </Text>
      </View>
    );
  }


  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, isDarkMode && styles.darkContainer]}>
        <View style={styles.header}>
          <Text
            style={[
              styles.title,
              isDarkMode && styles.darkText,
            ]}
          >
            Shopping Lists
          </Text>
         
         {/* 헤더 옆 추가 버튼 */}
          <TouchableOpacity
            style={styles.addListButton}
            onPress={handleAddList}
          >
            <Ionicons name="add-circle" size={24} color={isDarkMode ? '#fff' : '#3478F6'} />
          </TouchableOpacity>
        </View>

        {lists.length > 0 ? (
          <>
    {renderListSelector()}
 
  </>
          ) : (
          <TouchableOpacity onPress={handleAddList} activeOpacity={0.7} style={styles.emptyContainer}>
            <Ionicons name="list-outline" size={64} color={isDarkMode ? '#555' : '#ccc'} />
            <Text
              style={[
                styles.emptyText,
                isDarkMode && styles.darkText,
              ]}
            >
              No shopping lists
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
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  darkText: {
    color: '#fff',
  },
  addListButton: {
    padding: 8,
  },
  listSelectorContainer: {
    flex: 1,
  },
  // list 있을 시, 아래 빈 공간
  footerEmptyContainer : {
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
  // swipeButtonText: {
  //   color: '#FFFFFF',
  //   fontSize: 12,
  //   // marginTop: 4,
  // },
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  darkItemContainer: {
    backgroundColor: '#2c2c2c',
  },
  checkboxContainer: {
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  completedItemText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  darkPurchasedText: {
    color: '#888',
  },
  itemDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  editButton: {
    padding: 8,
    marginRight: 8,
  },
  deleteButton: {
    padding: 8,
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
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  fabContainer: {
    position: 'absolute',
    right: 24,
    bottom: 24,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3478F6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  // modalOverlay: {
  //   flex: 1,
  //   backgroundColor: 'rgba(0, 0, 0, 0.5)',
  //   justifyContent: 'center',
  //   alignItems: 'center',
  // },
  // modalContent: {
  //   backgroundColor: '#fff',
  //   borderRadius: 12,
  //   padding: 16,
  //   width: '85%',
  //   shadowColor: '#000',
  //   shadowOffset: { width: 0, height: 2 },
  //   shadowOpacity: 0.3,
  //   shadowRadius: 4,
  //   elevation: 5,
  // },
  // darkModalContent: {
  //   backgroundColor: '#2c2c2c',
  // },
  // modalHeader: {
  //   flexDirection: 'row',
  //   justifyContent: 'space-between',
  //   alignItems: 'center',
  //   marginBottom: 16,
  // },
  // modalTitle: {
  //   fontSize: 18,
  //   fontWeight: 'bold',
  //   color: '#333',
  // },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color: '#333',
  },
  darkTextInput: {
    backgroundColor: '#3c3c3c',
    color: '#fff',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  flex1: {
    flex: 1,
  },

  saveButton: {
    backgroundColor: '#3478F6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
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
  listItemCheckbox: {
    marginRight: 8,
  },
  completedListText: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
});

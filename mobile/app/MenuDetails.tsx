import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  FlatList,
  Image
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '@/context/AppContext';
import DateTimePicker from '@react-native-community/datetimepicker';

import { API_URL } from "@/config/api"


interface Member {
  _id: string;
  name: string;
  email: string;
  isOwner: boolean;
}

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
  cook?: string; // 요리사 ID
  cookName?: string; // 요리사 이름
}

export default function MenuDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { settings } = useAppContext();
  const isDarkMode = settings.theme === 'dark';

  const [menu, setMenu] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editedMenu, setEditedMenu] = useState<Partial<MenuItem>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [cookSelectorVisible, setCookSelectorVisible] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    fetchMenuDetails();
    fetchUserGroup();
  }, [id]);

  // 현재 사용자의 그룹 정보 가져오기
  const fetchUserGroup = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      const response = await fetch(`${API_URL}/api/auth/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user info');
      }

      const userData = await response.json();
      
      if (userData.currentGroup) {
        setCurrentGroup({
          id: userData.currentGroup._id,
          name: userData.currentGroup.name
        });
        fetchGroupMembers(userData.currentGroup._id);
      }
    } catch (error) {
      console.error('Error fetching user groups:', error);
    }
  };

  // 그룹 멤버 목록 가져오기
  const fetchGroupMembers = async (groupId: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;
      
      const response = await fetch(`${API_URL}/api/groups/${groupId}/members`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error("멤버 API 오류, 상태코드:", response.status);
        return;
      }
      
      const data = await response.json();
      if (data && data.members) {
        setMembers(data.members);
      }
    } catch (error) {
      console.error('Error fetching group members:', error);
    }
  };

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

  // 수정 모달 열기
  const openEditModal = () => {
    setEditedMenu({
      name: menu?.name,
      description: menu?.description,
      category: menu?.category,
      type: menu?.type,
      mealType: menu?.mealType,
      date: menu?.date,
    });
    setEditModalVisible(true);
  };

  // 수정 저장
  const saveMenuChanges = async () => {
    try {
      if (!editedMenu.name) {
        Alert.alert('알림', '메뉴 이름은 필수입니다.');
        return;
      }

      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      const response = await fetch(`${API_URL}/api/menu/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editedMenu)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API 오류 응답:', errorText);
        throw new Error('Failed to update menu');
      }

      const updatedMenu = await response.json();
      setMenu(updatedMenu);
      setEditModalVisible(false);
      Alert.alert('알림', '메뉴가 성공적으로 수정되었습니다.');
    } catch (error) {
      console.error('Error updating menu:', error);
      Alert.alert('오류', '메뉴 수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 메뉴 삭제
  const deleteMenu = async () => {
    Alert.alert(
      '메뉴 삭제',
      '정말로 이 메뉴를 삭제하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel'
        },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const token = await AsyncStorage.getItem('userToken');
              if (!token) {
                router.replace('/auth/login');
                return;
              }

              const response = await fetch(`${API_URL}/api/menu/${id}`, {
                method: 'DELETE',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
              });

              if (!response.ok) {
                const errorText = await response.text();
                console.error('API 오류 응답:', errorText);
                throw new Error('Failed to delete menu');
              }

              Alert.alert('알림', '메뉴가 성공적으로 삭제되었습니다.', [
                { text: '확인', onPress: () => router.back() }
              ]);
            } catch (error) {
              console.error('Error deleting menu:', error);
              Alert.alert('오류', '메뉴 삭제에 실패했습니다.');
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // 날짜 변경 처리
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEditedMenu({ ...editedMenu, date: selectedDate.toISOString() });
    }
  };

  // 요리사 선택 모달 열기
  const openCookSelector = () => {
    setCookSelectorVisible(true);
  };

  // 요리사 선택
  const selectCook = async (member: Member) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      // 메뉴 업데이트 요청
      const response = await fetch(`${API_URL}/api/menu/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cook: member._id,
          cookName: member.name
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API 오류 응답:', errorText);
        throw new Error('Failed to update cook');
      }

      const updatedMenu = await response.json();
      setMenu(updatedMenu);
      setCookSelectorVisible(false);

      // 알림 보내기
      await sendNotificationToGroupMembers(member);

      Alert.alert('알림', `${member.name}님이 요리사로 지정되었습니다.`);
    } catch (error) {
      console.error('Error selecting cook:', error);
      Alert.alert('오류', '요리사 지정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 그룹 멤버들에게 알림 보내기
  const sendNotificationToGroupMembers = async (cook: Member) => {
    try {
      if (!currentGroup || !menu) return;

      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const response = await fetch(`${API_URL}/api/notifications/send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          groupId: currentGroup.id,
          title: '요리사 지정 알림',
          message: `${cook.name}님이 ${menu.name} 메뉴의 요리사로 지정되었습니다. (조리: ${cook.name})`,
          type: 'COOK_ASSIGNED',
          data: {
            menuId: menu._id,
            menuName: menu.name,
            cookId: cook._id,
            cookName: cook.name
          }
        })
      });

      if (!response.ok) {
        console.error('알림 전송 실패:', await response.text());
      }
    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  };

  // 회원 아바타 렌더링
  const renderMemberAvatar = (name: string) => {
    const initials = name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();

    const colors = [
      '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6',
      '#1abc9c', '#d35400', '#34495e', '#16a085', '#c0392b'
    ];
    
    // 이름에 기반한 일관된 색상 선택
    const hashCode = name.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    
    const colorIndex = hashCode % colors.length;
    const backgroundColor = colors[colorIndex];

    return (
      <View style={[styles.avatar, { backgroundColor }]}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
    );
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
      <View style={[styles.header, isDarkMode && styles.darkHeader]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#fff' : '#333'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDarkMode && styles.darkText]}>메뉴 상세</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.headerButton} onPress={openEditModal}>
            <Ionicons name="create-outline" size={24} color={isDarkMode ? '#fff' : '#333'} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={deleteMenu}>
            <Ionicons name="trash-outline" size={24} color={isDarkMode ? '#fff' : '#333'} />
          </TouchableOpacity>
        </View>
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

          {/* 요리사 정보 표시 */}
          <TouchableOpacity
            style={[styles.cookInfoContainer, isDarkMode && styles.darkCookInfoContainer]}
            onPress={openCookSelector}
          >
            <Ionicons name="person-outline" size={20} color={isDarkMode ? '#ddd' : '#666'} />
            <Text style={[styles.detailText, isDarkMode && styles.darkText]}>
              {menu.cookName 
                ? `조리: ${menu.cookName}` 
                : '요리사를 지정하려면 탭하세요'}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={isDarkMode ? '#ddd' : '#666'} />
          </TouchableOpacity>

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

      {/* 수정 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
          {/* 터치하면 키보드가 닫히도록 설정 */}
  <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.centeredView}>
          <View style={[styles.modalView, isDarkMode && styles.darkModalView]}>
            <Text style={[styles.modalTitle, isDarkMode && styles.darkText]}>메뉴 수정</Text>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, isDarkMode && styles.darkText]}>메뉴 이름</Text>
              <TextInput
                style={[styles.input, isDarkMode && styles.darkInput]}
                value={editedMenu.name}
                onChangeText={(text) => setEditedMenu({ ...editedMenu, name: text })}
                placeholder="메뉴 이름"
                placeholderTextColor={isDarkMode ? '#777' : '#999'}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, isDarkMode && styles.darkText]}>설명</Text>
              <TextInput
                style={[styles.textArea, isDarkMode && styles.darkInput]}
                value={editedMenu.description}
                onChangeText={(text) => setEditedMenu({ ...editedMenu, description: text })}
                placeholder="메뉴 설명"
                placeholderTextColor={isDarkMode ? '#777' : '#999'}
                multiline
                numberOfLines={4}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, isDarkMode && styles.darkText]}>카테고리</Text>
              <TextInput
                style={[styles.input, isDarkMode && styles.darkInput]}
                value={editedMenu.category}
                onChangeText={(text) => setEditedMenu({ ...editedMenu, category: text })}
                placeholder="카테고리 (breakfast, lunch, dinner 등)"
                placeholderTextColor={isDarkMode ? '#777' : '#999'}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, isDarkMode && styles.darkText]}>타입</Text>
              <TextInput
                style={[styles.input, isDarkMode && styles.darkInput]}
                value={editedMenu.type}
                onChangeText={(text) => setEditedMenu({ ...editedMenu, type: text })}
                placeholder="타입 (한식, 양식 등)"
                placeholderTextColor={isDarkMode ? '#777' : '#999'}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, isDarkMode && styles.darkText]}>식사 타입</Text>
              <TextInput
                style={[styles.input, isDarkMode && styles.darkInput]}
                value={editedMenu.mealType}
                onChangeText={(text) => setEditedMenu({ ...editedMenu, mealType: text })}
                placeholder="식사 타입 (아침, 점심, 저녁 등)"
                placeholderTextColor={isDarkMode ? '#777' : '#999'}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, isDarkMode && styles.darkText]}>날짜</Text>
              <TouchableOpacity
                style={[styles.dateInput, isDarkMode && styles.darkInput]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={[styles.dateInputText, isDarkMode && styles.darkText]}>
                  {editedMenu.date ? formatDate(editedMenu.date) : '날짜 선택'}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={editedMenu.date ? new Date(editedMenu.date) : new Date()}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                  themeVariant={isDarkMode ? 'dark' : 'light'}
                />
              )}
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.buttonCancel]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.buttonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonSave]}
                onPress={saveMenuChanges}
              >
                <Text style={styles.buttonText}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 요리사 선택 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={cookSelectorVisible}
        onRequestClose={() => setCookSelectorVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={[styles.modalView, isDarkMode && styles.darkModalView]}>
            <Text style={[styles.modalTitle, isDarkMode && styles.darkText]}>요리사 선택</Text>
            
            {members.length > 0 ? (
              <FlatList
                data={members}
                keyExtractor={item => item._id}
                style={styles.membersList}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[
                      styles.memberItem,
                      menu.cook === item._id && styles.selectedMemberItem,
                      isDarkMode && menu.cook === item._id && styles.darkSelectedMemberItem
                    ]}
                    onPress={() => selectCook(item)}
                  >
                    {renderMemberAvatar(item.name)}
                    <View style={styles.memberInfo}>
                      <Text style={[styles.memberName, isDarkMode && styles.darkText]}>
                        {item.name}
                      </Text>
                      <Text style={[styles.memberEmail, isDarkMode && styles.darkSubText]}>
                        {item.email}
                      </Text>
                    </View>
                    {menu.cook === item._id && (
                      <Ionicons 
                        name="checkmark-circle" 
                        size={22} 
                        color={isDarkMode ? "#3478F6" : "#3478F6"} 
                        style={styles.selectedIcon} 
                      />
                    )}
                  </TouchableOpacity>
                )}
              />
            ) : (
              <View style={styles.emptyList}>
                <Ionicons name="people-outline" size={48} color={isDarkMode ? "#777" : "#ccc"} />
                <Text style={[styles.emptyListText, isDarkMode && styles.darkText]}>
                  그룹 멤버가 없습니다
                </Text>
              </View>
            )}
            
            <TouchableOpacity
              style={[styles.button, styles.buttonCancel]}
              onPress={() => setCookSelectorVisible(false)}
            >
              <Text style={styles.buttonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    position: 'relative',
  },
  darkHeader: {
    backgroundColor: '#1c1c1c',
    borderBottomColor: '#333',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 4,
    marginLeft: 16,
  },
  backButton: {
    padding: 4,
    zIndex: 1
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    position: 'absolute', // 제목을 가운데에 위치시키기 위한 절대 위치
    left: 0,
    right: 0,
    bottom: 16,
    textAlign: 'center',
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
  
  // 모달 스타일
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  darkModalView: {
    backgroundColor: '#242424',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  darkInput: {
    backgroundColor: '#333',
    borderColor: '#555',
    color: '#e0e0e0',
  },
  textArea: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  dateInput: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  dateInputText: {
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  buttonCancel: {
    backgroundColor: '#aaa',
  },
  buttonSave: {
    backgroundColor: '#3478F6',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cookInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  darkCookInfoContainer: {
    backgroundColor: '#2c2c2c',
  },
  membersList: {
    width: '100%',
    maxHeight: 300,
    marginVertical: 16,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedMemberItem: {
    backgroundColor: '#f0f7ff',
  },
  darkSelectedMemberItem: {
    backgroundColor: '#263040',
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
  },
  memberEmail: {
    fontSize: 13,
    color: '#777',
    marginTop: 2,
  },
  selectedIcon: {
    marginLeft: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyList: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyListText: {
    fontSize: 16,
    color: '#777',
    marginTop: 10,
    textAlign: 'center',
  },
});
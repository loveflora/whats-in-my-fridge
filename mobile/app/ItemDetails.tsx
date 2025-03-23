import React, { useState, useEffect, useCallback } from 'react';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  FlatList
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '@/context/AppContext';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

import { API_URL } from "@/config/api";
import { useCategoryContext } from '@/context/CategoryContext';
import { FridgeItem, Category } from '@/types/Fridge';
import { CustomHeader } from '@/components/CustomHeader';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'react-native-calendars';
import { CATEGORIES } from '@/constants/Categories';

export default function ItemDetailsScreen() {
  const params = useLocalSearchParams();
  const id = params.id as string;
  const router = useRouter();
  const { settings } = useAppContext();
  const isDarkMode = settings.theme === 'dark';
  const { categories, fetchCategories } = useCategoryContext();
  
  const [item, setItem] = useState<FridgeItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<FridgeItem>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [editedQuantity, setEditedQuantity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    fetchItemDetails();
    fetchCategories(); // 카테고리 데이터 로드
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      fetchItemDetails();
    }, [id])
  );

  const fetchItemDetails = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      // console.log(`아이템 상세 정보 가져오기: ID=${id}`);
      const response = await fetch(`${API_URL}/api/fridge/items/${id}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API 오류 응답:', errorText);
        throw new Error('Failed to fetch item details');
      }

      const data = await response.json();
      console.log('아이템 상세 정보:', data);
      setItem(data);
    } catch (error) {
      console.error('Error fetching item details:', error);
      Alert.alert('Error', 'Failed to load item details');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (item) {
      setEditFormData({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        expiryDate: item.expiryDate,
        category: item.category
      });
      setEditModalVisible(true);
    }
  };

  const updateItem = async () => {
    try {
      if (!editFormData.name || editFormData.quantity === undefined || !editFormData.unit || !editFormData.expiryDate || !editFormData.category) {
        Alert.alert('입력 오류', '모든 필드를 입력해주세요.');
        return;
      }

      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      setLoading(true);
      const response = await fetch(`${API_URL}/api/fridge/items/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editFormData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('아이템 수정 오류:', errorText);
        throw new Error('Failed to update item');
      }

      const updatedItem = await response.json();
      setItem(updatedItem);
      setEditModalVisible(false);
      Alert.alert('성공', '아이템이 수정되었습니다.');
    } catch (error) {
      console.error('Error updating item:', error);
      Alert.alert('오류', '아이템 수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      setLoading(true);
      const response = await fetch(`${API_URL}/api/fridge/items/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('아이템 삭제 오류:', errorText);
        throw new Error('Failed to delete item');
      }

      Alert.alert('성공', '아이템이 삭제되었습니다.', [
        { text: '확인', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error deleting item:', error);
      Alert.alert('오류', '아이템 삭제에 실패했습니다.');
      setLoading(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      '아이템 삭제',
      '정말로 이 아이템을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { text: '삭제', style: 'destructive', onPress: deleteItem }
      ],
      { cancelable: true }
    );
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

  const getExpiryText = (daysUntilExpiry: number) => {
    if (daysUntilExpiry < 0) return `만료됨 (${-daysUntilExpiry}일 지남)`;
    if (daysUntilExpiry === 0) return '오늘 만료';
    return `${daysUntilExpiry}일 남음`;
  };

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
    setEditFormData({...editFormData, expiryDate: currentDate.toISOString().split('T')[0]});
  };

  // 개별 필드 수정 관련 함수들
  const startEditing = (field: string) => {
    setEditingField(field);
    
    if (field === 'quantity' && item) {
      setEditedQuantity(item.quantity.toString());
    } else if (field === 'category' && item) {
      setSelectedCategory(item.category);
      setShowCategoryPicker(true);
    } else if (field === 'expiryDate') {
      setShowDatePicker(true);
    }
  };

  // 수량 변경 저장
  const saveQuantity = async () => {
    if (!item || !editedQuantity) return;
    
    try {
      const quantity = parseInt(editedQuantity);
      if (isNaN(quantity) || quantity <= 0) {
        Alert.alert('오류', '유효한 수량을 입력해주세요.');
        return;
      }
      
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('인증 토큰이 없습니다.');
      // 
      const response = await fetch(`${API_URL}/api/fridge/items/${item._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...item,
          quantity: quantity
        })
      });
      
      if (!response.ok) throw new Error('수량 업데이트에 실패했습니다.');
      
      // 성공적으로 업데이트되면 아이템 정보 다시 불러오기
      setItem({...item, quantity: quantity});
      setEditingField(null);
    } catch (error) {
      console.error('수량 업데이트 오류:', error);
      Alert.alert('오류', '수량 업데이트에 실패했습니다.');
    }
  };

  // 카테고리 변경 저장
  const saveCategory = async (category: string | undefined) => {
    if (!item) return;
    
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('인증 토큰이 없습니다.');
      
      const response = await fetch(`${API_URL}/api/fridge/items/${item._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...item,
          category: category  // 백엔드에서 카테고리 이름으로 처리
        })
      });

      if (!response.ok) throw new Error('카테고리 업데이트에 실패했습니다.');
      
      // 서버에서 응답받은 데이터로 업데이트
      const updatedItem = await response.json();
      console.log("updateItem::::::::::::", updatedItem)
      setItem(updatedItem);
      setEditingField(null);
      setShowCategoryPicker(false);
    } catch (error) {
      console.error('카테고리 업데이트 오류:', error);
      Alert.alert('오류', '카테고리 업데이트에 실패했습니다.');
    }
  };

  // 유통기한 변경 저장
  const saveExpiryDate = async (date: Date) => {
    if (!item) return;
    
    try {
      const formattedDate = date.toISOString().split('T')[0];
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('인증 토큰이 없습니다.');
      // 
      const response = await fetch(`${API_URL}/api/fridge/items/${item._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...item,
          expiryDate: formattedDate
        })
      });
      
      if (!response.ok) throw new Error('유통기한 업데이트에 실패했습니다.');
      
      // 성공적으로 업데이트되면 아이템 정보 다시 불러오기
      setItem({...item, expiryDate: formattedDate});
      setEditingField(null);
    } catch (error) {
      console.error('유통기한 업데이트 오류:', error);
      Alert.alert('오류', '유통기한 업데이트에 실패했습니다.');
    }
  };

  // 카테고리 이름 가져오기
  const getCategoryName = (categoryId: string | undefined) => {
    if (!categoryId) return '';
    const category = categories.find(c => c._id === categoryId);
    return category ? category.name : categoryId;
  };

  if (loading) {
    return (
      <View style={[styles.container, isDarkMode && styles.darkContainer, styles.centerContent]}>
        <ActivityIndicator size="large" color="#3478F6" />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={[styles.container, isDarkMode && styles.darkContainer, styles.centerContent]}>
        <Ionicons name="alert-circle-outline" size={64} color={isDarkMode ? "#666" : "#ccc"} />
        <Text style={[styles.errorText, isDarkMode && styles.darkText]}>아이템을 찾을 수 없습니다</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>뒤로 가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  console.log("item*************", item)

  const daysUntilExpiry = getDaysUntilExpiry(item.expiryDate);
  const expiryColor = getExpiryColor(daysUntilExpiry);

  return (
    <View style={[styles.container, isDarkMode && styles.darkContainer]}>
      <CustomHeader/>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backIcon}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={isDarkMode ? "#fff" : "#000"} />
          </TouchableOpacity>
          <Text style={[styles.title, isDarkMode && styles.darkText]} 
          numberOfLines={1}>{item.name}</Text>
          <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.headerButton} onPress={confirmDelete}>
            <Ionicons name="trash-outline" size={24} color={isDarkMode ? '#fff' : '#333'} />
          </TouchableOpacity>
        </View>
        </View>

        <View style={styles.content}>
          <View style={[styles.section, isDarkMode && styles.darkSection]}>
            <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>기본 정보</Text>
            
            {/* 수량 정보 */}
            <TouchableOpacity style={styles.infoRow} onPress={() => startEditing('quantity')}>
              <Text style={[styles.infoLabel, isDarkMode && styles.darkText]}>수량:</Text>
              {editingField === 'quantity' ? (
                <View style={styles.editFieldContainer}>
                  <TextInput
                    style={[styles.editInput, isDarkMode && styles.darkText]}
                    value={editedQuantity}
                    onChangeText={setEditedQuantity}
                    keyboardType="numeric"
                    autoFocus
                  />
                  <Text style={[styles.infoValue, isDarkMode && styles.darkText]}> {item?.unit}</Text>
                  <TouchableOpacity style={styles.saveButton} onPress={saveQuantity}>
                    <Ionicons name="checkmark" size={20} color="#4CAF50" />
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={[styles.infoValue, isDarkMode && styles.darkText]}>
                  {item?.quantity} {item?.unit}
                </Text>
              )}
            </TouchableOpacity>
            
            {/* 카테고리 정보 */}
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, isDarkMode && styles.darkText]}>카테고리:</Text>
              <Text style={[styles.infoValue, isDarkMode && styles.darkText]}>
                {getCategoryName(item?.category)}
              </Text>
            </View>
            
            {/* 카테고리 선택 영역 */}
            <ScrollView horizontal contentContainerStyle={styles.tagContainer}>
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.tagItem,
                    // 이제 item.category가 카테고리 이름이므로 직접 비교 가능
                    item?.category?.toLowerCase() === category.toLowerCase() && styles.selectedTagItem
                  ]}
                  onPress={() => saveCategory(category)}
                >
                  <Text style={[styles.tagText, isDarkMode && styles.darkTagText]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {/* 사용자 정의 카테고리 */}
            {categories.length > 0 && (
              <View style={[styles.tagContainer, { marginTop: 10 }]}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category._id}
                    style={[
                      styles.categoryItem,
                      // 이제 item.category가 카테고리 이름이므로 이름으로 비교
                      item?.category?.toLowerCase() === category.name.toLowerCase() && styles.selectedCategoryItem
                    ]}
                    onPress={() => saveCategory(category.name)}
                  >
                    <View style={[styles.categoryIconContainer, { backgroundColor: category.color }]}>
                      <Ionicons name={category.icon as any} size={20} color="#fff" />
                    </View>
                    <Text style={[styles.categoryText, isDarkMode && styles.darkText]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={[styles.section, isDarkMode && styles.darkSection]}>
            <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>유통기한</Text>
            
            {/* 유통기한 정보 */}
            <TouchableOpacity style={styles.infoRow} onPress={() => startEditing('expiryDate')}>
              <Text style={[styles.infoLabel, isDarkMode && styles.darkText]}>날짜:</Text>
              <Text style={[styles.infoValue, isDarkMode && styles.darkText]}>
                {formatDate(item?.expiryDate || '')}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, isDarkMode && styles.darkText]}>상태:</Text>
              <Text 
                style={[
                  styles.infoValue, 
                  { color: getExpiryColor(getDaysUntilExpiry(item?.expiryDate || '')) }
                ]}
              >
                {getExpiryText(getDaysUntilExpiry(item?.expiryDate || ''))}
              </Text>
            </View>
          </View>
        </View>
        
        {/* 날짜 선택기 */}
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
                  setShowDatePicker(false);
                }}
                markedDates={{
                  [item?.expiryDate ? formatDate(item.expiryDate) : formatDate(new Date())]: {selected: true}
                }}
              />
              <TouchableOpacity 
                style={{marginTop: 10, alignSelf: 'center'}} 
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={{color: 'blue', fontSize: 16}}>취소</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  scrollView: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#fff',
  },
  darkHeader: {
    backgroundColor: '#1e1e1e',
  },
  backIcon: {
    padding: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
    textAlign: 'center',
    overflow: 'hidden',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  darkSection: {
    backgroundColor: '#2a2a2a',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#000',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    width: 80,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  expiryStatus: {
    fontSize: 16,
    fontWeight: '500',
  },
  editButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  deleteButton: {
    backgroundColor: '#F44336',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    maxHeight: '80%',
  },
  darkModalContent: {
    backgroundColor: '#2a2a2a',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#000',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    fontSize: 16,
  },
  darkInput: {
    borderColor: '#444',
    color: '#fff',
    backgroundColor: '#333',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  darkText: {
    color: '#fff',
  },
  editFieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  editInput: {
    flex: 1,
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 5,
    fontSize: 16,
    color: '#333',
  },
  saveButton: {
    padding: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedCategoryItem: {
    backgroundColor: '#f5f5f5',
  },
  categoryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryText: {
    fontSize: 16,
    color: '#333',
  },
  modalCloseButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#eee',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  // category tag
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 10,
  },
  tagItem: {
    backgroundColor: '#ddd',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    margin: 5,
  },
  selectedTagItem: {
    backgroundColor: 'red', // Or any color to show selection
  },
  tagText: {
    color: '#000',
    fontSize: 14,
  },
  darkTagText: {
    color: '#fff',
  },
});
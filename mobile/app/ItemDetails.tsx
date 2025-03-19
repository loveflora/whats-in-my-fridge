import React, { useState, useEffect } from 'react';
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
  Keyboard
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '@/context/AppContext';
import DateTimePicker from '@react-native-community/datetimepicker';

import { API_URL } from "@/config/api"

interface FridgeItem {
  _id: string;
  name: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  category: string;
}

export default function ItemDetailsScreen() {
  const params = useLocalSearchParams();
  const id = params.id as string;
  const router = useRouter();
  const { settings } = useAppContext();
  const isDarkMode = settings.theme === 'dark';
  
  const [item, setItem] = useState<FridgeItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<FridgeItem>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    fetchItemDetails();
  }, [id]);

  const fetchItemDetails = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      console.log(`아이템 상세 정보 가져오기: ID=${id}`);
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

  // 수정 모달 열기 및 데이터 준비
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

  // 아이템 수정 API 호출
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

  // 아이템 삭제 API 호출
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

  // 삭제 확인
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

  // 유통기한까지 남은 일수 계산
  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // 남은 일수에 따른 색상 반환
  const getExpiryColor = (daysUntilExpiry: number) => {
    if (daysUntilExpiry < 0) return '#FF0000';
    if (daysUntilExpiry <= 3) return '#FFA500';
    return '#4CAF50';
  };

  // 유통기한 표시 텍스트
  const getExpiryText = (daysUntilExpiry: number) => {
    if (daysUntilExpiry < 0) return `만료됨 (${-daysUntilExpiry}일 지남)`;
    if (daysUntilExpiry === 0) return '오늘 만료';
    return `${daysUntilExpiry}일 남음`;
  };

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
    setEditFormData({...editFormData, expiryDate: currentDate.toISOString().split('T')[0]});
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

  const daysUntilExpiry = getDaysUntilExpiry(item.expiryDate);
  const expiryColor = getExpiryColor(daysUntilExpiry);

  return (
    <View style={[styles.container, isDarkMode && styles.darkContainer]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backIcon}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={isDarkMode ? "#fff" : "#000"} />
          </TouchableOpacity>
          <Text style={[styles.title, isDarkMode && styles.darkText]}>{item.name}</Text>
          <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.headerButton} onPress={handleEdit}>
            <Ionicons name="create-outline" size={24} color={isDarkMode ? '#fff' : '#333'} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={confirmDelete}>
            <Ionicons name="trash-outline" size={24} color={isDarkMode ? '#fff' : '#333'} />
          </TouchableOpacity>
        </View>
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>기본 정보</Text>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, isDarkMode && styles.darkText]}>수량:</Text>
              <Text style={[styles.infoValue, isDarkMode && styles.darkText]}>{item.quantity} {item.unit}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, isDarkMode && styles.darkText]}>카테고리:</Text>
              <Text style={[styles.infoValue, isDarkMode && styles.darkText]}>{item.category}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>유통기한</Text>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, isDarkMode && styles.darkText]}>날짜:</Text>
              <Text style={[styles.infoValue, isDarkMode && styles.darkText]}>{formatDate(item.expiryDate)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, isDarkMode && styles.darkText]}>상태:</Text>
              <Text style={[styles.expiryStatus, { color: expiryColor }]}>
                {getExpiryText(daysUntilExpiry)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.editButton]}
          onPress={handleEdit}
        >
          <Ionicons name="create-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>수정</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.deleteButton]}
          onPress={confirmDelete}
        >
          <Ionicons name="trash-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>삭제</Text>
        </TouchableOpacity>
      </View> */}

      {/* 아이템 수정 모달 */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={[styles.modalContent, isDarkMode && styles.darkModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDarkMode && styles.darkText]}>아이템 수정</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color={isDarkMode ? "#fff" : "#000"} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer}>
              <Text style={[styles.formLabel, isDarkMode && styles.darkText]}>이름</Text>
              <TextInput
                style={[styles.input, isDarkMode && styles.darkInput]}
                value={editFormData.name?.toString()}
                onChangeText={(text) => setEditFormData({...editFormData, name: text})}
                placeholder="아이템 이름"
                placeholderTextColor={isDarkMode ? "#666" : "#999"}
              />

              <Text style={[styles.formLabel, isDarkMode && styles.darkText]}>카테고리</Text>
              <TextInput
                style={[styles.input, isDarkMode && styles.darkInput]}
                value={editFormData.category?.toString()}
                onChangeText={(text) => setEditFormData({...editFormData, category: text})}
                placeholder="카테고리"
                placeholderTextColor={isDarkMode ? "#666" : "#999"}
              />

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={[styles.formLabel, isDarkMode && styles.darkText]}>수량</Text>
                  <TextInput
                    style={[styles.input, isDarkMode && styles.darkInput]}
                    value={editFormData.quantity?.toString()}
                    onChangeText={(text) => setEditFormData({...editFormData, quantity: parseFloat(text) || 0})}
                    keyboardType="numeric"
                    placeholder="수량"
                    placeholderTextColor={isDarkMode ? "#666" : "#999"}
                  />
                </View>

                <View style={styles.halfInput}>
                  <Text style={[styles.formLabel, isDarkMode && styles.darkText]}>단위</Text>
                  <TextInput
                    style={[styles.input, isDarkMode && styles.darkInput]}
                    value={editFormData.unit?.toString()}
                    onChangeText={(text) => setEditFormData({...editFormData, unit: text})}
                    placeholder="단위"
                    placeholderTextColor={isDarkMode ? "#666" : "#999"}
                  />
                </View>
              </View>

              <Text style={[styles.formLabel, isDarkMode && styles.darkText]}>유통기한</Text>
              <TouchableOpacity
                style={[styles.dateButton, isDarkMode && styles.darkInput]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={[styles.dateButtonText, isDarkMode && styles.darkText]}>
                  {editFormData.expiryDate ? formatDate(editFormData.expiryDate) : '날짜 선택'}
                </Text>
                <Ionicons name="calendar" size={20} color={isDarkMode ? "#fff" : "#000"} />
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={editFormData.expiryDate ? new Date(editFormData.expiryDate) : new Date()}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                />
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={updateItem}
              >
                <Text style={styles.modalButtonText}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
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
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 4,
    marginLeft: 16,
  },
  backIcon: {
    marginRight: 16,
    zIndex: 1
  },
  title: {
    textAlign: "center",
    position: 'absolute', // 제목을 가운데에 위치시키기 위한 절대 위치
    left: 0,
    right: 0,
    bottom: 16,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  darkText: {
    color: '#fff',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#000',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    flex: 1,
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    flex: 2,
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  expiryStatus: {
    flex: 2,
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  editButton: {
    backgroundColor: '#3478F6',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  backButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#3478F6',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  // 모달 스타일
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  darkModalContent: {
    backgroundColor: '#1e1e1e',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  formContainer: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    marginBottom: 5,
    color: '#000',
  },
  input: {
    height: 45,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: '#f9f9f9',
    color: '#000',
  },
  darkInput: {
    borderColor: '#444',
    backgroundColor: '#333',
    color: '#fff',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 45,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: '#f9f9f9',
  },
  dateButtonText: {
    color: '#000',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  saveButton: {
    backgroundColor: '#3478F6',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
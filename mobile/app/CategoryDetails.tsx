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
  Keyboard
} from 'react-native';
import { API_URL } from "@/config/api"
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '@/context/AppContext';
import { Category } from '@/types/Fridge';
import { CustomHeader } from '@/components/CustomHeader';
import { useCategoryContext } from '@/context/CategoryContext';


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

    const { 
        addCategory, 
        updateCategory, 
        editingCategory, 
        setEditingCategory,
        selectedColor,
        selectedIcon,
        deleteCategory 
      } = useCategoryContext();

    
    // useEffect(() => {
    //     fetchCategoryDetails();
    //   }, [id]);

    // useFocusEffect를 사용하여 화면에 포커스가 생길 때마다 카테고리 정보 다시 불러오기
    useFocusEffect(
      useCallback(() => {
        console.log('카테고리 상세 화면 포커스 - 데이터 다시 불러오기');
        fetchCategoryDetails();
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
    
          console.log(`아이템 상세 정보 가져오기: ID=${id}`);
          const response = await fetch(`${API_URL}/api/categories/${id}`, {
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
          setCategory(data);
        } catch (error) {
          console.error('Error fetching item details:', error);
          Alert.alert('Error', 'Failed to load item details');
        } finally {
          setLoading(false);
        }
      };

         // 삭제 로직도 context 사용
   const handleDeleteCategoryClick = async (categoryId: string) => {
    try {
      await deleteCategory(categoryId);
    //   Alert.alert('Success', 'Category deleted successfully');
      router.back();
    } catch (error) {
      // 에러는 context 내부에서 처리됨
    }
  };
    


      const handleEditCategory =  () => {
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
      }


    
    return(

<View style={[styles.container, isDarkMode && styles.darkContainer]}>

<CustomHeader  />

      <ScrollView style={styles.scrollView}>
        {/* HEADER */}
        <View style={[styles.header, { backgroundColor: category?.color || "#ccc" }]}>
          {/* 뒤로 가기 */}
          <TouchableOpacity
            style={styles.backIcon}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={isDarkMode ? "#fff" : "#000"} />
          </TouchableOpacity>
          
          {/* icon & category name */}
          <View style={styles.categoryIconContainer}>
            {/* 아이콘 배경 */}
            <View style={[styles.iconBackground, { backgroundColor: category?.color || "#ccc" }]}>
              <Ionicons name={category?.icon as any} size={24} color={"#fff"} />
            </View>
            <Text style={[styles.title,  isDarkMode && styles.darkText]}>{category?.name}</Text>
          </View>
          <View style={styles.headerButtons}>

          <TouchableOpacity style={styles.headerButton} onPress={handleEditCategory}>
            <Ionicons name="create-outline" size={24} color={isDarkMode ? '#fff' : '#333'} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleDeleteCategory}>
            <Ionicons name="trash-outline" size={24} color={isDarkMode ? '#fff' : '#333'} />
          </TouchableOpacity>
        </View>
        </View>



        <View style={styles.content}>

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
    // justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    // borderBottomWidth: 1,
    // borderBottomColor: '#eee',
    // paddingTop: 70,
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
    // marginRight: 16,
    zIndex: 1
  },
  categoryIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    // justifyContent: "flex-end",
    // width: "90%",
},
// icon 원
iconBackground: {
    width: 50, 
    height: 50, 
    borderRadius: 30, 
    backgroundColor: "#ccc", 
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
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
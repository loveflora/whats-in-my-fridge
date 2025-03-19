// context/CategoryContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { API_URL } from "@/config/api";

// 타입 정의
interface Category {
  _id: string;
  name: string;
  color: string;
  icon: string;
}

interface CategoryContextType {
  categories: Category[];
  fetchCategories: () => Promise<void>;
  addCategory: (name: string, color: string, icon: string) => Promise<void>;
  updateCategory: (id: string, name: string, color: string, icon: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  editingCategory: Category | null;
  setEditingCategory: (category: Category | null) => void;


  // 색상 관련
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  availableColors: string[];
  
  // 아이콘 관련 추가
  selectedIcon: string;
  setSelectedIcon: (icon: string) => void;
  availableIcons: string[]; // 사용 가능한 아이콘 목록
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export const CategoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

 // 색상 관련 상태
 const [selectedColor, setSelectedColor] = useState<string>('#3478F6');
 const availableColors = [
   '#3498db', // 파란색
   '#e74c3c', // 빨간색
   '#2ecc71', // 초록색
   '#f39c12', // 노란색
   '#9b59b6', // 보라색
   '#34495e', // 회색
 ];
 
 // 아이콘 관련 상태 추가
 const [selectedIcon, setSelectedIcon] = useState<string>('tag');
 const availableIcons = [
   'tag',
   'cart',
   'nutrition',
   'restaurant',
   'basket',
   'wine',
   'beer',
   'pizza',
   'ice-cream',
   'fast-food',
   'cafe',
   'water',
   'fish',
   'egg'
 ];

 useEffect(() => {
    if (editingCategory) {
      setSelectedColor(editingCategory.color);
      setSelectedIcon(editingCategory.icon);
    } else {
      // 기본값으로 리셋
      setSelectedColor('#3478F6');
      setSelectedIcon('tag');
    }
  }, [editingCategory]);
  


  const fetchCategories = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      const response = await fetch(`${API_URL}/api/categories`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      Alert.alert('Error', 'Failed to load categories');
    }
  };

  const addCategory = async (name: string, color: string, icon: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      const response = await fetch(`${API_URL}/api/categories`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          color,
          icon,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add category');
      }

      const newCategory = await response.json();
      setCategories([...categories, newCategory]);
      return newCategory;
    } catch (error) {
      console.error('Error adding category:', error);
      Alert.alert('Error', 'Failed to add category');
      throw error;
    }
  };

  const updateCategory = async (id: string, name: string, color: string, icon: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      const response = await fetch(`${API_URL}/api/categories/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          color,
          icon,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update category');
      }

      const updatedCategory = await response.json();
      
      setCategories(
        categories.map((cat) =>
          cat._id === id ? updatedCategory : cat
        )
      );
      
      return updatedCategory;
    } catch (error) {
      console.error('Error updating category:', error);
      Alert.alert('Error', 'Failed to update category');
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      const response = await fetch(`${API_URL}/api/categories/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete category');
      }

      setCategories(categories.filter(cat => cat._id !== id));
    } catch (error) {
      console.error('Error deleting category:', error);
      Alert.alert('Error', 'Failed to delete category');
      throw error;
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    fetchCategories();
  }, []);

   // value 객체에 색상 및 아이콘 관련 상태와 함수 추가
   const value = {
    categories,
    fetchCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    editingCategory,
    setEditingCategory,
    
    // 색상 관련
    selectedColor,
    setSelectedColor,
    availableColors,
    
    // 아이콘 관련
    selectedIcon,
    setSelectedIcon,
    availableIcons
  };
  
  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
};

// 커스텀 훅 만들기
export const useCategoryContext = () => {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error('useCategoryContext must be used within a CategoryProvider');
  }
  return context;
};
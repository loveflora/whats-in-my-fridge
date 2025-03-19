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
    '#ffb3b3',  // 부드러운 살구색 (Soft Apricot)
    '#ff6666',  // 부드러운 빨간색 (Soft Red)
    '#ff0000',  // 빨간색 (Red)
    '#e60000',  // 붉은 주홍색 (Crimson Red)
    '#ff7f00',  // 주황색 (Orange)
    '#ff9966',  // 부드러운 주황색 (Soft Orange)
    '#ffd700',  // 금색 (Gold)
    '#BEDC74',  // 연두색 (Light Green)
    '#6EC207',  // 밝은 초록색 (Bright Green)
    '#99BC85',  // 부드러운 초록색 (Soft Green)
    '#6A9C89',  // 자연색 (Natural Green)
    '#2f4f4f',  // 다크 슬레이트 그레이 (Dark Slate Gray)
    '#66cccc',  // 부드러운 청록색 (Soft Turquoise)
    '#66b3ff',  // 부드러운 파란색 (Soft Blue)
    '#9966ff',  // 부드러운 남색 (Soft Indigo)
    '#c266ff',  // 부드러운 보라색 (Soft Violet)
    '#ff66b3',  // 부드러운 분홍색 (Soft Pink)
    '#b3b3b3',  // 부드러운 회색 (Soft Gray)
    '#808080',  // 중간 회색 (Medium Gray)
    '#4f4f4f',  // 어두운 회색 (Dark Gray)    
    '#504B38',  // 어두운 갈색 (Dark Brown)
    '#754E1A',  // 따뜻한 갈색 (Warm Brown)
    '#BDB395',  // 부드러운 카키 (Soft Khaki)
    '#D5C7A3',  // 부드러운 베이지 (Soft Beige)
 ];
 
 // 아이콘 관련 상태 추가
 const [selectedIcon, setSelectedIcon] = useState<string>('help');
 const availableIcons = [
   'help',
   'star',
   'reorder-four',
   'fish',
   'restaurant',
   'snow',
   'nutrition',
   'water',
   'pint',
   'egg',
   'leaf', 
   'cart',
   'basket',
   'wine',
   'beer',
   'pizza',
   'ice-cream',
   'fast-food',
   'cafe',
   'scale',
'bookmark',
"eye",
'flag',
'flame',
'flash',
'hand-left',
'happy',
'heart',
'home',
'hourglass-outline',
'list',
'medical',
'moon',
'paw',
'sunny',
'time',
'warning',


 ];

 useEffect(() => {
    if (editingCategory) {
      setSelectedColor(editingCategory.color);
      setSelectedIcon(editingCategory.icon);
    } else {
      // 기본값으로 리셋
      setSelectedColor('#3478F6');
      setSelectedIcon('help');
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
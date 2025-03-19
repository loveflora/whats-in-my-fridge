import { useState } from 'react';
import { useRoute } from '@react-navigation/native';
import { useLocalSearchParams, router } from 'expo-router';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Alert
} from 'react-native';
// import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useCategoryContext } from '@/context/CategoryContext';


import { API_URL } from "@/config/api"
import ColorPalette from './colorPalette';
import IconPicker from '@/components/ui/IconPicker';


export default function AddCategoryModal() {
    
    // const route = useRoute(); 
    const { 
        addCategory, 
        updateCategory, 
        editingCategory, 
        setEditingCategory,
        selectedColor,
        selectedIcon
      } = useCategoryContext();
      
    // const { editingCategory } = useLocalSearchParams();
    // const editingCategory = route.params?.editingCategory || null; 

    const [newCategoryName, setNewCategoryName] = useState('');
    // const [newCategoryColor, setNewCategoryColor] = useState('#3478F6');
    // const [newCategoryIcon, setNewCategoryIcon] = useState('tag');

    const handleAddCategory = async () => {
        try {
          await addCategory(newCategoryName, selectedColor, selectedIcon);
          
          // 성공 후 처리
          setNewCategoryName('');
          
        //   Alert.alert('Success', 'Category added successfully');
          router.back();
        } catch (error) {
          // 에러는 이미 context에서 처리됨
        }
      };

    // const handleAddCategory = async () => {
    //     try {
    //       const token = await AsyncStorage.getItem('userToken');
    //       if (!token) {
    //         router.replace('/auth/login');
    //         return;
    //       }
    
    //       const response = await fetch(`${API_URL}/api/categories`, {
    //         method: 'POST',
    //         headers: {
    //           Authorization: `Bearer ${token}`,
    //           'Content-Type': 'application/json',
    //         },
    //         body: JSON.stringify({
    //           name: newCategoryName,
    //           color: newCategoryColor,
    //           icon: newCategoryIcon,
    //         }),
    //       });
    
    //       if (!response.ok) {
    //         throw new Error('Failed to add category');
    //       }
    
    //       const newCategory = await response.json();
    //       setCategories([...categories, newCategory]);
          
    //       // Reset form
    //       setNewCategoryName('');
    //       setNewCategoryColor('#3478F6');
    //       setNewCategoryIcon('tag');
          
    //     //   Alert.alert('Success', 'Category added successfully');
    //     } catch (error) {
    //       console.error('Error adding category:', error);
    //       Alert.alert('Error', 'Failed to add category');
    //     }
    //   };
    
    const handleEditCategory = async () => {
        if (!editingCategory || !newCategoryName.trim()) {
          Alert.alert('Error', 'Category name is required');
          return;
        }
    
        try {
          await updateCategory(
            editingCategory._id,
            newCategoryName,
            selectedColor,
            selectedIcon
          );
          
          // 성공 후 처리
          setEditingCategory(null);
          setNewCategoryName('');
          
        //   Alert.alert('Success', 'Category updated successfully');
          router.back();
        } catch (error) {
          // 에러는 context에서 처리됨
        }
      };

    // const handleEditCategory = async () => {
    //     if (!editingCategory || !newCategoryName.trim()) {
    //       Alert.alert('Error', 'Category name is required');
    //       return;
    //     }
    
    //     try {
    //       const token = await AsyncStorage.getItem('userToken');
    //       if (!token) {
    //         router.replace('/auth/login');
    //         return;
    //       }
    
    //       const response = await fetch(`${API_URL}/api/categories/${editingCategory._id}`, {
    //         method: 'PUT',
    //         headers: {
    //           Authorization: `Bearer ${token}`,
    //           'Content-Type': 'application/json',
    //         },
    //         body: JSON.stringify({
    //           name: newCategoryName,
    //           color: newCategoryColor,
    //           icon: newCategoryIcon,
    //         }),
    //       });
    
    //       if (!response.ok) {
    //         throw new Error('Failed to update category');
    //       }
    
    //       const updatedCategory = await response.json();
          
    //       // Update categories state
    //       setCategories(
    //         categories.map((cat) =>
    //           cat._id === editingCategory._id ? updatedCategory : cat
    //         )
    //       );
          
    //       // Reset form
    //       setEditingCategory(null);
    //       setNewCategoryName('');
    //       setNewCategoryColor('#3478F6');
    //       setNewCategoryIcon('tag');
    //     //   setShowCategoryModal(false);
          
    //       Alert.alert('Success', 'Category updated successfully');
    //     } catch (error) {
    //       console.error('Error updating category:', error);
    //       Alert.alert('Error', 'Failed to update category');
    //     }
    //   };


    return (
    <View style={styles.categoryModal}>
    <Text style={styles.categoryModalTitle}>Add Category</Text>
    <TextInput
      style={styles.categoryModalInput}
      value={newCategoryName}
      onChangeText={(text) => setNewCategoryName(text)}
      placeholder="Category name"
    />
    <ColorPalette />
    <IconPicker />
    {/* <TextInput
  style={styles.categoryModalInput}
  value={selectedColor}  // Context에서 가져온 값 사용
  editable={false}
/> */}
    {/* <TextInput
      style={styles.categoryModalInput}
      value={newCategoryIcon}
      onChangeText={(text) => setNewCategoryIcon(text)}
      placeholder="Category icon"
    /> */}
    {editingCategory ? (
      <TouchableOpacity
        style={[
          styles.categoryModalButton,
          { backgroundColor: selectedColor } // 동적으로 선택된 색상 적용
        ]}
        onPress={handleEditCategory}
      >
        <Text style={styles.categoryModalButtonText}>Update Category</Text>
      </TouchableOpacity>
    ) : (
      <TouchableOpacity
        style={[
          styles.categoryModalButton,
          { backgroundColor: selectedColor } // 동적으로 선택된 색상 적용
        ]}
        onPress={handleAddCategory}
      >
        <Text style={styles.categoryModalButtonText}>Add Category</Text>
      </TouchableOpacity>
    )}
  </View>
      )
}

const styles = StyleSheet.create({
    categoryModal: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#fff',
        padding: 20,
      },
      categoryModalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
      },
      categoryModalInput: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        marginBottom: 16,
        padding: 10,
      },
      categoryModalButton: {
        backgroundColor: '#3478F6',
        padding: 10,
        borderRadius: 5,
      },
      categoryModalButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        textAlign: "center"
      },
    
   
    
    
})
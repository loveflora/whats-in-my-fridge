import { useState } from 'react';

import { router } from 'expo-router';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCategoryContext } from '@/context/CategoryContext';

import ColorPalette from './colorPalette';
import IconPicker from '@/components/ui/IconPicker';


export default function AddCategoryModal() {
    
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


    return (
    <View style={styles.categoryModal}>

<View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>새 카테고리 추가</Text>
      <View style={{ width: 40 }} />
      </View>


    <TextInput
      style={styles.categoryModalInput}
      value={newCategoryName}
      onChangeText={(text) => setNewCategoryName(text)}
      placeholder="Category name"
    />
    <ColorPalette />
    <IconPicker />

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
        paddingHorizontal : 20,
        paddingVertical: 10
      },
      header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 10,
        paddingBottom: 20,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
      },
      backButton: {
        padding: 8,
      },
      title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
      },
      categoryModalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
      },
      categoryModalInput: {
        height: 50,
        backgroundColor: '#f5f5f5',
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 6,
        borderRadius: 10,
        paddingHorizontal: 12,
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
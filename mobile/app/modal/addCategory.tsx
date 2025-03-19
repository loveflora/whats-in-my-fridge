import { useEffect, useState } from 'react';

import { router, useLocalSearchParams } from 'expo-router';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Alert,
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
        selectedIcon,
        setSelectedColor,
        setSelectedIcon
      } = useCategoryContext();
      
    const params = useLocalSearchParams();
    const isEditing = params.isEdited === "true"; 
    const categoryId = params.categoryId as string;
    const categoryName = params.categoryName as string;
    const categoryColor = params.categoryColor as string;
    const categoryIcon = params.categoryIcon as string;

    console.log("isEditing***********", isEditing)

    const [newCategoryName, setNewCategoryName] = useState(isEditing ? categoryName : '');

    useEffect(() => {
        if (isEditing) {
            setNewCategoryName(categoryName);
            setSelectedColor(categoryColor);
            setSelectedIcon(categoryIcon);
        }
    }, [isEditing, categoryName, categoryColor, categoryIcon]);

    const validateCategoryInput = () => {
        if (!categoryId || !newCategoryName.trim()) {
          Alert.alert('Error', 'Category name is required');
          return false;
        }
        return true;
    };

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
        // ID 확인 (편집 모드에서만 필요)
        if (!categoryId) {
          Alert.alert('오류', '카테고리 정보를 찾을 수 없습니다.');
          return;
        }
        
        // 유효성 검사 실행
        if (!validateCategoryInput()) {
          return;
        }
        
        try {
          await updateCategory(
            categoryId,
            newCategoryName,
            selectedColor,
            selectedIcon
          );
          router.back();
        //   // 성공 후 처리
        //   Alert.alert('성공', '카테고리가 성공적으로 수정되었습니다.', [
        //     { text: '확인', onPress: () => router.back() }
        //   ]);
        } catch (error) {
          console.error('Error updating category:', error);
          // 에러는 context에서 처리됨
        }
      };


    return (
    <View style={styles.categoryModal}>

<View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>{isEditing? "카테고리 수정" : "새 카테고리 추가"}</Text>
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

    {isEditing ? (
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
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const API_URL = 'http://192.168.20.8:5001';

// 백엔드 스키마와 일치하도록 카테고리 수정
const CATEGORIES = [
  'lunch',
  'dinner',
];

export default function AddMenuScreen() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [type, setType] = useState('lunch'); // category에서 type으로 변경, 기본값 lunch
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddMenu = async () => {
    if (!name) {
      Alert.alert('오류', '메뉴 이름을 입력해주세요');
      return;
    }

    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      // 날짜를 ISO 문자열로 변환할 때 UTC 변환 없이 로컬 날짜 그대로 사용
      // 시간 부분은 정오(12:00:00)로 설정하여 표준화
      const localDate = new Date(date);
      const formattedDate = new Date(
        localDate.getFullYear(),
        localDate.getMonth(),
        localDate.getDate(),
        12, 0, 0 // 정오 시간으로 표준화
      ).toISOString();

      // 재료 문자열을 백엔드 스키마에 맞게 변환
      const ingredientsArray = ingredients
        .split(',')
        .map(item => item.trim())
        .filter(item => item !== '')
        .map(item => ({
          // 백엔드에서 기대하는 정확한 형식으로 변경
          name: item,
          quantity: 1,
          unit: ''
        }));

      console.log('날짜 전송:', formattedDate);
      console.log('재료 전송:', JSON.stringify(ingredientsArray));

      const menuData = {
        name,
        description,
        ingredients: ingredientsArray,
        type,
        date: formattedDate,
      };

      const response = await fetch(`${API_URL}/api/menu`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(menuData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API 오류 응답:', errorData);
        throw new Error(errorData.message || '메뉴 추가에 실패했습니다');
      }

      Alert.alert('성공', '메뉴가 성공적으로 추가되었습니다', [
        { text: '확인', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error adding menu:', error);
      Alert.alert('오류', '메뉴 추가에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>새 메뉴 추가</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.formContainer}>
        <Text style={styles.label}>메뉴 이름*</Text>
        <TextInput
          style={styles.input}
          placeholder="메뉴 이름을 입력하세요"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>설명</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="메뉴에 대한 설명을 입력하세요"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>재료</Text>
        <TextInput
          style={styles.input}
          placeholder="재료를 쉼표(,)로 구분하여 입력하세요"
          value={ingredients}
          onChangeText={setIngredients}
        />

        <Text style={styles.label}>날짜</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateButtonText}>
            {date.toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
          <Ionicons name="calendar" size={20} color="#666" />
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                setDate(selectedDate);
              }
            }}
          />
        )}

        <Text style={styles.label}>종류*</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryContainer}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, type === cat && styles.selectedChip]}
              onPress={() => setType(cat)}
            >
              <Text style={[styles.chipText, type === cat && styles.selectedChipText]}>
                {cat === 'lunch' ? '점심' : '저녁'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleAddMenu}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? '추가 중...' : '메뉴 추가'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
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
  formContainer: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ececec',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoryContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    paddingVertical: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedChip: {
    backgroundColor: '#e1f5fe',
    borderColor: '#29b6f6',
  },
  chipText: {
    color: '#555',
  },
  selectedChipText: {
    color: '#0288d1',
    fontWeight: '500',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ececec',
  },
  dateButtonText: {
    color: '#333',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#2E78B7',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  buttonDisabled: {
    backgroundColor: '#a0cbe8',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

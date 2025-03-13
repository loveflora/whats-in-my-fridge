import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../config/api';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

const MealCard = ({ meal, onPress }) => (
  <TouchableOpacity style={styles.mealCard} onPress={() => onPress(meal)}>
    <View style={styles.mealHeader}>
      <Text style={styles.mealType}>
        {meal.type.charAt(0).toUpperCase() + meal.type.slice(1)}
      </Text>
      <Text style={styles.mealTime}>
        {new Date(meal.date).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </View>
    <Text style={styles.mealName}>{meal.name}</Text>
    {meal.ingredients.length > 0 && (
      <Text style={styles.ingredientsCount}>
        {meal.ingredients.length} ingredients
      </Text>
    )}
  </TouchableOpacity>
);

export default function MenuPlannerScreen() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [meals, setMeals] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [markedDates, setMarkedDates] = useState({});
  const [newMeal, setNewMeal] = useState({
    name: '',
    type: 'lunch',
    date: new Date(),
    ingredients: [],
  });

  const fetchMeals = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(selectedDate);
      endDate.setHours(23, 59, 59, 999);

      const response = await fetch(
        `${API_ENDPOINTS.MENU}?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch meals');

      const data = await response.json();
      setMeals(data);

      // Update calendar marked dates
      const marked = {};
      data.forEach((meal) => {
        const date = new Date(meal.date).toISOString().split('T')[0];
        marked[date] = {
          marked: true,
          dotColor: '#2196F3',
        };
      });
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
      };
      setMarkedDates(marked);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  useEffect(() => {
    fetchMeals();
  }, [selectedDate]);

  const handleAddMeal = async () => {
    if (!newMeal.name) {
      Alert.alert('Error', 'Please enter a meal name');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const mealDate = new Date(selectedDate);
      mealDate.setHours(new Date().getHours(), new Date().getMinutes());

      const response = await fetch(API_ENDPOINTS.MENU, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newMeal,
          date: mealDate.toISOString(),
        }),
      });

      if (!response.ok) throw new Error('Failed to add meal');

      setModalVisible(false);
      setNewMeal({
        name: '',
        type: 'lunch',
        date: new Date(),
        ingredients: [],
      });
      fetchMeals();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDeleteMeal = async (meal) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.MENU}/${meal._id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete meal');

      fetchMeals();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Calendar
        current={selectedDate}
        onDayPress={(day) => setSelectedDate(day.dateString)}
        markedDates={markedDates}
        theme={{
          selectedDayBackgroundColor: '#2196F3',
          todayTextColor: '#2196F3',
          dotColor: '#2196F3',
        }}
      />

      <View style={styles.mealsContainer}>
        <Text style={styles.dateHeader}>
          {new Date(selectedDate).toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>

        <ScrollView style={styles.mealsList}>
          {meals
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map((meal) => (
              <MealCard
                key={meal._id}
                meal={meal}
                onPress={(meal) =>
                  Alert.alert(
                    'Meal Options',
                    'What would you like to do?',
                    [
                      {
                        text: 'Delete',
                        onPress: () => handleDeleteMeal(meal),
                        style: 'destructive',
                      },
                      { text: 'Cancel', style: 'cancel' },
                    ]
                  )
                }
              />
            ))}
        </ScrollView>
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Meal</Text>

            <TextInput
              style={styles.input}
              placeholder="Meal Name"
              value={newMeal.name}
              onChangeText={(text) => setNewMeal({ ...newMeal, name: text })}
            />

            <View style={styles.typeSelector}>
              {MEAL_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    newMeal.type === type && styles.typeButtonSelected,
                  ]}
                  onPress={() => setNewMeal({ ...newMeal, type })}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      newMeal.type === type && styles.typeButtonTextSelected,
                    ]}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.modalButton} onPress={handleAddMeal}>
              <Text style={styles.modalButtonText}>Add Meal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={[styles.modalButtonText, styles.cancelButtonText]}>
                Cancel
              </Text>
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
    backgroundColor: '#fff',
  },
  mealsContainer: {
    flex: 1,
    padding: 15,
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  mealsList: {
    flex: 1,
  },
  mealCard: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  mealType: {
    color: '#666',
    fontSize: 14,
  },
  mealTime: {
    color: '#666',
    fontSize: 14,
  },
  mealName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  ingredientsCount: {
    color: '#666',
    fontSize: 12,
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  typeButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2196F3',
    margin: 5,
  },
  typeButtonSelected: {
    backgroundColor: '#2196F3',
  },
  typeButtonText: {
    color: '#2196F3',
  },
  typeButtonTextSelected: {
    color: '#fff',
  },
  modalButton: {
    width: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  cancelButtonText: {
    color: '#2196F3',
  },
});

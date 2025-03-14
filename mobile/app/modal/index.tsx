import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ModalIndex() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>모달 메뉴</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.option} 
          onPress={() => router.push('/modal/addItem')}
        >
          <Ionicons name="add-circle-outline" size={24} color="#2E78B7" />
          <Text style={styles.optionText}>냉장고 아이템 추가</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.option} 
          onPress={() => router.push('/modal/addMenu')}
        >
          <Ionicons name="restaurant-outline" size={24} color="#2E78B7" />
          <Text style={styles.optionText}>메뉴 추가</Text>
        </TouchableOpacity>
      </View>
    </View>
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
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#ececec',
    borderRadius: 10,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
  },
  optionText: {
    fontSize: 16,
    marginLeft: 12,
    color: '#333',
  },
});

import { useState} from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    TextInput,
    Alert,
    Keyboard
  } from 'react-native';
  import { Ionicons } from '@expo/vector-icons';
  import AsyncStorage from '@react-native-async-storage/async-storage';
  import { router} from 'expo-router';


 import { API_URL } from '@/config/api';
  

  interface Category {
    _id: string;
    name: string;
    color: string;
    icon: string;
    owner: string;
  }

  interface FridgeItem {
    _id: string;
    name: string;
    quantity: number;
    unit: string;
    expiryDate: string;
    category: Category | string; // Updated to support both string and Category object
    favorite: boolean;
    completed: boolean;
  }

export default function Search({isDarkMode}: {isDarkMode: boolean}) {

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<FridgeItem[]>([]);
  
  
  // Search function
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }
  
    setIsSearching(true);
    
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }
  
      const response = await fetch(`${API_URL}/api/fridge/search?query=${encodeURIComponent(searchQuery.trim())}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to search items');
      }
  
      const results = await response.json();
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching items:', error);
      Alert.alert('Error', 'Failed to search items');
    }
  };
  
  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
    setSearchResults([]);
    Keyboard.dismiss();
  };
  


    return (
     <View style={[styles.searchContainer, isDarkMode && styles.darkSearchContainer]}>
     <Ionicons 
       name="search" 
       size={20} 
       color={isDarkMode ? '#999' : '#666'} 
       style={styles.searchIcon} 
     />
     <TextInput
       style={[
         styles.searchInput,
         isDarkMode && styles.darkSearchInput
       ]}
       placeholder="Search items..."
       placeholderTextColor={isDarkMode ? '#999' : '#999'}
       value={searchQuery}
       onChangeText={setSearchQuery}
       returnKeyType="search"
       onSubmitEditing={handleSearch}
     />
     {searchQuery.length > 0 && (
       <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
         <Ionicons 
           name="close-circle" 
           size={18} 
           color={isDarkMode ? '#999' : '#666'} 
         />
       </TouchableOpacity>
     )}
   </View>
   
    )
}

const styles = StyleSheet.create({

  // Search styles
searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  darkSearchContainer: {
    backgroundColor: '#333',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 8,
    color: '#333',
  },
  darkSearchInput: {
    color: '#fff',
  },
  searchIcon: {
    marginRight: 5,
  },
  clearButton: {
    padding: 5,
  },
  searchResultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  searchResultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  searchBackButton: {
    color: '#3478F6',
    fontSize: 16,
  },
  backToItemsButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#3478F6',
    borderRadius: 8,
  },
  backToItemsText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
})
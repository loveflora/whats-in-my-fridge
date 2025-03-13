// import React, { useState } from 'react';
// import {
//   StyleSheet,
//   View,
//   TextInput,
//   TouchableOpacity,
//   Text,
//   KeyboardAvoidingView,
//   Platform,
//   Alert,
//   ScrollView,
// } from 'react-native';
// import { router } from 'expo-router';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { Ionicons } from '@expo/vector-icons';
// import DateTimePicker from '@react-native-community/datetimepicker';

// const API_URL = 'http://192.168.20.8:5001';

// const CATEGORIES = [
//   'dairy',
//   'meat',
//   'vegetables',
//   'fruits',
//   'beverages',
//   'condiments',
//   'other',
// ];

// const UNITS = [
//   'pieces',
//   'grams',
//   'kilograms',
//   'milliliters',
//   'liters',
//   'cups',
//   'tablespoons',
//   'teaspoons',
// ];

// export default function AddItemScreen() {
//   const [name, setName] = useState('');
//   const [quantity, setQuantity] = useState('');
//   const [unit, setUnit] = useState('pieces');
//   const [category, setCategory] = useState('other');
//   const [expiryDate, setExpiryDate] = useState(new Date());
//   const [showDatePicker, setShowDatePicker] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);

//   const handleAddItem = async () => {
//     if (!name || !quantity) {
//       Alert.alert('Error', 'Please fill in all required fields');
//       return;
//     }

//     setIsLoading(true);
//     try {
//       const token = await AsyncStorage.getItem('userToken');
//       if (!token) {
//         router.replace('/auth/login');
//         return;
//       }

//       const response = await fetch(`${API_URL}/api/fridge/items`, {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           name,
//           quantity: Number(quantity),
//           unit,
//           category,
//           expiryDate: expiryDate.toISOString(),
//           fridge: '65f0f1234567890123456789', // 임시 fridge ID 추가
//         }),
//       });

//       if (!response.ok) {
//         throw new Error('Failed to add item');
//       }

//       router.back();
//     } catch (error) {
//       const errorMessage = error instanceof Error ? error.message : 'Failed to add item';
//       Alert.alert('Error', errorMessage);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <KeyboardAvoidingView
//       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//       style={styles.container}
//     >
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
//           <Ionicons name="close" size={24} color="#000" />
//         </TouchableOpacity>
//         <Text style={styles.title}>Add New Item</Text>
//         <View style={styles.closeButton} />
//       </View>

//       <ScrollView style={styles.formContainer}>
//         <TextInput
//           style={styles.input}
//           placeholder="Item Name"
//           value={name}
//           onChangeText={setName}
//         />

//         <View style={styles.row}>
//           <TextInput
//             style={[styles.input, styles.flex1]}
//             placeholder="Quantity"
//             value={quantity}
//             onChangeText={setQuantity}
//             keyboardType="numeric"
//           />
//           <View style={[styles.pickerContainer, styles.flex1]}>
//             <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//               {UNITS.map((u) => (
//                 <TouchableOpacity
//                   key={u}
//                   style={[styles.chip, unit === u && styles.selectedChip]}
//                   onPress={() => setUnit(u)}
//                 >
//                   <Text style={[styles.chipText, unit === u && styles.selectedChipText]}>
//                     {u}
//                   </Text>
//                 </TouchableOpacity>
//               ))}
//             </ScrollView>
//           </View>
//         </View>

//         <Text style={styles.label}>Category</Text>
//         <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryContainer}>
//           {CATEGORIES.map((cat) => (
//             <TouchableOpacity
//               key={cat}
//               style={[styles.chip, category === cat && styles.selectedChip]}
//               onPress={() => setCategory(cat)}
//             >
//               <Text style={[styles.chipText, category === cat && styles.selectedChipText]}>
//                 {cat}
//               </Text>
//             </TouchableOpacity>
//           ))}
//         </ScrollView>

//         <Text style={styles.label}>Expiry Date</Text>
//         <TouchableOpacity
//           style={styles.dateButton}
//           onPress={() => setShowDatePicker(true)}
//         >
//           <Text style={styles.dateButtonText}>
//             {expiryDate.toLocaleDateString()}
//           </Text>
//         </TouchableOpacity>

//         {showDatePicker && (
//           <DateTimePicker
//             value={expiryDate}
//             mode="date"
//             display="default"
//             onChange={(event, selectedDate) => {
//               setShowDatePicker(false);
//               if (selectedDate) {
//                 setExpiryDate(selectedDate);
//               }
//             }}
//             minimumDate={new Date()}
//           />
//         )}

//         <TouchableOpacity
//           style={[styles.button, isLoading && styles.buttonDisabled]}
//           onPress={handleAddItem}
//           disabled={isLoading}
//         >
//           <Text style={styles.buttonText}>
//             {isLoading ? 'Adding...' : 'Add Item'}
//           </Text>
//         </TouchableOpacity>
//       </ScrollView>
//     </KeyboardAvoidingView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     padding: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#f0f0f0',
//   },
//   title: {
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
//   closeButton: {
//     width: 40,
//     height: 40,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   formContainer: {
//     padding: 16,
//   },
//   input: {
//     backgroundColor: '#f5f5f5',
//     borderRadius: 8,
//     padding: 12,
//     marginBottom: 16,
//     fontSize: 16,
//   },
//   row: {
//     flexDirection: 'row',
//     marginBottom: 16,
//   },
//   flex1: {
//     flex: 1,
//   },
//   pickerContainer: {
//     marginLeft: 8,
//   },
//   label: {
//     fontSize: 16,
//     fontWeight: '600',
//     marginBottom: 8,
//   },
//   categoryContainer: {
//     marginBottom: 16,
//   },
//   chip: {
//     backgroundColor: '#f0f0f0',
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 16,
//     marginRight: 8,
//     marginBottom: 8,
//   },
//   selectedChip: {
//     backgroundColor: '#3478F6',
//   },
//   chipText: {
//     fontSize: 14,
//     color: '#333',
//   },
//   selectedChipText: {
//     color: '#fff',
//   },
//   dateButton: {
//     backgroundColor: '#f5f5f5',
//     borderRadius: 8,
//     padding: 12,
//     marginBottom: 16,
//   },
//   dateButtonText: {
//     fontSize: 16,
//   },
//   button: {
//     backgroundColor: '#3478F6',
//     borderRadius: 8,
//     padding: 16,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginVertical: 16,
//   },
//   buttonDisabled: {
//     backgroundColor: '#a0a0a0',
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
// });

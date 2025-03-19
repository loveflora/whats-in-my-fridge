// import React, { useState, useEffect } from 'react';
// import {
//   StyleSheet,
//   View,
//   FlatList,
//   Text,
//   TouchableOpacity,
//   RefreshControl,
//   Alert,
//   Modal,
//   TextInput,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { API_ENDPOINTS } from '../config/api';

// const CATEGORIES = [
//   'dairy',
//   'meat',
//   'vegetables',
//   'fruits',
//   'beverages',
//   'condiments',
//   'other',
// ];

// const FridgeItem = ({ item, onPress }) => {
//   const daysUntilExpiry = Math.ceil(
//     (new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
//   );

//   const getExpiryColor = () => {
//     if (daysUntilExpiry <= 0) return '#FF5252';
//     if (daysUntilExpiry <= 3) return '#FFC107';
//     return '#4CAF50';
//   };

//   return (
//     <TouchableOpacity style={styles.itemCard} onPress={() => onPress(item)}>
//       <View style={[styles.expiryIndicator, { backgroundColor: getExpiryColor() }]} />
//       <Text style={styles.itemName} numberOfLines={1}>
//         {item.name}
//       </Text>
//       <Text style={styles.itemQuantity}>
//         {item.quantity} {item.unit}
//       </Text>
//       <Text style={[styles.expiryText, { color: getExpiryColor() }]}>
//         {daysUntilExpiry <= 0
//           ? 'Expired'
//           : daysUntilExpiry === 1
//           ? '1 day left'
//           : `${daysUntilExpiry} days left`}
//       </Text>
//     </TouchableOpacity>
//   );
// };

// export default function FridgeScreen() {
//   const [items, setItems] = useState([]);
//   const [refreshing, setRefreshing] = useState(false);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [newItem, setNewItem] = useState({
//     name: '',
//     quantity: '',
//     unit: '',
//     category: 'other',
//     expiryDate: new Date(),
//   });

//   const fetchItems = async () => {
//     try {
//       const token = await AsyncStorage.getItem('token');
//       const response = await fetch(API_ENDPOINTS.FRIDGE_ITEMS, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       if (!response.ok) throw new Error('Failed to fetch items');

//       const data = await response.json();
//       setItems(data);
//     } catch (error) {
//       Alert.alert('Error', error.message);
//     }
//   };

//   useEffect(() => {
//     fetchItems();
//   }, []);

//   const handleRefresh = async () => {
//     setRefreshing(true);
//     await fetchItems();
//     setRefreshing(false);
//   };

//   const handleAddItem = async () => {
//     try {
//       const token = await AsyncStorage.getItem('token');
//       const response = await fetch(API_ENDPOINTS.FRIDGE_ITEMS, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(newItem),
//       });

//       if (!response.ok) throw new Error('Failed to add item');

//       setModalVisible(false);
//       setNewItem({
//         name: '',
//         quantity: '',
//         unit: '',
//         category: 'other',
//         expiryDate: new Date(),
//       });
//       fetchItems();
//     } catch (error) {
//       Alert.alert('Error', error.message);
//     }
//   };

//   const handleDeleteItem = async (item) => {
//     try {
//       const token = await AsyncStorage.getItem('token');
//       const response = await fetch(`${API_ENDPOINTS.FRIDGE_ITEMS}/${item._id}`, {
//         method: 'DELETE',
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       if (!response.ok) throw new Error('Failed to delete item');

//       fetchItems();
//     } catch (error) {
//       Alert.alert('Error', error.message);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <FlatList
//         data={items}
//         renderItem={({ item }) => (
//           <FridgeItem
//             item={item}
//             onPress={(item) =>
//               Alert.alert(
//                 'Item Options',
//                 'What would you like to do?',
//                 [
//                   {
//                     text: 'Delete',
//                     onPress: () => handleDeleteItem(item),
//                     style: 'destructive',
//                   },
//                   { text: 'Cancel', style: 'cancel' },
//                 ]
//               )
//             }
//           />
//         )}
//         keyExtractor={(item) => item._id}
//         numColumns={2}
//         contentContainerStyle={styles.list}
//         refreshControl={
//           <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
//         }
//       />

//       <TouchableOpacity
//         style={styles.addButton}
//         onPress={() => setModalVisible(true)}
//       >
//         <Ionicons name="add" size={30} color="#fff" />
//       </TouchableOpacity>

//       <Modal
//         animationType="slide"
//         transparent={true}
//         visible={modalVisible}
//         onRequestClose={() => setModalVisible(false)}
//       >
//         <View style={styles.modalContainer}>
//           <View style={styles.modalContent}>
//             <Text style={styles.modalTitle}>Add New Item</Text>
            
//             <TextInput
//               style={styles.input}
//               placeholder="Item Name"
//               value={newItem.name}
//               onChangeText={(text) => setNewItem({ ...newItem, name: text })}
//             />
            
//             <View style={styles.quantityContainer}>
//               <TextInput
//                 style={[styles.input, { flex: 1 }]}
//                 placeholder="Quantity"
//                 keyboardType="numeric"
//                 value={newItem.quantity}
//                 onChangeText={(text) => setNewItem({ ...newItem, quantity: text })}
//               />
//               <TextInput
//                 style={[styles.input, { flex: 1, marginLeft: 10 }]}
//                 placeholder="Unit (e.g., kg, pcs)"
//                 value={newItem.unit}
//                 onChangeText={(text) => setNewItem({ ...newItem, unit: text })}
//               />
//             </View>

//             <TouchableOpacity
//               style={styles.modalButton}
//               onPress={handleAddItem}
//             >
//               <Text style={styles.modalButtonText}>Add Item</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={[styles.modalButton, styles.cancelButton]}
//               onPress={() => setModalVisible(false)}
//             >
//               <Text style={[styles.modalButtonText, styles.cancelButtonText]}>
//                 Cancel
//               </Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   list: {
//     padding: 10,
//   },
//   itemCard: {
//     flex: 1,
//     margin: 5,
//     padding: 15,
//     backgroundColor: '#fff',
//     borderRadius: 10,
//     elevation: 3,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//     minHeight: 120,
//   },
//   expiryIndicator: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     position: 'absolute',
//     top: 10,
//     right: 10,
//   },
//   itemName: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     marginBottom: 5,
//   },
//   itemQuantity: {
//     fontSize: 14,
//     color: '#666',
//     marginBottom: 5,
//   },
//   expiryText: {
//     fontSize: 12,
//     marginTop: 'auto',
//   },
//   addButton: {
//     position: 'absolute',
//     right: 20,
//     bottom: 20,
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     backgroundColor: '#2196F3',
//     justifyContent: 'center',
//     alignItems: 'center',
//     elevation: 5,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//   },
//   modalContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//   },
//   modalContent: {
//     width: '90%',
//     backgroundColor: '#fff',
//     borderRadius: 20,
//     padding: 20,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 4,
//     elevation: 5,
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     marginBottom: 20,
//   },
//   input: {
//     width: '100%',
//     backgroundColor: '#F5F5F5',
//     borderRadius: 10,
//     padding: 15,
//     marginBottom: 15,
//     fontSize: 16,
//   },
//   quantityContainer: {
//     flexDirection: 'row',
//     width: '100%',
//   },
//   modalButton: {
//     width: '100%',
//     backgroundColor: '#2196F3',
//     borderRadius: 10,
//     padding: 15,
//     alignItems: 'center',
//     marginTop: 10,
//   },
//   modalButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   cancelButton: {
//     backgroundColor: '#fff',
//     borderWidth: 1,
//     borderColor: '#2196F3',
//   },
//   cancelButtonText: {
//     color: '#2196F3',
//   },
// });

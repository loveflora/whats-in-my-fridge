import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppContext } from '@/context/AppContext';

const API_URL = 'http://192.168.20.8:5001';

interface ShoppingItem {
  _id: string;
  name: string;
  quantity: number;
  unit: string;
  completed: boolean;
  listId: string;
  createdAt: string;
}

interface ShoppingList {
  _id: string;
  name: string;
  createdAt: string;
}

export default function ShoppingListScreen() {
  const { settings } = useAppContext();
  const isDarkMode = settings.theme === 'dark';

  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [currentList, setCurrentList] = useState<ShoppingList | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Item modal state
  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('pieces');
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);

  // List modal state
  const [listModalVisible, setListModalVisible] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [editingList, setEditingList] = useState<ShoppingList | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchLists();
    }, [])
  );

  const fetchLists = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      const response = await fetch(`${API_URL}/api/shopping/lists`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(response);

      if (!response.ok) {
        throw new Error('Failed to fetch shopping lists');
      }

      const data = await response.json();
      setLists(data);

      // Select the first list if available and no list is currently selected
      if (data.length > 0 && !currentList) {
        setCurrentList(data[0]);
        fetchItems(data[0]._id);
      } else if (currentList) {
        // If we have a current list, refresh its items
        fetchItems(currentList._id);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching shopping lists:', error);
      Alert.alert('Error', 'Failed to load shopping lists');
      setLoading(false);
    }
  };

  const fetchItems = async (listId: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      const response = await fetch(`${API_URL}/api/shopping/items?listId=${listId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch shopping items');
      }

      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error('Error fetching shopping items:', error);
      Alert.alert('Error', 'Failed to load shopping items');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    if (currentList) {
      fetchItems(currentList._id);
    } else {
      fetchLists();
    }
  };

  const toggleItemStatus = async (id: string, completed: boolean) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      const response = await fetch(`${API_URL}/api/shopping/items/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          completed: !completed,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update item status');
      }

      // Update local state
      setItems(
        items.map((item) =>
          item._id === id ? { ...item, completed: !completed } : item
        )
      );
    } catch (error) {
      console.error('Error updating item status:', error);
      Alert.alert('Error', 'Failed to update item status');
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      const response = await fetch(`${API_URL}/api/shopping/items/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete item');
      }

      // Update local state
      setItems(items.filter((item) => item._id !== id));
    } catch (error) {
      console.error('Error deleting item:', error);
      Alert.alert('Error', 'Failed to delete item');
    }
  };

  const handleAddOrEditItem = async () => {
    if (!newItemName || !newItemQuantity) {
      Alert.alert('Error', 'Please enter item name and quantity');
      return;
    }

    if (!currentList) {
      Alert.alert('Error', 'No shopping list selected');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      let response;
      if (editingItem) {
        // Update existing item
        response = await fetch(`${API_URL}/api/shopping/items/${editingItem._id}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: newItemName,
            quantity: Number(newItemQuantity),
            unit: newItemUnit,
          }),
        });
      } else {
        // Add new item
        response = await fetch(`${API_URL}/api/shopping/items`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: newItemName,
            quantity: Number(newItemQuantity),
            unit: newItemUnit,
            completed: false,
            listId: currentList._id,
          }),
        });
      }

      if (!response.ok) {
        throw new Error(
          `Failed to ${editingItem ? 'update' : 'add'} shopping item`
        );
      }

      // Clear form and close modal
      setNewItemName('');
      setNewItemQuantity('');
      setNewItemUnit('pieces');
      setEditingItem(null);
      setItemModalVisible(false);

      // Refresh the list
      if (currentList) {
        fetchItems(currentList._id);
      }
    } catch (error) {
      console.error('Error adding/editing item:', error);
      Alert.alert(
        'Error',
        `Failed to ${editingItem ? 'update' : 'add'} shopping item`
      );
    }
  };

  const handleAddOrEditList = async () => {
    if (!newListName) {
      Alert.alert('Error', 'Please enter a list name');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      let response;
      if (editingList) {
        // Update existing list
        response = await fetch(`${API_URL}/api/shopping/lists/${editingList._id}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: newListName,
          }),
        });
      } else {
        // Add new list
        response = await fetch(`${API_URL}/api/shopping/lists`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: newListName,
          }),
        });
      }

      if (!response.ok) {
        throw new Error(
          `Failed to ${editingList ? 'update' : 'add'} shopping list`
        );
      }

      // Clear form and close modal
      setNewListName('');
      setEditingList(null);
      setListModalVisible(false);

      // Refresh the lists
      await fetchLists();
    } catch (error) {
      console.error('Error adding/editing list:', error);
      Alert.alert(
        'Error',
        `Failed to ${editingList ? 'update' : 'add'} shopping list`
      );
    }
  };

  const handleDeleteList = async (id: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      const response = await fetch(`${API_URL}/api/shopping/lists/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete list');
      }

      // Update local state
      const updatedLists = lists.filter((list) => list._id !== id);
      setLists(updatedLists);

      // If the current list was deleted, select the first available list
      if (currentList && currentList._id === id) {
        if (updatedLists.length > 0) {
          setCurrentList(updatedLists[0]);
          fetchItems(updatedLists[0]._id);
        } else {
          setCurrentList(null);
          setItems([]);
        }
      }
    } catch (error) {
      console.error('Error deleting list:', error);
      Alert.alert('Error', 'Failed to delete list');
    }
  };

  const openEditItemModal = (item: ShoppingItem) => {
    setEditingItem(item);
    setNewItemName(item.name);
    setNewItemQuantity(item.quantity.toString());
    setNewItemUnit(item.unit);
    setItemModalVisible(true);
  };

  const openEditListModal = (list: ShoppingList) => {
    setEditingList(list);
    setNewListName(list.name);
    setListModalVisible(true);
  };

  const renderItem = ({ item }: { item: ShoppingItem }) => {
    return (
      <View style={[styles.itemContainer, isDarkMode && styles.darkItemContainer]}>
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => toggleItemStatus(item._id, item.completed)}
        >
          <Ionicons
            name={item.completed ? 'checkbox' : 'square-outline'}
            size={24}
            color={isDarkMode ? '#fff' : '#3478F6'}
          />
        </TouchableOpacity>
        <View style={styles.itemInfo}>
          <Text
            style={[
              styles.itemName,
              item.completed && styles.completedItemText,
              isDarkMode && styles.darkText,
              item.completed && isDarkMode && styles.darkPurchasedText,
            ]}
          >
            {item.name}
          </Text>
          <Text
            style={[
              styles.itemDetails,
              isDarkMode && styles.darkText,
            ]}
          >
            {item.quantity} {item.unit}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => openEditItemModal(item)}
        >
          <Ionicons name="pencil" size={20} color={isDarkMode ? '#fff' : '#3478F6'} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteItem(item._id)}
        >
          <Ionicons name="trash-outline" size={20} color="#FF0000" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderAddEditItemModal = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={itemModalVisible}
        onRequestClose={() => {
          setItemModalVisible(false);
          setEditingItem(null);
          setNewItemName('');
          setNewItemQuantity('');
          setNewItemUnit('pieces');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDarkMode && styles.darkModalContent]}>
            <View style={styles.modalHeader}>
              <Text
                style={[
                  styles.modalTitle,
                  isDarkMode && styles.darkText,
                ]}
              >
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setItemModalVisible(false);
                  setEditingItem(null);
                  setNewItemName('');
                  setNewItemQuantity('');
                  setNewItemUnit('pieces');
                }}
              >
                <Ionicons name="close" size={24} color={isDarkMode ? '#fff' : '#000'} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[
                styles.input,
                isDarkMode && styles.darkTextInput,
              ]}
              placeholder="Item Name"
              value={newItemName}
              onChangeText={setNewItemName}
            />

            <View style={styles.row}>
              <TextInput
                style={[
                  styles.input,
                  styles.flex1,
                  isDarkMode && styles.darkTextInput,
                ]}
                placeholder="Quantity"
                value={newItemQuantity}
                onChangeText={setNewItemQuantity}
                keyboardType="numeric"
              />

              <View style={[styles.unitSelector, styles.flex1]}>
                <TouchableOpacity
                  style={[
                    styles.unitButton,
                    newItemUnit === 'pieces' && styles.selectedUnit,
                  ]}
                  onPress={() => setNewItemUnit('pieces')}
                >
                  <Text
                    style={[
                      styles.unitText,
                      newItemUnit === 'pieces' && styles.selectedUnitText,
                    ]}
                  >
                    pcs
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.unitButton,
                    newItemUnit === 'grams' && styles.selectedUnit,
                  ]}
                  onPress={() => setNewItemUnit('grams')}
                >
                  <Text
                    style={[
                      styles.unitText,
                      newItemUnit === 'grams' && styles.selectedUnitText,
                    ]}
                  >
                    g
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.unitButton,
                    newItemUnit === 'liters' && styles.selectedUnit,
                  ]}
                  onPress={() => setNewItemUnit('liters')}
                >
                  <Text
                    style={[
                      styles.unitText,
                      newItemUnit === 'liters' && styles.selectedUnitText,
                    ]}
                  >
                    L
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleAddOrEditItem}
            >
              <Text
                style={[
                  styles.saveButtonText,
                  isDarkMode && styles.darkText,
                ]}
              >
                {editingItem ? 'Save Changes' : 'Add Item'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const renderAddEditListModal = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={listModalVisible}
        onRequestClose={() => {
          setListModalVisible(false);
          setEditingList(null);
          setNewListName('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDarkMode && styles.darkModalContent]}>
            <View style={styles.modalHeader}>
              <Text
                style={[
                  styles.modalTitle,
                  isDarkMode && styles.darkText,
                ]}
              >
                {editingList ? 'Edit List' : 'Create New Shopping List'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setListModalVisible(false);
                  setEditingList(null);
                  setNewListName('');
                }}
              >
                <Ionicons name="close" size={24} color={isDarkMode ? '#fff' : '#000'} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[
                styles.input,
                isDarkMode && styles.darkTextInput,
              ]}
              placeholder="List Name"
              value={newListName}
              onChangeText={setNewListName}
            />

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleAddOrEditList}
            >
              <Text
                style={[
                  styles.saveButtonText,
                  isDarkMode && styles.darkText,
                ]}
              >
                {editingList ? 'Save Changes' : 'Create List'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const renderListSelector = () => {
    if (lists.length === 0) {
      return null;
    }

    return (
      <View style={styles.listSelectorContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {lists.map((list) => (
            <TouchableOpacity
              key={list._id}
              style={[
                styles.listTab,
                currentList && currentList._id === list._id && styles.activeListTab,
              ]}
              onPress={() => {
                setCurrentList(list);
                fetchItems(list._id);
              }}
            >
              <Text
                style={[
                  styles.listTabText,
                  currentList && currentList._id === list._id && styles.activeListTabText,
                  isDarkMode && styles.darkText,
                ]}
              >
                {list.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3478F6" />
        <Text
          style={[
            styles.loadingText,
            isDarkMode && styles.darkText,
          ]}
        >
          Loading shopping lists...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDarkMode && styles.darkContainer]}>
      <View style={styles.header}>
        <Text
          style={[
            styles.title,
            isDarkMode && styles.darkText,
          ]}
        >
          Shopping Lists
        </Text>
        <TouchableOpacity
          style={styles.addListButton}
          onPress={() => {
            setEditingList(null);
            setNewListName('');
            setListModalVisible(true);
          }}
        >
          <Ionicons name="add-circle" size={24} color={isDarkMode ? '#fff' : '#3478F6'} />
        </TouchableOpacity>
      </View>

      {renderListSelector()}

      {currentList ? (
        <>
          <View style={styles.currentListHeader}>
            <Text
              style={[
                styles.currentListTitle,
                isDarkMode && styles.darkText,
              ]}
            >
              {currentList.name}
            </Text>
            <View style={styles.listActions}>
              <TouchableOpacity
                style={styles.listAction}
                onPress={() => openEditListModal(currentList)}
              >
                <Ionicons name="pencil" size={18} color={isDarkMode ? '#fff' : '#3478F6'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.listAction}
                onPress={() => {
                  Alert.alert(
                    'Delete List',
                    `Are you sure you want to delete "${currentList.name}"?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => handleDeleteList(currentList._id),
                      },
                    ]
                  );
                }}
              >
                <Ionicons name="trash" size={18} color="#FF0000" />
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="basket-outline" size={64} color={isDarkMode ? '#555' : '#ccc'} />
                <Text
                  style={[
                    styles.emptyText,
                    isDarkMode && styles.darkText,
                  ]}
                >
                  No items in this list
                </Text>
                <Text
                  style={[
                    styles.emptySubtext,
                    isDarkMode && styles.darkText,
                  ]}
                >
                  Tap the + button to add items
                </Text>
              </View>
            }
          />

          <View style={styles.fabContainer}>
            <TouchableOpacity
              style={styles.fab}
              onPress={() => {
                setEditingItem(null);
                setNewItemName('');
                setNewItemQuantity('');
                setNewItemUnit('pieces');
                setItemModalVisible(true);
              }}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="list-outline" size={64} color={isDarkMode ? '#555' : '#ccc'} />
          <Text
            style={[
              styles.emptyText,
              isDarkMode && styles.darkText,
            ]}
          >
            No shopping lists
          </Text>
          <Text
            style={[
              styles.emptySubtext,
              isDarkMode && styles.darkText,
            ]}
          >
            Tap the + button to create your first list
          </Text>
        </View>
      )}

      {renderAddEditItemModal()}
      {renderAddEditListModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  darkText: {
    color: '#fff',
  },
  addListButton: {
    padding: 8,
  },
  listSelectorContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 8,
  },
  listTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  activeListTab: {
    backgroundColor: '#3478F6',
  },
  listTabText: {
    fontSize: 14,
    color: '#333',
  },
  activeListTabText: {
    color: '#fff',
    fontWeight: '500',
  },
  currentListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
  },
  currentListTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  listActions: {
    flexDirection: 'row',
  },
  listAction: {
    padding: 8,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  darkItemContainer: {
    backgroundColor: '#2c2c2c',
  },
  checkboxContainer: {
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  completedItemText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  darkPurchasedText: {
    color: '#888',
  },
  itemDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  editButton: {
    padding: 8,
    marginRight: 8,
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  fabContainer: {
    position: 'absolute',
    right: 24,
    bottom: 24,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3478F6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  darkModalContent: {
    backgroundColor: '#2c2c2c',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color: '#333',
  },
  darkTextInput: {
    backgroundColor: '#3c3c3c',
    color: '#fff',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  flex1: {
    flex: 1,
  },
  unitSelector: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  unitButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    marginRight: 4,
    borderRadius: 8,
  },
  selectedUnit: {
    backgroundColor: '#3478F6',
  },
  unitText: {
    color: '#333',
  },
  selectedUnitText: {
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#3478F6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

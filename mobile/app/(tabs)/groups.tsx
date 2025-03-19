// import React, { useState, useEffect } from 'react';
// import {
//   StyleSheet,
//   View,
//   Text,
//   TouchableOpacity,
//   Alert,
//   Modal,
//   TextInput,
//   ActivityIndicator,
//   ScrollView,
//   FlatList,
//   Clipboard,
//   Share
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { Stack } from 'expo-router';
// import { useAppContext } from '@/context/AppContext';

// import { API_URL } from "@/config/api"

// interface GroupMember {
//   id: string;
//   name: string;
//   email: string;
// }

// interface Group {
//   id: string;
//   name: string;
//   owner: GroupMember;
//   memberCount: number;
//   inviteCode: string;
//   inviteLink: string;
// }

// export default function GroupsScreen() {
//   const { settings } = useAppContext();
//   const darkMode = settings.theme === 'dark';
  
//   const [groups, setGroups] = useState<Group[]>([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [createModalVisible, setCreateModalVisible] = useState(false);
//   const [inviteModalVisible, setInviteModalVisible] = useState(false);
//   const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  
//   const [newGroupName, setNewGroupName] = useState('');
  
//   useEffect(() => {
//     fetchMyGroups();
//   }, []);
  
//   const fetchMyGroups = async () => {
//     setIsLoading(true);
//     try {
//       const token = await AsyncStorage.getItem('userToken');
//       if (!token) {
//         return;
//       }
      
//       const response = await fetch(`${API_URL}/api/groups/my-groups`, {
//         method: 'GET',
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       });
      
//       const data = await response.json();
      
//       if (response.ok) {
//         setGroups(data.groups);
//       } else {
//         Alert.alert('Error', data.message || 'Failed to fetch groups');
//       }
//     } catch (error) {
//       console.error('Error fetching groups:', error);
//       Alert.alert('Error', 'Failed to load your groups');
//     } finally {
//       setIsLoading(false);
//     }
//   };
  
//   const handleCreateGroup = async () => {
//     if (!newGroupName.trim()) {
//       Alert.alert('Error', 'Please enter a group name');
//       return;
//     }
    
//     setIsLoading(true);
//     try {
//       const token = await AsyncStorage.getItem('userToken');
//       if (!token) {
//         return;
//       }
      
//       // 현재는 냉장고 ID를 하드코딩, 실제 앱에서는 선택 가능하게 해야 함
//       const fridgeId = 'default-fridge-id';
      
//       const response = await fetch(`${API_URL}/api/groups`, {
//         method: 'POST',
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           name: newGroupName,
//           fridgeId
//         }),
//       });
      
//       const data = await response.json();
      
//       if (response.ok) {
//         fetchMyGroups(); // 그룹 목록 새로고침
//         setNewGroupName('');
//         setCreateModalVisible(false);
//         Alert.alert('Success', 'Group created successfully');
//       } else {
//         Alert.alert('Error', data.message || 'Failed to create group');
//       }
//     } catch (error) {
//       console.error('Error creating group:', error);
//       Alert.alert('Error', 'Failed to create group');
//     } finally {
//       setIsLoading(false);
//     }
//   };
  
//   const handleGenerateNewInviteCode = async (groupId: string) => {
//     setIsLoading(true);
//     try {
//       const token = await AsyncStorage.getItem('userToken');
//       if (!token) {
//         return;
//       }
      
//       const response = await fetch(`${API_URL}/api/groups/${groupId}/regenerate-invite`, {
//         method: 'POST',
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       });
      
//       const data = await response.json();
      
//       if (response.ok) {
//         fetchMyGroups(); // 그룹 목록 새로고침
//         if (selectedGroup && selectedGroup.id === groupId) {
//           setSelectedGroup({
//             ...selectedGroup,
//             inviteCode: data.inviteCode,
//             inviteLink: data.inviteLink
//           });
//         }
//         Alert.alert('Success', 'New invite code generated');
//       } else {
//         Alert.alert('Error', data.message || 'Failed to generate new invite code');
//       }
//     } catch (error) {
//       console.error('Error generating invite code:', error);
//       Alert.alert('Error', 'Failed to generate new invite code');
//     } finally {
//       setIsLoading(false);
//     }
//   };
  
//   const handleCopyInviteLink = (inviteLink: string) => {
//     Clipboard.setString(inviteLink);
//     Alert.alert('Success', 'Invite link copied to clipboard');
//   };
  
//   const handleShareInviteLink = async (group: Group) => {
//     try {
//       await Share.share({
//         message: `Join my fridge group "${group.name}" in What's in my Fridge app! ${group.inviteLink}`,
//         title: `Join ${group.name}`,
//       });
//     } catch (error) {
//       console.error('Error sharing invite link:', error);
//       Alert.alert('Error', 'Failed to share invite link');
//     }
//   };
  
//   const renderGroupItem = ({ item }: { item: Group }) => (
//     <TouchableOpacity 
//       style={[styles.groupItem, darkMode && styles.darkGroupItem]}
//       onPress={() => {
//         setSelectedGroup(item);
//         setInviteModalVisible(true);
//       }}
//     >
//       <View style={styles.groupInfo}>
//         <Text style={[styles.groupName, darkMode && styles.darkText]}>{item.name}</Text>
//         <Text style={[styles.groupMembers, darkMode && styles.darkSecondaryText]}>{item.memberCount} members</Text>
//       </View>
//       <Ionicons name="chevron-forward" size={20} color={darkMode ? "#888" : "#ccc"} />
//     </TouchableOpacity>
//   );
  
//   return (
//     <View style={[styles.container, darkMode && styles.darkContainer]}>
//       <Stack.Screen 
//         options={{
//           title: 'My Groups',
//           headerStyle: {
//             backgroundColor: darkMode ? '#1a1a1a' : '#fff',
//           },
//           headerTintColor: darkMode ? '#fff' : '#000',
//         }} 
//       />
      
//       {isLoading && groups.length === 0 ? (
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#2E78B7" />
//           <Text style={[styles.loadingText, darkMode && styles.darkText]}>Loading groups...</Text>
//         </View>
//       ) : groups.length === 0 ? (
//         <View style={styles.emptyContainer}>
//           <Ionicons name="people-outline" size={60} color={darkMode ? "#888" : "#ccc"} />
//           <Text style={[styles.emptyText, darkMode && styles.darkText]}>You don't have any groups yet</Text>
//           <Text style={[styles.emptySubtext, darkMode && styles.darkSecondaryText]}>
//             Create a group to share your fridge with friends and family
//           </Text>
//         </View>
//       ) : (
//         <FlatList
//           data={groups}
//           renderItem={renderGroupItem}
//           keyExtractor={(item) => item.id}
//           contentContainerStyle={styles.listContent}
//         />
//       )}
      
//       <TouchableOpacity 
//         style={styles.fab}
//         onPress={() => setCreateModalVisible(true)}
//       >
//         <Ionicons name="add" size={24} color="#fff" />
//       </TouchableOpacity>
      
//       {/* Create Group Modal */}
//       <Modal
//         animationType="slide"
//         transparent={true}
//         visible={createModalVisible}
//         onRequestClose={() => setCreateModalVisible(false)}
//       >
//         <View style={styles.modalOverlay}>
//           <View style={[styles.modalContent, darkMode && styles.darkModalContent]}>
//             <View style={styles.modalHeader}>
//               <Text style={[styles.modalTitle, darkMode && styles.darkText]}>Create New Group</Text>
//               <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
//                 <Ionicons name="close" size={24} color={darkMode ? "#fff" : "#000"} />
//               </TouchableOpacity>
//             </View>
            
//             <Text style={[styles.label, darkMode && styles.darkText]}>Group Name</Text>
//             <TextInput
//               style={[styles.input, darkMode && styles.darkInput]}
//               placeholder="Enter group name"
//               placeholderTextColor={darkMode ? "#888" : "#999"}
//               value={newGroupName}
//               onChangeText={setNewGroupName}
//             />
            
//             <TouchableOpacity
//               style={styles.button}
//               onPress={handleCreateGroup}
//               disabled={isLoading}
//             >
//               {isLoading ? (
//                 <ActivityIndicator size="small" color="#fff" />
//               ) : (
//                 <Text style={styles.buttonText}>Create Group</Text>
//               )}
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>
      
//       {/* Invite Friends Modal */}
//       <Modal
//         animationType="slide"
//         transparent={true}
//         visible={inviteModalVisible}
//         onRequestClose={() => setInviteModalVisible(false)}
//       >
//         <View style={styles.modalOverlay}>
//           <View style={[styles.modalContent, darkMode && styles.darkModalContent]}>
//             <View style={styles.modalHeader}>
//               <Text style={[styles.modalTitle, darkMode && styles.darkText]}>
//                 {selectedGroup ? selectedGroup.name : 'Group'} Invite
//               </Text>
//               <TouchableOpacity onPress={() => setInviteModalVisible(false)}>
//                 <Ionicons name="close" size={24} color={darkMode ? "#fff" : "#000"} />
//               </TouchableOpacity>
//             </View>
            
//             {selectedGroup && (
//               <>
//                 <View style={styles.inviteCodeContainer}>
//                   <Text style={[styles.label, darkMode && styles.darkText]}>Invite Code:</Text>
//                   <Text style={[styles.inviteCode, darkMode && styles.darkText]}>
//                     {selectedGroup.inviteCode}
//                   </Text>
//                 </View>
                
//                 <View style={styles.inviteLinkContainer}>
//                   <Text style={[styles.label, darkMode && styles.darkText]}>Invite Link:</Text>
//                   <Text style={[styles.inviteLink, darkMode && styles.darkSecondaryText]} numberOfLines={1} ellipsizeMode="middle">
//                     {selectedGroup.inviteLink}
//                   </Text>
//                 </View>
                
//                 <View style={styles.inviteActions}>
//                   <TouchableOpacity 
//                     style={styles.inviteAction}
//                     onPress={() => handleCopyInviteLink(selectedGroup.inviteLink)}
//                   >
//                     <Ionicons name="copy-outline" size={20} color={darkMode ? "#fff" : "#333"} />
//                     <Text style={[styles.actionText, darkMode && styles.darkText]}>Copy Link</Text>
//                   </TouchableOpacity>
                  
//                   <TouchableOpacity 
//                     style={styles.inviteAction}
//                     onPress={() => handleShareInviteLink(selectedGroup)}
//                   >
//                     <Ionicons name="share-social-outline" size={20} color={darkMode ? "#fff" : "#333"} />
//                     <Text style={[styles.actionText, darkMode && styles.darkText]}>Share</Text>
//                   </TouchableOpacity>
                  
//                   <TouchableOpacity 
//                     style={styles.inviteAction}
//                     onPress={() => handleGenerateNewInviteCode(selectedGroup.id)}
//                   >
//                     <Ionicons name="refresh-outline" size={20} color={darkMode ? "#fff" : "#333"} />
//                     <Text style={[styles.actionText, darkMode && styles.darkText]}>New Code</Text>
//                   </TouchableOpacity>
//                 </View>
//               </>
//             )}
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8f8f8',
//   },
//   darkContainer: {
//     backgroundColor: '#121212',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   loadingText: {
//     marginTop: 10,
//     fontSize: 16,
//     color: '#333',
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   emptyText: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginTop: 20,
//     color: '#333',
//   },
//   emptySubtext: {
//     fontSize: 14,
//     textAlign: 'center',
//     marginTop: 10,
//     color: '#888',
//     maxWidth: 250,
//   },
//   listContent: {
//     padding: 15,
//   },
//   groupItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     padding: 15,
//     backgroundColor: '#fff',
//     borderRadius: 10,
//     marginBottom: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//     elevation: 2,
//   },
//   darkGroupItem: {
//     backgroundColor: '#1e1e1e',
//   },
//   groupInfo: {
//     flex: 1,
//   },
//   groupName: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   groupMembers: {
//     fontSize: 14,
//     color: '#888',
//     marginTop: 4,
//   },
//   fab: {
//     position: 'absolute',
//     bottom: 20,
//     right: 20,
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     backgroundColor: '#2E78B7',
//     justifyContent: 'center',
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.3,
//     shadowRadius: 3,
//     elevation: 5,
//   },
//   modalOverlay: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//   },
//   modalContent: {
//     width: '85%',
//     backgroundColor: '#fff',
//     borderRadius: 10,
//     padding: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//     elevation: 5,
//   },
//   darkModalContent: {
//     backgroundColor: '#1e1e1e',
//   },
//   modalHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 15,
//   },
//   modalTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   label: {
//     fontSize: 14,
//     marginBottom: 5,
//     color: '#333',
//   },
//   input: {
//     backgroundColor: '#f5f5f5',
//     borderRadius: 5,
//     padding: 12,
//     marginBottom: 15,
//     fontSize: 16,
//     color: '#333',
//   },
//   darkInput: {
//     backgroundColor: '#2a2a2a',
//     color: '#fff',
//   },
//   button: {
//     backgroundColor: '#2E78B7',
//     borderRadius: 5,
//     padding: 12,
//     alignItems: 'center',
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   darkText: {
//     color: '#fff',
//   },
//   darkSecondaryText: {
//     color: '#aaa',
//   },
//   inviteCodeContainer: {
//     marginBottom: 15,
//   },
//   inviteCode: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     marginTop: 5,
//     padding: 10,
//     backgroundColor: '#f5f5f5',
//     borderRadius: 5,
//     textAlign: 'center',
//     color: '#333',
//   },
//   inviteLinkContainer: {
//     marginBottom: 20,
//   },
//   inviteLink: {
//     fontSize: 14,
//     marginTop: 5,
//     padding: 10,
//     backgroundColor: '#f5f5f5',
//     borderRadius: 5,
//     color: '#666',
//   },
//   inviteActions: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginTop: 10,
//   },
//   inviteAction: {
//     flex: 1,
//     alignItems: 'center',
//     padding: 10,
//     backgroundColor: '#f5f5f5',
//     borderRadius: 5,
//     marginHorizontal: 5,
//     flexDirection: 'row',
//     justifyContent: 'center',
//   },
//   actionText: {
//     fontSize: 14,
//     marginLeft: 5,
//     color: '#333',
//   },
// });

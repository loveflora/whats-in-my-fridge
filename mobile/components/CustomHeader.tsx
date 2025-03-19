import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
  Clipboard,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppContext } from '@/context/AppContext';

interface Member {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  isOwner?: boolean;
}

interface Notification {
  id: string;
  message: string;
  type: 'invitation' | 'expiry' | 'system';
  read: boolean;
  createdAt: string;
}

interface CustomHeaderProps {
  title: string;
  navigation: any;
}

import { API_URL } from "@/config/api"

export const CustomHeader: React.FC<CustomHeaderProps> = ({ title, navigation }) => {
  const { settings } = useAppContext();
  const darkMode = settings.theme === 'dark';
  
  const [membersModalVisible, setMembersModalVisible] = useState(false);
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  
  const [members, setMembers] = useState<Member[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  
  const [inviteEmail, setInviteEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<{ id: string; name: string; inviteCode: string } | null>(null);
  const [inviteLink, setInviteLink] = useState('');
  
  // 사용자 정보 및 그룹 가져오기
  const fetchUserInfo = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;
      
      const response = await fetch(`${API_URL}/api/auth/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const userData = await response.json();
        // 사용자의 그룹 정보 가져오기
        fetchUserGroups();
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      // 에러 발생 시 로딩 상태 종료 및 기본 그룹 정보 설정
      setIsLoading(false);
      setDefaultGroupInfo();
    }
  };
  
  const setDefaultGroupInfo = () => {
    // 임시 그룹 정보 설정 (API 연결 오류 시)
    const tempGroupId = 'temp-' + Math.random().toString(36).substring(2, 9);
    const tempInviteCode = Math.random().toString(36).substring(2, 10);
    
    setCurrentGroup({
      id: tempGroupId,
      name: '내 냉장고 그룹',
      inviteCode: tempInviteCode
    });
    
    // 임시 초대 링크 생성
    const appDomain = 'exp://192.168.20.8:8081';
    setInviteLink(`${appDomain}/join-group/${tempInviteCode}`);
  };
  
  const fetchUserGroups = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setDefaultGroupInfo();
        return;
      }
      
      try {
        const response = await fetch(`${API_URL}/api/groups/my-groups`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log("응답 상태 코드:", response.status);
        
        // 응답 형식 확인을 위한 텍스트 확인
        const responseText = await response.text();
        console.log("응답 텍스트 시작 부분:", responseText.substring(0, 100)); // 처음 100자만 확인
        
        let data;
        try {
          data = JSON.parse(responseText);
          
          if (data.groups && data.groups.length > 0) {
            // 첫 번째 그룹을 현재 그룹으로 설정
            const group = data.groups[0];
            setCurrentGroup({
              id: group.id,
              name: group.name,
              inviteCode: group.inviteCode
            });
            
            // 초대 링크 생성
            const appDomain = 'exp://192.168.20.8:8081';
            setInviteLink(`${appDomain}/join-group/${group.inviteCode}`);
          } else {
            // 그룹이 없으면 기본 그룹 설정
            setDefaultGroupInfo();
          }
        } catch (parseError) {
          console.error("JSON 파싱 오류:", parseError);
          setDefaultGroupInfo();
        }
      } catch (fetchError) {
        console.error("API 호출 오류:", fetchError);
        setDefaultGroupInfo();
      }
    } catch (error) {
      console.error('Error fetching user groups:', error);
      // 에러 발생 시 로딩 상태 종료 및 기본 그룹 정보 설정
      setDefaultGroupInfo();
    } finally {
      setIsLoading(false);
    }
  };
  
  const createNewGroup = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;
      
      const response = await fetch(`${API_URL}/api/groups`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: '내 냉장고 그룹'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentGroup({
          id: data.id,
          name: data.name,
          inviteCode: data.inviteCode
        });
        
        // 초대 링크 생성
        const appDomain = 'exp://192.168.20.8:8081';
        setInviteLink(`${appDomain}/join-group/${data.inviteCode}`);
      }
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };
  
  const regenerateInviteCode = async () => {
    if (!currentGroup) return;
    
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;
      
      const response = await fetch(`${API_URL}/api/groups/${currentGroup.id}/regenerate-invite`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentGroup(prev => {
          if (!prev) return null;
          return {
            ...prev,
            inviteCode: data.inviteCode
          };
        });
        
        // 새 초대 링크 생성
        const appDomain = 'exp://192.168.20.8:8081';
        setInviteLink(`${appDomain}/join-group/${data.inviteCode}`);
        Alert.alert('알림', '새로운 초대 코드가 생성되었습니다');
      }
    } catch (error) {
      console.error('Error regenerating invite code:', error);
      Alert.alert('오류', '초대 코드 재생성 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };
  
  const copyInviteLink = () => {
    if (inviteLink) {
      Clipboard.setString(inviteLink);
      Alert.alert('알림', '초대 링크가 클립보드에 복사되었습니다');
    }
  };
  
  const shareInviteLink = async () => {
    if (!inviteLink || !currentGroup) return;
    
    try {
      await Share.share({
        message: `내 냉장고 그룹 "${currentGroup.name}"에 참여해보세요! ${inviteLink}`,
        title: `${currentGroup.name} 초대`,
      });
    } catch (error) {
      console.error('Error sharing invite link:', error);
      Alert.alert('오류', '초대 링크 공유 중 오류가 발생했습니다');
    }
  };

  // 멤버 목록 및 알림 가져오기
  useEffect(() => {
    // 기본 데이터 설정은 유지
    setDefaultMembers();
    setDefaultNotifications();
    setDefaultGroupInfo();
    
    // 실제 API 호출 활성화
    fetchUserInfo(); // 먼저 사용자 정보 및 그룹 정보 가져오기
  }, []);
  
  // 그룹 정보가 있을 때 멤버 목록 가져오기
  useEffect(() => {
    if (currentGroup && currentGroup.id) {
      fetchMembers(currentGroup.id);
    }
  }, [currentGroup]);
  
  const fetchMembers = async (groupId: string) => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;
      
      // API 호출
      try {
        console.log(`그룹 멤버 목록 가져오기 시도: ${groupId}`);
        const response = await fetch(`${API_URL}/api/groups/${groupId}/members`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        
        if (!response.ok) {
          console.error("멤버 API 오류, 상태코드:", response.status);
          setDefaultMembers();
          return;
        }
        
        // 응답 텍스트 가져오기
        const responseText = await response.text();
        
        try {
          // JSON 파싱
          const data = JSON.parse(responseText);
          console.log("멤버 목록 가져오기 성공:", data);
          
          if (data && data.members && Array.isArray(data.members)) {
            // 멤버 데이터 설정
            setMembers(data.members);
          } else {
            console.log("멤버 데이터 형식 오류");
            setDefaultMembers();
          }
        } catch (parseError) {
          console.error("멤버 JSON 파싱 오류:", parseError);
          setDefaultMembers();
        }
      } catch (fetchError) {
        console.error("멤버 API 호출 오류:", fetchError);
        setDefaultMembers();
      }
    } catch (error) {
      console.error("멤버 가져오기 오류:", error);
      setDefaultMembers();
    } finally {
      setIsLoading(false);
    }
  };
  
  const setDefaultMembers = () => {
    // 기본 멤버 데이터 설정 (API 오류 시)
    const defaultMembers: Member[] = [
      { _id: '1', name: '사용자', email: 'user@example.com', avatar: 'https://via.placeholder.com/50' },
      { _id: '2', name: '가족1', email: 'family1@example.com', avatar: 'https://via.placeholder.com/50' },
    ];
    setMembers(defaultMembers);
  };
  
  const fetchNotifications = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;
      
      try {
        const response = await fetch(`${API_URL}/api/notifications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // console.log("\uc54c\ub9bc \uc751\ub2f5 \uc0c1\ud0dc \ucf54\ub4dc:", response.status);
        
        const responseText = await response.text();
        // console.log("\uc54c\ub9bc \uc751\ub2f5 \ud14d\uc2a4\ud2b8 \uc2dc\uc791 \ubd80\ubd84:", responseText.substring(0, 100));
        
        try {
          const data = JSON.parse(responseText);
          if (data.notifications) {
            setNotifications(data.notifications);
            const unreadCount = data.notifications.filter((notif: Notification) => !notif.read).length;
            setUnreadNotifications(unreadCount);
          } else {
            // JSON\uc740 \ub9de\uc9c0\ub9cc \ud615\uc2dd\uc774 \uc608\uc0c1\uacfc \ub2e4\ub984
            setDefaultNotifications();
          }
        } catch (parseError) {
          // console.error("\uc54c\ub9bc JSON \ud30c\uc2f1 \uc624\ub958:", parseError);
          setDefaultNotifications();
        }
      } catch (fetchError) {
        // console.error("\uc54c\ub9bc API \ud638\ucd9c \uc624\ub958:", fetchError);
        setDefaultNotifications();
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setDefaultNotifications();
    }
  };
  
  const setDefaultNotifications = () => {
    const defaultNotifications: Notification[] = [
      {
        id: '1',
        message: '\uc0c8\ub85c\uc6b4 \uadf8\ub8f9 \ucd08\ub300\uac00 \uc788\uc2b5\ub2c8\ub2e4.',
        type: 'invitation',
        createdAt: new Date().toISOString(),
        read: false,
      },
      {
        id: '2',
        message: '\uc6b0\uc720\uac00 3\uc77c \ud6c4 \ub9cc\ub8cc\ub429\ub2c8\ub2e4.',
        type: 'expiry',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        read: true,
      },
    ];
    
    setNotifications(defaultNotifications);
    const unreadCount = defaultNotifications.filter((notif) => !notif.read).length;
    setUnreadNotifications(unreadCount);
  };
  
  const handleInviteMember = async () => {
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      Alert.alert('오류', '유효한 이메일 주소를 입력해주세요');
      return;
    }
    
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;
      
      // 링크 생성 및 초대 로직 (실제 구현에서는 API 호출)
      setTimeout(() => {
        Alert.alert(
          '성공', 
          `${inviteEmail}에게 초대 링크가 복사되었습니다. 공유해주세요.`,
          [
            { 
              text: 'OK', 
              onPress: () => {
                setInviteEmail('');
                setInviteModalVisible(false);
              } 
            }
          ]
        );
        setIsLoading(false);
      }, 1000);
      
      // 실제 구현
      // const response = await fetch(`${API_URL}/api/groups/invite`, {
      //   method: 'POST',
      //   headers: { 
      //     Authorization: `Bearer ${token}`,
      //     'Content-Type': 'application/json' 
      //   },
      //   body: JSON.stringify({ email: inviteEmail })
      // });
      // const data = await response.json();
      // 
      // if (response.ok) {
      //   Alert.alert('성공', `${inviteEmail}에게 초대 링크가 복사되었습니다`);
      //   setInviteEmail('');
      //   setInviteModalVisible(false);
      // } else {
      //   Alert.alert('오류', data.message || '초대 링크 생성에 실패했습니다');
      // }
    } catch (error) {
      console.error('Error inviting member:', error);
      Alert.alert('오류', '멤버 초대 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };
  
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;
      
      // 실제 구현에서는 API 호출
      setNotifications(prevNotifications =>
        prevNotifications.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
      
      setUnreadNotifications(prev => Math.max(0, prev - 1));
      
      // 실제 구현
      // await fetch(`${API_URL}/api/notifications/${notificationId}/read`, {
      //   method: 'PUT',
      //   headers: { Authorization: `Bearer ${token}` }
      // });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  console.log(currentGroup)
  
  const renderMemberItem = ({ item }: { item: Member }) => {
    return (
      <View style={[styles.memberItem, darkMode && styles.darkMemberItem]}>
        <View style={styles.memberAvatar}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatarPlaceholder, darkMode && styles.darkAvatarPlaceholder]}>
              <Text style={styles.avatarInitial}>{item.name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.memberInfo}>
          <View style={styles.memberNameRow}>
            <Text style={[styles.memberName, darkMode && styles.darkText]}>{item.name}</Text>
            {item.isOwner && (
              <View style={styles.ownerBadge}>
                <Text style={styles.ownerBadgeText}>그룹장</Text>
              </View>
            )}
          </View>
          <Text style={[styles.memberEmail, darkMode && styles.darkSecondaryText]}>{item.email}</Text>
        </View>
      </View>
    );
  };
  
  const renderNotificationItem = ({ item }: { item: Notification }) => {
    // 알림 유형에 따른 아이콘
    let icon: any = 'notifications-outline';
    if (item.type === 'invitation') icon = 'people-outline';
    else if (item.type === 'expiry') icon = 'time-outline';
    
    return (
      <TouchableOpacity 
        style={[styles.notificationItem, darkMode && styles.darkNotificationItem]}
        onPress={() => markNotificationAsRead(item.id)}
      >
        <View style={[styles.notificationIcon, !item.read && styles.unreadIcon]}>
          <Ionicons name={icon} size={20} color={!item.read ? '#2E78B7' : (darkMode ? '#aaa' : '#888')} />
        </View>
        <View style={styles.notificationInfo}>
          <Text 
            style={[
              styles.notificationMessage, 
              darkMode && styles.darkText,
              !item.read && styles.boldText
            ]}
          >
            {item.message}
          </Text>
          <Text style={[styles.notificationTime, darkMode && styles.darkSecondaryText]}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };
  
  const handleMemberButtonPress = () => {
    // API 호출 없이 바로 모달 표시
    setMembersModalVisible(true); // member list
    // setInviteModalVisible(true); // invite link
  };

console.log("members>>>>>>>>", members)

  return (
    <View style={[styles.header, darkMode && styles.darkHeader]}>
      <View style={styles.headerLeft}>
        <TouchableOpacity 
          style={styles.iconButton} 
          onPress={handleMemberButtonPress}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="people-outline" size={26} color={darkMode ? "#fff" : "#333"} />
            {members.length > 0 && (
              <View style={styles.memberCountBadge}>
                <Text style={styles.memberCountText}>{members.length}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
      
      <Text style={[styles.title, darkMode && styles.darkText]}>{title}</Text>
      
      <View style={styles.headerRight}>
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => setNotificationsModalVisible(true)}
        >
          <Ionicons name="notifications-outline" size={24} color={darkMode ? "#fff" : "#333"} />
          {unreadNotifications > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadNotifications}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      
      {/* Members Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={membersModalVisible}
        onRequestClose={() => setMembersModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, darkMode && styles.darkModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, darkMode && styles.darkText]}>멤버 관리</Text>
              <TouchableOpacity onPress={() => setMembersModalVisible(false)}>
                <Ionicons name="close" size={24} color={darkMode ? "#fff" : "#000"} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => {
                  setMembersModalVisible(false);
                  setInviteModalVisible(true);
                }}
              >
                <Ionicons name="person-add-outline" size={20} color="#2E78B7" />
                <Text style={styles.actionButtonText}>멤버 초대</Text>
              </TouchableOpacity>
            </View>
            
            {isLoading && members.length === 0 ? (
              <ActivityIndicator style={styles.loading} size="large" color="#2E78B7" />
            ) : members.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyStateText, darkMode && styles.darkText]}>
                  멤버가 없습니다. 멤버를 초대해보세요.
                </Text>
              </View>
            ) : (
              <FlatList
                data={members}
                renderItem={renderMemberItem}
                keyExtractor={item => item._id}
                contentContainerStyle={styles.listContent}
              />
            )}
          </View>
        </View>
      </Modal>
      
      {/* Notifications Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={notificationsModalVisible}
        onRequestClose={() => setNotificationsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, darkMode && styles.darkModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, darkMode && styles.darkText]}>알림</Text>
              <TouchableOpacity onPress={() => setNotificationsModalVisible(false)}>
                <Ionicons name="close" size={24} color={darkMode ? "#fff" : "#000"} />
              </TouchableOpacity>
            </View>
            
            {isLoading && notifications.length === 0 ? (
              <ActivityIndicator style={styles.loading} size="large" color="#2E78B7" />
            ) : notifications.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyStateText, darkMode && styles.darkText]}>
                  알림이 없습니다.
                </Text>
              </View>
            ) : (
              <FlatList
                data={notifications}
                renderItem={renderNotificationItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
              />
            )}
          </View>
        </View>
      </Modal>
      
      


      {/* Invite Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={inviteModalVisible}
        onRequestClose={() => setInviteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, darkMode && styles.darkModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, darkMode && styles.darkText]}>
                {currentGroup ? currentGroup.name : '그룹'} 초대
              </Text>
              <TouchableOpacity onPress={() => setInviteModalVisible(false)}>
                <Ionicons name="close" size={24} color={darkMode ? "#fff" : "#000"} />
              </TouchableOpacity>
            </View>
            
            {/* 내 냉장고 그룹 초대 모달창 > 초대 링크 */}
            {currentGroup ? (
              <>
                <View style={styles.inviteCodeContainer}>
                  <Text style={[styles.label, darkMode && styles.darkText]}>초대 코드:</Text>
                  <Text style={[styles.inviteCode, darkMode && styles.darkText]}>
                    {currentGroup.inviteCode}
                  </Text>
                </View>
                
                <View style={styles.inviteLinkContainer}>
                  <Text style={[styles.label, darkMode && styles.darkText]}>초대 링크:</Text>
                  <Text 
                    style={[styles.inviteLink, darkMode && styles.darkSecondaryText]} 
                    numberOfLines={1} 
                    ellipsizeMode="middle"
                  >
                    {inviteLink}
                  </Text>
                </View>
                
                <View style={styles.inviteActions}>
                  <TouchableOpacity 
                    style={[styles.inviteAction, darkMode && styles.darkInviteAction]}
                    onPress={copyInviteLink}
                  >
                    <Ionicons name="copy-outline" size={20} color={darkMode ? "#fff" : "#333"} />
                    <Text style={[styles.actionText, darkMode && styles.darkText]}>링크 복사</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.inviteAction, darkMode && styles.darkInviteAction]}
                    onPress={shareInviteLink}
                  >
                    <Ionicons name="share-social-outline" size={20} color={darkMode ? "#fff" : "#333"} />
                    <Text style={[styles.actionText, darkMode && styles.darkText]}>링크 공유</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.inviteAction, darkMode && styles.darkInviteAction]}
                    onPress={regenerateInviteCode}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color={darkMode ? "#fff" : "#333"} />
                    ) : (
                      <>
                        <Ionicons name="refresh-outline" size={20} color={darkMode ? "#fff" : "#333"} />
                        <Text style={[styles.actionText, darkMode && styles.darkText]}>초대 코드 재생성</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
                
                <Text style={[styles.inviteInfo, darkMode && styles.darkSecondaryText]}>
                  초대 링크를 공유하여 친구나 가족을 초대할 수 있습니다. 
                  초대 코드를 재생성하면 이전 코드는 사용할 수 없습니다.
                </Text>
              </>
            ) : (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2E78B7" />
                <Text style={[styles.loadingText, darkMode && styles.darkText]}>그룹 정보를 가져오는 중입니다...</Text>
              </View>
            )}
            
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
    paddingTop: 60,
  },
  darkHeader: {
    backgroundColor: '#1a1a1a',
    borderBottomColor: '#333',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  darkText: {
    color: '#fff',
  },
  darkSecondaryText: {
    color: '#aaa',
  },
  iconButton: {
    position: 'relative',
    padding: 8,
  },
  memberCount: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#2E78B7',
    color: '#fff',
    fontSize: 10,
    width: 16,
    height: 16,
    borderRadius: 8,
    textAlign: 'center',
    lineHeight: 16,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF3B30',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    maxHeight: '70%',
  },
  darkModalContent: {
    backgroundColor: '#1e1e1e',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  modalActions: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 5,
  },
  actionButtonText: {
    marginLeft: 5,
    color: '#2E78B7',
    fontSize: 14,
  },
  listContent: {
    paddingTop: 10,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  darkMemberItem: {
    borderBottomColor: '#333',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2E78B7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkAvatarPlaceholder: {
    backgroundColor: '#2a2a2a',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  memberEmail: {
    fontSize: 14,
    color: '#888',
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    position: 'relative',
  },
  darkNotificationItem: {
    borderBottomColor: '#333',
  },
  notificationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  unreadIcon: {
    backgroundColor: 'rgba(46, 120, 183, 0.1)',
  },
  notificationInfo: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  boldText: {
    fontWeight: 'bold',
  },
  notificationTime: {
    fontSize: 12,
    color: '#888',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2E78B7',
    position: 'absolute',
    top: 12,
    right: 12,
  },
  loading: {
    marginTop: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    color: '#333',
  },
  darkInput: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
  },
  button: {
    backgroundColor: '#2E78B7',
    borderRadius: 5,
    padding: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  inviteCodeContainer: {
    marginBottom: 15,
  },
  inviteCode: {
    fontSize: 16,
    color: '#333',
  },
  inviteLinkContainer: {
    marginBottom: 15,
  },
  inviteLink: {
    fontSize: 14,
    color: '#666',
  },
  inviteActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  inviteAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 5,
  },
  darkInviteAction: {
    backgroundColor: '#2a2a2a',
  },
  actionText: {
    marginLeft: 5,
    color: '#2E78B7',
    fontSize: 14,
  },
  inviteInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 10,
  },
  label: {
    fontSize: 14,
    marginBottom: 5,
    color: '#333',
  },
  iconContainer: {
    position: 'relative',
  },
  memberCountBadge: {
    position: 'absolute',
    top: -4,
    left: 22,
    backgroundColor: '#2E78B7',
    color: '#fff',
    fontSize: 10,
    width: 16,
    height: 16,
    borderRadius: 8,
    textAlign: 'center',
    lineHeight: 16,
    justifyContent: "center",
  },
  memberCountText: {
    color: '#fff',
    fontSize: 10,
textAlign: "center",
  },
  ownerBadge: {
    backgroundColor: '#FFC107',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
    marginLeft: 5,
  },
  ownerBadgeText: {
    fontSize: 12,
    color: '#fff',
  },
});

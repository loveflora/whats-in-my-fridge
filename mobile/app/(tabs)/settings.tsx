import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Alert, 
  Modal, 
  TextInput,
  ActivityIndicator,
  ScrollView,
  Share,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';

import { API_URL } from "@/config/api"

interface UserProfile {
  name: string;
  email: string;
}

export default function ProfileScreen() {
  // 앱 컨텍스트에서 설정과 업데이트 함수 가져오기
  const { settings, updateTheme, updateLanguage, translations } = useAppContext();

  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  
  const [friendEmail, setFriendEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // 프로필 정보
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: '',
    email: '',
  });
  const [editedProfile, setEditedProfile] = useState<UserProfile>({
    name: '',
    email: '',
  });
  
  // 알림 설정
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [expirationAlerts, setExpirationAlerts] = useState(true);
  
  // 테마 설정 - AppContext에서 가져오기
  const [darkMode, setDarkMode] = useState(settings.theme === 'dark');
  
  // 언어 설정 - AppContext에서 가져오기
  const languages = [
    { code: 'ko', name: '한국어' },
    { code: 'en', name: 'English' },
    { code: 'ja', name: '日本語' },
    { code: 'zh', name: '中文' },
  ];
  const [selectedLanguage, setSelectedLanguage] = useState(settings.language);
  
  // 설정값이 변경될 때 로컬 상태 업데이트
  useEffect(() => {
    setDarkMode(settings.theme === 'dark');
    setSelectedLanguage(settings.language);
  }, [settings]);
  
  // 프로필 데이터 가져오기 (실제 앱에서는 API를 통해 가져와야 함)
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        if (!token) {
          setDefaultUserData();
          return;
        }
        
        try {
          // 프로필 정보 가져오기 API 호출
          const response = await fetch(`${API_URL}/api/auth/user`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            setDefaultUserData();
            return;
          }
          
          // 응답 텍스트 가져오기
          const responseText = await response.text();

          try {
            // JSON 파싱
            const userData = JSON.parse(responseText);
            
            // 프로필 정보 가져오기 성공
            if (userData.name && userData.email) {
              console.log("프로필 정보 가져오기:", {
                name: userData.name,
                email: userData.email
              });
              
              setUserProfile({
                name: userData.name,
                email: userData.email,
              });
              
              setEditedProfile({
                name: userData.name,
                email: userData.email,
              });
            } else {
              // 기본 프로필 정보 설정
              setDefaultUserData();
            }
          } catch (parseError) {
            console.error("프로필 정보 가져오기 JSON 파싱 오류:", parseError);
            setDefaultUserData();
          }
        } catch (fetchError) {
          console.error("API 호출 오류:", fetchError);
          setDefaultUserData();
        }
      } catch (error) {
        console.error('프로필 정보 가져오는 중 오류 발생:', error);
        setDefaultUserData();
      }
    };
    
    fetchUserProfile();
  }, []);
  
  // 기본 프로필 정보 설정
  const setDefaultUserData = () => {
    const defaultData = {
      name: '사용자',
      email: 'user@example.com',
    };
    
    setUserProfile(defaultData);
    setEditedProfile(defaultData);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('userToken');
            router.replace('/auth/login');
          }
        },
      ]
    );
  };

  const handleInviteFriend = async () => {
    if (!friendEmail || !friendEmail.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      console.log('초대 요청 시작:', friendEmail);
      console.log('API URL:', `${API_URL}/api/friends/invite`);
      
      const response = await fetch(`${API_URL}/api/friends/invite`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: friendEmail }),
      });

      console.log('API 응답 상태 코드:', response.status);
      
      // 응답이 JSON 형식인지 확인
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // JSON이 아닌 경우 텍스트로 응답 처리
        const textResponse = await response.text();
        console.log('Non-JSON response:', textResponse);
        throw new Error(`Server returned non-JSON response: ${response.status}`);
      }
      
      const responseData = await response.json();
      console.log('API 응답 데이터:', responseData);

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to send invitation');
      }

      Alert.alert(
        'Success',
        `Invitation sent to ${friendEmail}`,
        [{ text: 'OK', onPress: () => setInviteModalVisible(false) }]
      );
      setFriendEmail('');
    } catch (error: any) {
      console.error('Error inviting friend:', error);
      Alert.alert('Error', `Failed to send invitation. Error: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: 'Check out this amazing app to manage your fridge and plan your meals! Download "What\'s in my Fridge" now!',
        title: 'What\'s in my Fridge App',
      });
    } catch (error) {
      Alert.alert('Error', 'Could not share the app');
    }
  };
  
  // 프로필 업데이트 처리
  const updateProfile = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("uc624ub958", "ub85cuadf8uc778 uc815ubcf4uac00 uc5c6uc2b5ub2c8ub2e4.");
        setIsLoading(false);
        return;
      }
      
      try {
        // ud504ub85cud544 uc5c5ub370uc774ud2b8 API ud638ucd9c
        console.log("ud504ub85cud544 uc5c5ub370uc774ud2b8 uc2dcub3c4...");
        console.log("uc5c5ub370uc774ud2b8 ub370uc774ud130:", { name: editedProfile.name });
        
        const response = await fetch(`${API_URL}/api/auth/update-profile`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: editedProfile.name
          })
        });
        
        // uc751ub2f5 ud14duc2a4ud2b8 uac00uc838uc624uae30
        const responseText = await response.text();
        console.log("API uc751ub2f5 uc0c1ud0dc:", response.status);
        
        // HTTP uc0c1ud0dc ucf54ub4dc ud655uc778
        if (response.ok) {
          try {
            // JSON ud30cuc2f1 uc2dcub3c4 (uc751ub2f5uc774 JSON uc778 uacbd uc6b0uc5d0ub9cc)
            if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
              const data = JSON.parse(responseText);
              console.log("ud504ub85cud544 uc5c5ub370uc774ud2b8 uc131uacf5:", data);
            }
          } catch (parseError) {
            // JSON ud30cuc2f1 uc2e4ud328ub294 ubb34uc2dcud574ub3c4 ub428
            console.log("JSON ud30cuc2f1 uc2e4ud328, ud558uc9c0ub9cc uc694uccad uc131uacf5:", parseError);
          }
          
          // uc131uacf5uc801uc73cub85c uc5c5ub370uc774ud2b8ub418uba74 uc0c1ud0dc uc5c5ub370uc774ud2b8
          setUserProfile({
            ...userProfile,
            name: editedProfile.name
          });
          
          Alert.alert("uc131uacf5", "ud504ub85cud544 uc815ubcf4uac00 uc5c5ub370uc774ud2b8 ub418uc5c8uc2b5ub2c8ub2e4.");
          setProfileModalVisible(false);
        } else {
          console.log("API uc624ub958, uc0c1ud0dc ucf54ub4dc:", response.status);
          
          // API uc624ub958uc9c0ub9cc ub85cuce7c uc5c5ub370uc774ud2b8 uc218ud589
          setUserProfile({
            ...userProfile,
            name: editedProfile.name
          });
          
          Alert.alert(
            "uc8fcuc758", 
            "uc11cbc ubb34uc751ub2f5 ub610ub294 uc624ub958uac00 ubc1cuc0ddud588uc9c0ub9cc, ud504ub85cud544uc774 ub85cuce7cuc5d0 uc5c5ub370uc774ud2b8ub418uc5c8uc2b5ub2c8ub2e4.",
            [{ text: "ud655uc778", onPress: () => setProfileModalVisible(false) }]
          );
        }
      } catch (fetchError) {
        console.error("ud504ub85cud544 uc5c5ub370uc774ud2b8 API ud638ucd9c uc624ub958:", fetchError);
        
        // uc624ub958 ubc1cuc0dd uc2dc ub85cuce7cuc5d0uc11cub9cc uc5c5ub370uc774ud2b8
        setUserProfile({
          ...userProfile,
          name: editedProfile.name
        });
        
        Alert.alert(
          "uc5f0uacb0 uc624ub958", 
          "uc11cbc uc5f0uacb0 uc911 uc624ub958uac00 ubc1cuc0ddud588uc9c0ub9cc, ud504ub85cud544uc774 ub85cuce7cuc5d0 uc5c5ub370uc774ud2b8ub418uc5c8uc2b5ub2c8ub2e4.",
          [{ text: "ud655uc778", onPress: () => setProfileModalVisible(false) }]
        );
      }
    } catch (error) {
      console.error("ud1a0ud070 uc5d0ub7ec:", error);
      Alert.alert("uc624ub958", "uc54cuac8c ub41c uc624ub958uac00 ubc1cuc0ddud588uc2b5ub2c8ub2e4.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = () => {
    // 이메일 정보는 변경하지 않음
    setEditedProfile(prev => ({
      ...prev,
      email: userProfile.email
    }));
    
    updateProfile();
  };
  
  // 알림 설정 저장
  const handleSaveNotifications = async () => {
    try {
      // 실제 앱에서는 API를 통해 설정 저장
      Alert.alert('Success', 'Notification settings updated');
      setNotificationsModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save notification settings');
    }
  };
  
  // 테마 변경 - AppContext에 반영
  const handleThemeChange = (isDark: boolean) => {
    setDarkMode(isDark);
    updateTheme(isDark ? 'dark' : 'light');
    
    // 테마 변경 알림
    Alert.alert(
      'Success', 
      isDark ? '다크 모드로 변경되었습니다.' : '라이트 모드로 변경되었습니다.',
      [{ text: 'OK', onPress: () => setThemeModalVisible(false) }]
    );
  };
  
  // 언어 변경 - AppContext에 반영
  const handleLanguageSelect = (langCode: 'ko' | 'en' | 'ja' | 'zh') => {
    setSelectedLanguage(langCode);
    updateLanguage(langCode);
    setLanguageModalVisible(false);
    
    // 언어에 맞게 알림 메시지 표시
    const successMessages = {
      ko: '언어 설정이 변경되었습니다.',
      en: 'Language settings have been changed.',
      ja: '言語設定が変更されました。',
      zh: '语言设置已更改。',
    };
    
    Alert.alert('Success', successMessages[langCode]);
  };

  return (
    <ScrollView style={[
      styles.container, 
      darkMode && styles.darkContainer
    ]}>
      <Text style={[
        styles.title,
        darkMode && styles.darkText
      ]}>Settings</Text>
      
      <View style={[
        styles.section, 
        darkMode && styles.darkSection
      ]}>
        <Text style={[
          styles.sectionTitle,
          darkMode && styles.darkSectionTitle
        ]}>Account</Text>
        <TouchableOpacity 
          style={[styles.menuItem, darkMode && styles.darkMenuItem]}
          onPress={() => setProfileModalVisible(true)}
        >
          <Ionicons name="person-outline" size={24} color={darkMode ? "#fff" : "#333"} />
          <Text style={[styles.menuText, darkMode && styles.darkText]}>Edit Profile</Text>
          <Ionicons name="chevron-forward" size={20} color={darkMode ? "#888" : "#ccc"} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.menuItem, darkMode && styles.darkMenuItem]}
          onPress={() => setNotificationsModalVisible(true)}
        >
          <Ionicons name="notifications-outline" size={24} color={darkMode ? "#fff" : "#333"} />
          <Text style={[styles.menuText, darkMode && styles.darkText]}>Notifications</Text>
          <Ionicons name="chevron-forward" size={20} color={darkMode ? "#888" : "#ccc"} />
        </TouchableOpacity>
      </View>
      
      {/* <View style={[
        styles.section, 
        darkMode && styles.darkSection
      ]}>
        <Text style={[
          styles.sectionTitle,
          darkMode && styles.darkSectionTitle
        ]}>Social</Text>
        <TouchableOpacity 
          style={[styles.menuItem, darkMode && styles.darkMenuItem]}
          onPress={() => setInviteModalVisible(true)}
        >
          <Ionicons name="people-outline" size={24} color={darkMode ? "#fff" : "#333"} />
          <Text style={[styles.menuText, darkMode && styles.darkText]}>Invite Friends</Text>
          <Ionicons name="chevron-forward" size={20} color={darkMode ? "#888" : "#ccc"} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.menuItem, darkMode && styles.darkMenuItem]}
          onPress={handleShareApp}
        >
          <Ionicons name="share-social-outline" size={24} color={darkMode ? "#fff" : "#333"} />
          <Text style={[styles.menuText, darkMode && styles.darkText]}>Share App</Text>
          <Ionicons name="chevron-forward" size={20} color={darkMode ? "#888" : "#ccc"} />
        </TouchableOpacity>
      </View> */}
      
      <View style={[
        styles.section, 
        darkMode && styles.darkSection
      ]}>
        <Text style={[
          styles.sectionTitle,
          darkMode && styles.darkSectionTitle
        ]}>Preferences</Text>
        <TouchableOpacity 
          style={[styles.menuItem, darkMode && styles.darkMenuItem]}
          onPress={() => setThemeModalVisible(true)}
        >
          <Ionicons name="color-palette-outline" size={24} color={darkMode ? "#fff" : "#333"} />
          <Text style={[styles.menuText, darkMode && styles.darkText]}>Theme</Text>
          <Ionicons name="chevron-forward" size={20} color={darkMode ? "#888" : "#ccc"} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.menuItem, darkMode && styles.darkMenuItem]}
          onPress={() => setLanguageModalVisible(true)}
        >
          <Ionicons name="language-outline" size={24} color={darkMode ? "#fff" : "#333"} />
          <Text style={[styles.menuText, darkMode && styles.darkText]}>Language</Text>
          <Ionicons name="chevron-forward" size={20} color={darkMode ? "#888" : "#ccc"} />
        </TouchableOpacity>
      </View>
      
      <View style={[
        styles.section, 
        darkMode && styles.darkSection
      ]}>
        <TouchableOpacity 
          style={[styles.menuItem, darkMode && styles.darkMenuItem]} 
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="#F44336" />
          <Text style={[styles.menuText, { color: '#F44336' }]}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Friend Invitation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={inviteModalVisible}
        onRequestClose={() => setInviteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalContent,
            darkMode && styles.darkModalContent
          ]}>
            <View style={styles.modalHeader}>
              <Text style={[
                styles.modalTitle,
                darkMode && styles.darkText
              ]}>Invite a Friend</Text>
              <TouchableOpacity onPress={() => setInviteModalVisible(false)}>
                <Ionicons name="close" size={24} color={darkMode ? "#fff" : "#000"} />
              </TouchableOpacity>
            </View>

            <Text style={[
              styles.modalText,
              darkMode && styles.darkText
            ]}>
              Enter your friend's email to invite them to use the app and share your fridge!
            </Text>

            <TextInput
              style={[
                styles.input,
                darkMode && styles.darkInput
              ]}
              placeholder="Friend's Email"
              placeholderTextColor={darkMode ? "#888" : "#999"}
              value={friendEmail}
              onChangeText={setFriendEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={styles.button}
              onPress={handleInviteFriend}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Send Invitation</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* 프로필 수정 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={profileModalVisible}
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalContent,
            darkMode && styles.darkModalContent
          ]}>
            <View style={styles.modalHeader}>
              <Text style={[
                styles.modalTitle,
                darkMode && styles.darkText
              ]}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
                <Ionicons name="close" size={24} color={darkMode ? "#fff" : "#000"} />
              </TouchableOpacity>
            </View>

            <Text style={[
              styles.label,
              darkMode && styles.darkText
            ]}>
              Name
            </Text>
            <TextInput
              style={[
                styles.input,
                darkMode && styles.darkInput
              ]}
              placeholder="Your name"
              placeholderTextColor={darkMode ? "#aaa" : "#999"}
              value={editedProfile.name}
              onChangeText={(text) => setEditedProfile({...editedProfile, name: text})}
            />
            
            <Text style={[
              styles.label,
              darkMode && styles.darkText
            ]}>
              Email (읽기 전용)
            </Text>
            <TextInput
              style={[
                styles.input,
                darkMode && styles.darkInput,
                { backgroundColor: darkMode ? '#444' : '#f0f0f0' } // 읽기 전용 배경색 변경
              ]}
              value={editedProfile.email}
              editable={false} // 수정 불가능하게 설정
              selectTextOnFocus={false} // 텍스트 선택 비활성화
            />
            
            {/* <Text style={[
              styles.label,
              darkMode && styles.darkText
            ]}>Phone Number</Text>
            <TextInput
              style={[
                styles.input,
                darkMode && styles.darkInput
              ]}
              placeholder="Your Phone Number"
              placeholderTextColor={darkMode ? "#888" : "#999"}
              value={editedProfile.phoneNumber}
              onChangeText={(text) => setEditedProfile({...editedProfile, phoneNumber: text})}
              keyboardType="phone-pad"
            /> */}

            <TouchableOpacity
              style={styles.button}
              onPress={handleUpdateProfile}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* 알림 설정 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={notificationsModalVisible}
        onRequestClose={() => setNotificationsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalContent,
            darkMode && styles.darkModalContent
          ]}>
            <View style={styles.modalHeader}>
              <Text style={[
                styles.modalTitle,
                darkMode && styles.darkText
              ]}>Notification Settings</Text>
              <TouchableOpacity onPress={() => setNotificationsModalVisible(false)}>
                <Ionicons name="close" size={24} color={darkMode ? "#fff" : "#000"} />
              </TouchableOpacity>
            </View>

            <View style={styles.settingItem}>
              <Text style={[
                styles.settingText,
                darkMode && styles.darkText
              ]}>Push Notifications</Text>
              <Switch
                value={pushNotifications}
                onValueChange={setPushNotifications}
                trackColor={{ false: "#ccc", true: "#81b0ff" }}
                thumbColor={pushNotifications ? "#2E78B7" : "#f4f3f4"}
              />
            </View>
            
            <View style={styles.settingItem}>
              <Text style={[
                styles.settingText,
                darkMode && styles.darkText
              ]}>Email Notifications</Text>
              <Switch
                value={emailNotifications}
                onValueChange={setEmailNotifications}
                trackColor={{ false: "#ccc", true: "#81b0ff" }}
                thumbColor={emailNotifications ? "#2E78B7" : "#f4f3f4"}
              />
            </View>
            
            <View style={styles.settingItem}>
              <Text style={[
                styles.settingText,
                darkMode && styles.darkText
              ]}>Food Expiration Alerts</Text>
              <Switch
                value={expirationAlerts}
                onValueChange={setExpirationAlerts}
                trackColor={{ false: "#ccc", true: "#81b0ff" }}
                thumbColor={expirationAlerts ? "#2E78B7" : "#f4f3f4"}
              />
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleSaveNotifications}
            >
              <Text style={styles.buttonText}>Save Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* 테마 설정 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={themeModalVisible}
        onRequestClose={() => setThemeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalContent,
            darkMode && styles.darkModalContent
          ]}>
            <View style={styles.modalHeader}>
              <Text style={[
                styles.modalTitle,
                darkMode && styles.darkText
              ]}>Theme Settings</Text>
              <TouchableOpacity onPress={() => setThemeModalVisible(false)}>
                <Ionicons name="close" size={24} color={darkMode ? "#fff" : "#000"} />
              </TouchableOpacity>
            </View>

            <View style={styles.themeSelector}>
              <TouchableOpacity
                style={[
                  styles.themeOption,
                  !darkMode && styles.selectedTheme,
                  { backgroundColor: '#ffffff' }
                ]}
                onPress={() => handleThemeChange(false)}
              >
                <Ionicons name="sunny-outline" size={32} color="#333" />
                <Text style={styles.themeText}>Light Mode</Text>
                {!darkMode && (
                  <Ionicons name="checkmark-circle" size={24} color="#2E78B7" style={styles.themeCheck} />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.themeOption,
                  darkMode && styles.selectedTheme,
                  { backgroundColor: '#2c2c2c' }
                ]}
                onPress={() => handleThemeChange(true)}
              >
                <Ionicons name="moon-outline" size={32} color="#fff" />
                <Text style={[styles.themeText, { color: '#fff' }]}>Dark Mode</Text>
                {darkMode && (
                  <Ionicons name="checkmark-circle" size={24} color="#81b0ff" style={styles.themeCheck} />
                )}
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={styles.button}
              onPress={() => setThemeModalVisible(false)}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* 언어 설정 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={languageModalVisible}
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalContent,
            darkMode && styles.darkModalContent
          ]}>
            <View style={styles.modalHeader}>
              <Text style={[
                styles.modalTitle,
                darkMode && styles.darkText
              ]}>Language Settings</Text>
              <TouchableOpacity onPress={() => setLanguageModalVisible(false)}>
                <Ionicons name="close" size={24} color={darkMode ? "#fff" : "#000"} />
              </TouchableOpacity>
            </View>

            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageItem,
                  selectedLanguage === lang.code && styles.selectedLanguage,
                  darkMode && styles.darkLanguageItem,
                  darkMode && selectedLanguage === lang.code && styles.darkSelectedLanguage
                ]}
                onPress={() => handleLanguageSelect(lang.code as 'ko' | 'en' | 'ja' | 'zh')}
              >
                <Text style={[
                  styles.languageText,
                  darkMode && styles.darkText
                ]}>{lang.name}</Text>
                {selectedLanguage === lang.code && (
                  <Ionicons name="checkmark" size={20} color="#2E78B7" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    padding: 16,
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    marginTop: 10,
    color: '#333',
  },
  darkText: {
    color: '#ffffff',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  darkSection: {
    backgroundColor: '#1e1e1e',
    shadowColor: '#fff',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    padding: 16,
    paddingBottom: 8,
  },
  darkSectionTitle: {
    color: '#aaa',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  darkMenuItem: {
    borderBottomColor: '#333',
  },
  menuText: {
    fontSize: 16,
    marginLeft: 16,
    flex: 1,
    color: '#333',
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
    padding: 24,
    width: '85%',
    maxHeight: '80%',
  },
  darkModalContent: {
    backgroundColor: '#1e1e1e',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    color: '#666',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    color: '#333',
  },
  darkInput: {
    backgroundColor: '#333',
    color: '#fff',
  },
  button: {
    backgroundColor: '#2E78B7',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingText: {
    fontSize: 16,
    color: '#333',
  },
  themeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  themeOption: {
    width: '48%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedTheme: {
    borderColor: '#2E78B7',
  },
  themeText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  themeCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  darkLanguageItem: {
    borderBottomColor: '#333',
  },
  selectedLanguage: {
    backgroundColor: '#f0f8ff',
  },
  darkSelectedLanguage: {
    backgroundColor: '#1a3a5a',
  },
  languageText: {
    fontSize: 16,
    color: '#333',
  },
});

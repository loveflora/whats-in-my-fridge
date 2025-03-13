import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppSettings {
  theme: 'light' | 'dark';
  language: 'ko' | 'en' | 'ja' | 'zh';
}

interface AppContextType {
  settings: AppSettings;
  updateTheme: (theme: 'light' | 'dark') => void;
  updateLanguage: (language: 'ko' | 'en' | 'ja' | 'zh') => void;
  translations: Record<string, string>;
}

const defaultSettings: AppSettings = {
  theme: 'light',
  language: 'ko',
};

// 간단한 번역 예시 (실제 앱에서는 이보다 많은 번역이 필요합니다)
const translationData = {
  // 한국어
  ko: {
    'app.name': '내 냉장고',
    'tabs.fridge': '냉장고',
    'tabs.shopping': '장보기',
    'tabs.menu': '식단',
    'tabs.settings': '설정',
    'settings.account': '계정',
    'settings.editProfile': '프로필 편집',
    'settings.notifications': '알림',
    'settings.social': '소셜',
    'settings.inviteFriends': '친구 초대',
    'settings.shareApp': '앱 공유하기',
    'settings.preferences': '환경설정',
    'settings.theme': '테마',
    'settings.language': '언어',
    'settings.logout': '로그아웃',
  },
  // 영어
  en: {
    'app.name': 'My Fridge',
    'tabs.fridge': 'Fridge',
    'tabs.shopping': 'Shopping',
    'tabs.menu': 'Menu',
    'tabs.settings': 'Settings',
    'settings.account': 'Account',
    'settings.editProfile': 'Edit Profile',
    'settings.notifications': 'Notifications',
    'settings.social': 'Social',
    'settings.inviteFriends': 'Invite Friends',
    'settings.shareApp': 'Share App',
    'settings.preferences': 'Preferences',
    'settings.theme': 'Theme',
    'settings.language': 'Language',
    'settings.logout': 'Logout',
  },
  // 일본어
  ja: {
    'app.name': '私の冷蔵庫',
    'tabs.fridge': '冷蔵庫',
    'tabs.shopping': 'ショッピング',
    'tabs.menu': 'メニュー',
    'tabs.settings': '設定',
    'settings.account': 'アカウント',
    'settings.editProfile': 'プロフィール編集',
    'settings.notifications': '通知',
    'settings.social': 'ソーシャル',
    'settings.inviteFriends': '友達を招待',
    'settings.shareApp': 'アプリを共有',
    'settings.preferences': '環境設定',
    'settings.theme': 'テーマ',
    'settings.language': '言語',
    'settings.logout': 'ログアウト',
  },
  // 중국어
  zh: {
    'app.name': '我的冰箱',
    'tabs.fridge': '冰箱',
    'tabs.shopping': '购物',
    'tabs.menu': '菜单',
    'tabs.settings': '设置',
    'settings.account': '账户',
    'settings.editProfile': '编辑个人资料',
    'settings.notifications': '通知',
    'settings.social': '社交',
    'settings.inviteFriends': '邀请朋友',
    'settings.shareApp': '分享应用',
    'settings.preferences': '偏好设置',
    'settings.theme': '主题',
    'settings.language': '语言',
    'settings.logout': '登出',
  },
};

export const AppContext = createContext<AppContextType>({
  settings: defaultSettings,
  updateTheme: () => {},
  updateLanguage: () => {},
  translations: translationData.ko,
});

export const useAppContext = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [translations, setTranslations] = useState(translationData.ko);

  // 앱 시작시 저장된 설정 불러오기
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedSettings = await AsyncStorage.getItem('appSettings');
        if (storedSettings) {
          const parsedSettings = JSON.parse(storedSettings) as AppSettings;
          setSettings(parsedSettings);
          setTranslations(translationData[parsedSettings.language]);
        }
      } catch (error) {
        console.error('설정 로딩 오류:', error);
      }
    };

    loadSettings();
  }, []);

  // 테마 업데이트
  const updateTheme = async (theme: 'light' | 'dark') => {
    try {
      const newSettings = { ...settings, theme };
      setSettings(newSettings);
      await AsyncStorage.setItem('appSettings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('테마 설정 오류:', error);
    }
  };

  // 언어 업데이트
  const updateLanguage = async (language: 'ko' | 'en' | 'ja' | 'zh') => {
    try {
      const newSettings = { ...settings, language };
      setSettings(newSettings);
      setTranslations(translationData[language]);
      await AsyncStorage.setItem('appSettings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('언어 설정 오류:', error);
    }
  };

  return (
    <AppContext.Provider
      value={{
        settings,
        updateTheme,
        updateLanguage,
        translations,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

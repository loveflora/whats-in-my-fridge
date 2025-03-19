// const API_BASE_URL = 'http://10.0.2.2:5001'; // Use 10.0.2.2 for Android emulator or your computer's local IP for real devices
export const API_URL = 'http://192.168.20.7:5001'; // Use 10.0.2.2 for Android emulator or your computer's local IP for real devices

// API URL을 여러 옵션 중에서 작동하는 것을 선택하도록 함
// 에뮬레이터와 실제 기기에서 각각 다른 URL이 필요할 수 있음
// const API_URLS = [
//   'http://192.168.20.7:5001',
//   'http://localhost:5001',
//   'http://127.0.0.1:5001'
// ];
// let API_URL = API_URLS[0]; // 기본값


// You can switch between different environments as needed
// const API_URL = 'http://localhost:5001'; // For web testing
// const API_URL = 'http://192.168.x.x:5001'; // Replace with your actual network IP when testing on physical devices

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_URL}/api/auth/login`,
  REGISTER: `${API_URL}/api/auth/register`,
  PROFILE: `${API_URL}/api/auth/profile`,
  
  // Fridge endpoints
  FRIDGE_ITEMS: `${API_URL}/api/fridge/items`,
  
  // Shopping list endpoints
  SHOPPING_LISTS: `${API_URL}/api/shopping`,
  
  // Menu endpoints
  MENU: `${API_URL}/api/menu`,
};


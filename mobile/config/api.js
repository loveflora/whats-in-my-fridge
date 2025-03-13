// const API_BASE_URL = 'http://10.0.2.2:5001'; // Use 10.0.2.2 for Android emulator or your computer's local IP for real devices
const API_BASE_URL = 'http://192.168.20.8:5001'; // Use 10.0.2.2 for Android emulator or your computer's local IP for real devices

// You can switch between different environments as needed
// const API_BASE_URL = 'http://localhost:5001'; // For web testing
// const API_BASE_URL = 'http://192.168.x.x:5001'; // Replace with your actual network IP when testing on physical devices

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  PROFILE: `${API_BASE_URL}/api/auth/profile`,
  
  // Fridge endpoints
  FRIDGE_ITEMS: `${API_BASE_URL}/api/fridge/items`,
  
  // Shopping list endpoints
  SHOPPING_LISTS: `${API_BASE_URL}/api/shopping-list`,
  
  // Menu endpoints
  MENU: `${API_BASE_URL}/api/menu`,
};

export default API_ENDPOINTS;

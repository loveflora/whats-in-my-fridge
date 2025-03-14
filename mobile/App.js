// import React from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import { Ionicons } from '@expo/vector-icons';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// // Auth Screens
// import LoginScreen from './screens/auth/LoginScreen';
// import RegisterScreen from './screens/auth/RegisterScreen';

// // Main Screens
// import FridgeScreen from './screens/FridgeScreen';
// import ShoppingListScreen from './screens/ShoppingListScreen';
// import MenuPlannerScreen from './screens/MenuPlannerScreen';
// import ProfileScreen from './screens/ProfileScreen';

// const Stack = createNativeStackNavigator();
// const Tab = createBottomTabNavigator();

// const MainTabs = () => {
//   return (
//     <Tab.Navigator
//       screenOptions={({ route }) => ({
//         tabBarIcon: ({ focused, color, size }) => {
//           let iconName;

//           switch (route.name) {
//             case 'Fridge':
//               iconName = focused ? 'ios-refrigerator' : 'ios-refrigerator-outline';
//               break;
//             case 'Shopping':
//               iconName = focused ? 'ios-cart' : 'ios-cart-outline';
//               break;
//             case 'Menu':
//               iconName = focused ? 'ios-restaurant' : 'ios-restaurant-outline';
//               break;
//             case 'Profile':
//               iconName = focused ? 'ios-person' : 'ios-person-outline';
//               break;
//           }

//           return <Ionicons name={iconName} size={size} color={color} />;
//         },
//         tabBarActiveTintColor: '#2196F3',
//         tabBarInactiveTintColor: 'gray',
//         headerStyle: {
//           backgroundColor: '#2196F3',
//         },
//         headerTintColor: '#fff',
//         headerTitleStyle: {
//           fontWeight: 'bold',
//         },
//       })}
//     >
//       <Tab.Screen 
//         name="Fridge" 
//         component={FridgeScreen}
//         options={{ title: "What's in my Fridge" }}
//       />
//       <Tab.Screen 
//         name="Shopping" 
//         component={ShoppingListScreen}
//         options={{ title: 'Shopping Lists' }}
//       />
//       <Tab.Screen 
//         name="Menu" 
//         component={MenuPlannerScreen}
//         options={{ title: 'Menu Planner' }}
//       />
//       <Tab.Screen 
//         name="Profile" 
//         component={ProfileScreen}
//         options={{ title: 'Profile' }}
//       />
//     </Tab.Navigator>
//   );
// };

// export default function App() {
//   const [isLoading, setIsLoading] = React.useState(true);
//   const [userToken, setUserToken] = React.useState(null);

//   React.useEffect(() => {
//     // Check if user is logged in
//     const bootstrapAsync = async () => {
//       try {
//         const token = await AsyncStorage.getItem('token');
//         setUserToken(token);
//       } catch (e) {
//         console.error('Failed to get token:', e);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     bootstrapAsync();
//   }, []);

//   if (isLoading) {
//     return null; // Or a loading screen
//   }

//   return (
//     <NavigationContainer>
//       <Stack.Navigator>
//         {userToken == null ? (
//           // Auth screens
//           <>
//             <Stack.Screen 
//               name="Login" 
//               component={LoginScreen} 
//               options={{ headerShown: false }}
//             />
//             <Stack.Screen 
//               name="Register" 
//               component={RegisterScreen} 
//               options={{ headerShown: false }}
//             />
//           </>
//         ) : (
//           // Main app screens
//           <Stack.Screen
//             name="MainApp"
//             component={MainTabs}
//             options={{ headerShown: false }}
//           />
//         )}
//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// }

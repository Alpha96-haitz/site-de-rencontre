import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Suspense, lazy } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from '../components/LoadingScreen';
import { colors } from '../theme/colors';

const LoginScreen = lazy(() => import('../screens/auth/LoginScreen'));
const SignupScreen = lazy(() => import('../screens/auth/SignupScreen'));
const FeedScreen = lazy(() => import('../screens/home/FeedScreen'));
const DiscoverScreen = lazy(() => import('../screens/home/DiscoverScreen'));
const MatchesScreen = lazy(() => import('../screens/home/MatchesScreen'));
const MessagesScreen = lazy(() => import('../screens/home/MessagesScreen'));
const SearchScreen = lazy(() => import('../screens/home/SearchScreen'));
const NotificationsScreen = lazy(() => import('../screens/home/NotificationsScreen'));
const ProfileScreen = lazy(() => import('../screens/home/ProfileScreen'));
const EditProfileScreen = lazy(() => import('../screens/home/EditProfileScreen'));
const EmailVerificationScreen = lazy(() => import('../screens/auth/EmailVerificationScreen'));
const ForgotPasswordScreen = lazy(() => import('../screens/auth/ForgotPasswordScreen'));

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AuthStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Signup" component={SignupScreen} options={{ title: 'Inscription' }} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ title: 'Mon Profil', headerShown: false }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Modifier Profil' }} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textGhost,
      tabBarLabelStyle: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', marginBottom: 6 },
      tabBarStyle: { 
        position: 'absolute',
        bottom: 12,
        left: 16,
        right: 16,
        height: 64, 
        paddingTop: 8, 
        paddingBottom: 8, 
        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
        borderTopWidth: 0, 
        borderRadius: 32,
        elevation: 10, 
        shadowColor: '#000', 
        shadowOpacity: 0.1, 
        shadowOffset: { width: 0, height: 10 },
        shadowRadius: 20
      },
      tabBarIcon: ({ focused, color }) => {
        const map = {
          Feed: focused ? 'home' : 'home-outline',
          Discover: focused ? 'compass' : 'compass-outline',
          Search: focused ? 'search' : 'search-outline',
          Matches: focused ? 'heart' : 'heart-outline',
          Messages: focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline',
          Notifications: focused ? 'notifications' : 'notifications-outline',
          Profile: focused ? 'person' : 'person-outline' // Caché si besoin
        };
        return <Ionicons name={map[route.name]} size={focused ? 26 : 24} color={color} style={focused ? { transform: [{ scale: 1.1 }] } : {}} />;
      }
    })}>
      <Tab.Screen name="Feed" component={FeedScreen} options={{ title: 'Accueil' }} />
      <Tab.Screen name="Discover" component={DiscoverScreen} options={{ title: 'Découvrir' }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ title: 'Recherche' }} />
      <Tab.Screen name="Matches" component={MatchesScreen} options={{ title: 'Matchs' }} />
      <Tab.Screen name="Messages" component={MessagesScreen} options={{ title: 'Messages' }} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Alertes' }} />
      <Tab.Screen name="Profile" component={ProfileStack} options={{ title: 'Profil', tabBarButton: () => null }} />
    </Tab.Navigator>
  );
}

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.bg }
};

export default function AppNavigator() {
  const { loading, token, isEmailVerified } = useAuth();
  if (loading) return <LoadingScreen />;

  return (
    <NavigationContainer theme={navTheme}>
      <Suspense fallback={<LoadingScreen />}>
        {!token ? (
          <AuthStack />
        ) : !isEmailVerified ? (
          <EmailVerificationScreen />
        ) : (
          <MainTabs />
        )}
      </Suspense>
    </NavigationContainer>
  );
}

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
const AdminDashboardScreen = lazy(() => import('../screens/admin/AdminDashboardScreen'));

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
  const { user } = useAuth();
  const { theme, isDark } = useTheme();

  return (
    <Tab.Navigator screenOptions={({ route }) => ({
      headerShown: false,
      tabBarShowLabel: true,
      tabBarActiveTintColor: theme.primary,
      tabBarInactiveTintColor: isDark ? theme.textGhost : theme.textGhost,
      tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginBottom: 8, marginTop: -4 },
      tabBarStyle: { 
        position: 'absolute',
        bottom: 16,
        left: 16,
        right: 16,
        height: 70, 
        paddingTop: 8, 
        paddingBottom: 8, 
        backgroundColor: isDark ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)', 
        borderWidth: 1, 
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
        borderRadius: 35,
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
          Profile: focused ? 'person' : 'person-outline'
        };
        const iconName = map[route.name];
        if (!iconName) return null;
        return <Ionicons name={iconName} size={24} color={color} />;
      }
    })}>
      <Tab.Screen name="Feed" component={FeedScreen} options={{ title: 'Accueil' }} />
      <Tab.Screen name="Discover" component={DiscoverScreen} options={{ title: 'Découvrir' }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarItemStyle: { display: 'none' }, tabBarButton: () => null }} />
      <Tab.Screen name="Matches" component={MatchesScreen} options={{ title: 'Likes' }} />
      <Tab.Screen name="Messages" component={MessagesScreen} options={{ title: 'Messages', tabBarBadge: user?.unreadMessages > 0 ? user.unreadMessages : undefined, tabBarBadgeStyle: { backgroundColor: theme.danger, color: '#fff', fontSize: 11, minWidth: 18, height: 18, lineHeight: 18 } }} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Alertes', tabBarBadge: user?.unreadNotifications > 0 ? user.unreadNotifications : undefined, tabBarBadgeStyle: { backgroundColor: theme.danger, color: '#fff', fontSize: 11, minWidth: 18, height: 18, lineHeight: 18 } }} />
      <Tab.Screen name="Profile" component={ProfileStack} options={{ tabBarItemStyle: { display: 'none' }, tabBarButton: () => null }} />
      <Tab.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ tabBarItemStyle: { display: 'none' }, tabBarButton: () => null }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { loading, token, isEmailVerified } = useAuth();
  const { isDark, theme } = useTheme();
  
  if (loading) return <LoadingScreen />;

  const navTheme = {
    ...DefaultTheme,
    colors: { 
      ...DefaultTheme.colors, 
      background: theme.bg,
      card: theme.surface,
      text: theme.text,
      border: theme.border,
    }
  };

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
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

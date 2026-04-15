import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Suspense, lazy, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSocket } from '../contexts/SocketContext';
import LoadingScreen from '../components/LoadingScreen';
import TopHeader from '../components/TopHeader';

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
const PostDetailScreen = lazy(() => import('../screens/home/PostDetailScreen'));

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

function MainTabs() {
  const { user, updateLocalUser } = useAuth();
  const { theme, isDark } = useTheme();
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;
    
    const onNotifUpdate = (data) => {
       if (typeof data?.count === 'number') {
         updateLocalUser({ unreadNotifications: Math.max(0, data.count) });
       }
    };
    
    const onMsgUpdate = (data) => {
       if (typeof data?.count === 'number') {
         updateLocalUser({ unreadMessages: Math.max(0, data.count) });
       } else if (typeof data?.delta === 'number') {
         updateLocalUser(prev => ({ unreadMessages: Math.max(0, (prev.unreadMessages || 0) + data.delta) }));
       }
    };

    socket.on('notification:unread-update', onNotifUpdate);
    socket.on('message:unread-update', onMsgUpdate);

    return () => {
      socket.off('notification:unread-update', onNotifUpdate);
      socket.off('message:unread-update', onMsgUpdate);
    };
  }, [socket, updateLocalUser]);

  return (
    <Tab.Navigator screenOptions={({ route, navigation }) => ({
      headerShown: true,
      header: (props) => <TopHeader {...props} navigation={navigation} />,
      tabBarShowLabel: true,
      tabBarActiveTintColor: theme.primary,
      tabBarInactiveTintColor: theme.textGhost,
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
          Matches: focused ? 'heart' : 'heart-outline',
          Messages: focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline',
          Notifications: focused ? 'notifications' : 'notifications-outline',
        };
        const iconName = map[route.name];
        if (!iconName) return null;
        return <Ionicons name={iconName} size={24} color={color} />;
      }
    })}>
      <Tab.Screen name="Feed" component={FeedScreen} options={{ title: 'Accueil' }} />
      <Tab.Screen name="Discover" component={DiscoverScreen} options={{ title: 'Découvrir' }} />
      <Tab.Screen name="Matches" component={MatchesScreen} options={{ title: 'Likes' }} />
      <Tab.Screen name="Messages" component={MessagesScreen} options={{ title: 'Messages', tabBarBadge: user?.unreadMessages > 0 ? user.unreadMessages : undefined, tabBarBadgeStyle: { backgroundColor: theme.danger, color: '#fff', fontSize: 11, minWidth: 18, height: 18, lineHeight: 18 } }} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Alertes', tabBarBadge: user?.unreadNotifications > 0 ? user.unreadNotifications : undefined, tabBarBadgeStyle: { backgroundColor: theme.danger, color: '#fff', fontSize: 11, minWidth: 18, height: 18, lineHeight: 18 } }} />
    </Tab.Navigator>
  );
}

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="Search" component={SearchScreen} options={{ animation: 'fade_from_bottom' }} />
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Modifier Profil', headerShown: true }} />
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} options={{ title: 'Publication', headerShown: true }} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { loading, token, isEmailVerified } = useAuth();
  const { isDark, theme } = useTheme();
  
  if (loading) return <LoadingScreen />;

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    dark: isDark,
    colors: { 
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.bg,
      card: theme.surface,
      text: theme.text,
      border: theme.border,
      notification: theme.primary,
    }
  };

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={theme.bg} translucent={false} />
      <Suspense fallback={<LoadingScreen />}>
        {!token ? (
          <AuthStack />
        ) : !isEmailVerified ? (
          <EmailVerificationScreen />
        ) : (
          <HomeStack />
        )}
      </Suspense>
    </NavigationContainer>
  );
}

import React from 'react';
import { StyleSheet, View, TextInput, Pressable, Text } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import Avatar from './Avatar';

export default function TopHeader({ 
  navigation, 
  user, 
  onShowProfileMenu, 
  unreadNotifications = 0 
}) {
  const insets = useSafeAreaInsets();
  const { isDark, toggleTheme, theme } = useTheme();

  return (
    <View style={[
      styles.headerContainer, 
      { 
        paddingTop: insets.top,
        backgroundColor: theme.surface,
        borderBottomColor: theme.border
      }
    ]}>
      <View style={styles.headerRow}>
        <Image source={require('../../../assets/logo.png')} style={styles.headerLogo} contentFit="contain" />
        
        <View style={[styles.searchBar, { backgroundColor: theme.inputBg }]}>
          <Ionicons name="search" size={16} color={theme.textGhost} />
          <TextInput 
            placeholder="Rechercher..." 
            placeholderTextColor={theme.textGhost} 
            style={[styles.searchInput, { color: theme.text }]}
            onFocus={() => navigation.navigate('Search')}
          />
        </View>

        <View style={styles.headerActions}>
          <Pressable onPress={toggleTheme}>
            <Ionicons 
              name={isDark ? "sunny-outline" : "moon-outline"} 
              size={24} 
              color={theme.text} 
            />
          </Pressable>
          
          <Pressable style={styles.bellBtn} onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={24} color={theme.text} />
            {unreadNotifications > 0 && (
              <View style={[styles.badge, { borderColor: theme.surface }]}>
                <Text style={styles.badgeText}>{unreadNotifications}</Text>
              </View>
            )}
          </Pressable>

          <Pressable onPress={onShowProfileMenu}>
            <Avatar uri={user?.photos?.find?.(p => p.isPrimary)?.url || user?.googlePhoto} size={32} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: { borderBottomWidth: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60, gap: 12 },
  headerLogo: { width: 36, height: 36 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 12, height: 36, gap: 6 },
  searchInput: { flex: 1, fontSize: 14 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  bellBtn: { position: 'relative' },
  badge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#EF4444', width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' }
});

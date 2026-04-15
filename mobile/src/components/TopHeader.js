import React, { useState } from 'react';
import { StyleSheet, View, TextInput, Pressable, Text, Modal } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import Avatar from './Avatar';

export default function TopHeader({ navigation }) {
  const insets = useSafeAreaInsets();
  const { isDark, toggleTheme, theme } = useTheme();
  const { user, logout, refreshUser } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const unreadNotifications = user?.unreadNotifications || 0;

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
        <Image source={require('../../assets/logo.png')} style={styles.headerLogo} contentFit="contain" />
        
        <Pressable 
          style={[styles.searchBar, { backgroundColor: theme.inputBg }]}
          onPress={() => navigation.navigate('Search')}
        >
          <Ionicons name="search" size={16} color={theme.textGhost} />
          <Text style={[styles.placeholderText, { color: theme.textGhost }]}>Rechercher...</Text>
        </Pressable>

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

          <Pressable onPress={() => setShowProfileMenu(true)}>
            <Avatar uri={user?.photos?.find?.(p => p.isPrimary)?.url || user?.googlePhoto} size={32} />
          </Pressable>
        </View>
      </View>

      <Modal visible={showProfileMenu} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowProfileMenu(false)}>
          <View style={[styles.profileMenu, { top: insets.top + 50, backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Pressable style={styles.menuItem} onPress={() => { setShowProfileMenu(false); navigation.navigate('ProfileMain', { userId: user?._id }); }}>
              <Ionicons name="person-circle-outline" size={20} color={theme.text} />
              <Text style={[styles.menuItemText, { color: theme.text }]}>Mon Profil</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={() => { setShowProfileMenu(false); navigation.navigate('EditProfile'); }}>
              <Ionicons name="settings-outline" size={20} color={theme.text} />
              <Text style={[styles.menuItemText, { color: theme.text }]}>Paramètres</Text>
            </Pressable>
            <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

            {(user?.role === 'admin' || user?.role === 'root') && (
              <>
                <Pressable style={styles.menuItem} onPress={() => { setShowProfileMenu(false); navigation.navigate('AdminDashboard'); }}>
                  <Ionicons name="shield-checkmark-outline" size={20} color={theme.primary} />
                  <Text style={[styles.menuItemText, { color: theme.primary }]}>Contrôle Admin</Text>
                </Pressable>
                <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />
              </>
            )}

            <Pressable style={styles.menuItem} onPress={async () => { setShowProfileMenu(false); await refreshUser(); await logout(); }}>
              <Ionicons name="log-out-outline" size={20} color={theme.danger} />
              <Text style={[styles.menuItemText, { color: theme.danger }]}>Se déconnecter</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: { borderBottomWidth: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60, gap: 12 },
  headerLogo: { width: 36, height: 36 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 12, height: 36, gap: 8 },
  placeholderText: { fontSize: 13, fontWeight: '500' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  bellBtn: { position: 'relative' },
  badge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#EF4444', width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.1)' },
  profileMenu: {
    position: 'absolute',
    right: 16,
    width: 200,
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderRadius: 12,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '600',
  },
  menuDivider: {
    height: 1,
    marginVertical: 4,
    marginHorizontal: 8,
  }
});

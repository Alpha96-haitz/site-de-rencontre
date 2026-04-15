import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '../../services/adminService';
import { colors } from '../../theme/colors';
import Avatar from '../../components/Avatar';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function AdminDashboardScreen({ navigation }) {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const [users, setUsers] = useState([]);
  // ... (rest of state)
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('users');
  const [search, setSearch] = useState('');
  const [notifTargetReport, setNotifTargetReport] = useState(null);
  const [notifMessage, setNotifMessage] = useState('');

  // Styles dynamiques basés sur le thème
  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 58,
      backgroundColor: theme.surface,
      paddingHorizontal: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.border
    },
    headerTitle: { fontSize: 18, fontWeight: '800', color: theme.text },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
    statBox: { width: '48%', backgroundColor: theme.surfaceLighter, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: theme.border },
    statVal: { fontSize: 20, fontWeight: '900', color: theme.primary },
    statLabel: { fontSize: 11, fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase' },
    tabRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
    tabBtn: { flex: 1, backgroundColor: theme.surface, borderRadius: 10, borderWidth: 1, borderColor: theme.border, paddingVertical: 10, alignItems: 'center' },
    tabBtnActive: { backgroundColor: isDark ? '#3d162d' : '#fce7f3', borderColor: isDark ? '#be185d' : '#f9a8d4' },
    tabText: { fontWeight: '800', color: theme.textMuted, fontSize: 12, textTransform: 'uppercase' },
    tabTextActive: { color: isDark ? '#f472b6' : '#be185d' },
    searchBox: { backgroundColor: theme.surface, borderRadius: 10, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, gap: 6, height: 42, marginBottom: 10 },
    searchInput: { flex: 1, color: theme.text, fontSize: 14 },
    rowCard: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 12, marginBottom: 10 },
    userInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    userName: { color: theme.text, fontWeight: '800', fontSize: 15 },
    userMeta: { color: theme.textMuted, fontSize: 12, marginTop: 2 },
    actions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    actionBtn: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
    actionBtnText: { color: '#fff', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
    danger: { backgroundColor: '#ef4444' },
    good: { backgroundColor: '#16a34a' },
    info: { backgroundColor: '#2563eb' },
    neutral: { backgroundColor: theme.textMuted },
    reportTitle: { color: theme.text, fontWeight: '900', fontSize: 14, marginBottom: 4 },
    reportReason: { color: '#be123c', fontWeight: '800', fontSize: 13 },
    reportDesc: { color: theme.text, marginTop: 6, lineHeight: 19, fontSize: 13 },
    reportMeta: { color: theme.textMuted, marginTop: 8, fontSize: 12 },
    reportActions: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
    emptyBox: { paddingVertical: 34, alignItems: 'center' },
    emptyText: { color: theme.textMuted, fontWeight: '700' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
    modalCard: { backgroundColor: theme.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.border, padding: 14 },
    modalTitle: { color: theme.text, fontWeight: '900', fontSize: 16, marginBottom: 10 },
    modalInput: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      padding: 10,
      color: theme.text,
      minHeight: 90,
      textAlignVertical: 'top',
      backgroundColor: theme.surfaceLighter
    },
    modalActions: { flexDirection: 'row', gap: 8, marginTop: 12 }
  }), [theme, isDark]);

  const loadData = useCallback(async () => {
    try {
      const [statsData, usersData, reportsData] = await Promise.all([
        adminService.getStats(),
        adminService.getUsers(),
        adminService.getReports()
      ]);
      setStats(statsData || {});
      setUsers(usersData || []);
      setReports(reportsData || []);
    } catch (err) {
      Alert.alert('Erreur', "Impossible de charger les donnees d'administration.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const full = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
      const username = String(u.username || '').toLowerCase();
      const email = String(u.email || '').toLowerCase();
      return full.includes(q) || username.includes(q) || email.includes(q);
    });
  }, [users, search]);

  const toggleBan = async (target) => {
    try {
      if (target.isBanned) await adminService.unbanUser(target._id);
      else await adminService.banUser(target._id, 30);
      await loadData();
    } catch {
      Alert.alert('Erreur', "Impossible de modifier le statut de l'utilisateur.");
    }
  };

  const deleteUser = async (target) => {
    if (user?.role !== 'root') return;
    Alert.alert('Supprimer', 'Confirmer la suppression definitive de ce compte ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await adminService.deleteUser(target._id);
            await loadData();
          } catch (err) {
            Alert.alert('Erreur', err?.response?.data?.message || 'Suppression impossible.');
          }
        }
      }
    ]);
  };

  const processReport = async (reportId, action, shouldBan) => {
    try {
      await adminService.handleReport(reportId, action, shouldBan);
      await loadData();
    } catch {
      Alert.alert('Erreur', 'Impossible de traiter ce signalement.');
    }
  };

  const sendNotificationToReported = async () => {
    if (!notifTargetReport || !notifMessage.trim()) {
      Alert.alert('Message requis', 'Ajoutez un message avant envoi.');
      return;
    }
    try {
      await adminService.notifyReportedUser(notifTargetReport, notifMessage.trim());
      setNotifTargetReport(null);
      setNotifMessage('');
      await loadData();
      Alert.alert('Succes', 'Notification envoyee.');
    } catch (err) {
      Alert.alert('Erreur', err?.response?.data?.message || 'Envoi impossible.');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={{ paddingRight: 16 }}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Controle Admin</Text>
      </View>

      <FlatList
        data={tab === 'users' ? filteredUsers : reports}
        keyExtractor={(item) => String(item._id)}
        contentContainerStyle={{ padding: 14, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{stats?.users || 0}</Text>
                <Text style={styles.statLabel}>Utilisateurs</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{stats?.online || 0}</Text>
                <Text style={styles.statLabel}>En ligne</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{stats?.matches || 0}</Text>
                <Text style={styles.statLabel}>Matchs</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{stats?.reports || 0}</Text>
                <Text style={styles.statLabel}>Signalements</Text>
              </View>
            </View>

            <View style={styles.tabRow}>
              <Pressable style={[styles.tabBtn, tab === 'users' && styles.tabBtnActive]} onPress={() => setTab('users')}>
                <Text style={[styles.tabText, tab === 'users' && styles.tabTextActive]}>Utilisateurs</Text>
              </Pressable>
              <Pressable style={[styles.tabBtn, tab === 'reports' && styles.tabBtnActive]} onPress={() => setTab('reports')}>
                <Text style={[styles.tabText, tab === 'reports' && styles.tabTextActive]}>Signalements</Text>
              </Pressable>
            </View>

            {tab === 'users' && (
              <View style={styles.searchBox}>
                <Ionicons name="search" size={16} color={colors.textGhost} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Rechercher un utilisateur..."
                  placeholderTextColor={colors.textGhost}
                  style={styles.searchInput}
                />
              </View>
            )}
          </>
        }
        renderItem={({ item }) =>
          tab === 'users' ? (
            <View style={styles.rowCard}>
              <View style={styles.userInfo}>
                <Avatar uri={item?.photos?.find?.((p) => p.isPrimary)?.url || item?.googlePhoto} size={42} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName}>{item.firstName} {item.lastName}</Text>
                  <Text style={styles.userMeta}>@{item.username} - {item.email}</Text>
                </View>
              </View>
              <View style={styles.actions}>
                <Pressable style={[styles.actionBtn, item.isBanned ? styles.good : styles.danger]} onPress={() => toggleBan(item)}>
                  <Text style={styles.actionBtnText}>{item.isBanned ? 'Debannir' : 'Bannir'}</Text>
                </Pressable>
                {user?.role === 'root' && item.role !== 'root' && (
                  <Pressable style={[styles.actionBtn, styles.neutral]} onPress={() => deleteUser(item)}>
                    <Text style={styles.actionBtnText}>Supprimer</Text>
                  </Pressable>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.rowCard}>
              <Text style={styles.reportTitle}>
                {item.reportedUser?.firstName} {item.reportedUser?.lastName} - @{item.reportedUser?.username}
              </Text>
              <Text style={styles.reportReason}>Motif: {item.reason}</Text>
              {!!item.description && <Text style={styles.reportDesc}>{item.description}</Text>}
              <Text style={styles.reportMeta}>
                Signale par {item.reporter?.firstName} {item.reporter?.lastName}
              </Text>

              <View style={styles.reportActions}>
                <Pressable style={[styles.actionBtn, styles.neutral]} onPress={() => processReport(item._id, 'dismissed', false)}>
                  <Text style={styles.actionBtnText}>Classer</Text>
                </Pressable>
                <Pressable style={[styles.actionBtn, styles.danger]} onPress={() => processReport(item._id, 'action_taken', true)}>
                  <Text style={styles.actionBtnText}>Bannir</Text>
                </Pressable>
                <Pressable style={[styles.actionBtn, styles.info]} onPress={() => setNotifTargetReport(item._id)}>
                  <Text style={styles.actionBtnText}>Notifier</Text>
                </Pressable>
              </View>
            </View>
          )
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              {tab === 'users' ? 'Aucun utilisateur trouve.' : 'Aucun signalement en attente.'}
            </Text>
          </View>
        }
      />

      <Modal visible={!!notifTargetReport} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Envoyer une notification</Text>
            <TextInput
              value={notifMessage}
              onChangeText={setNotifMessage}
              placeholder="Ecrivez votre message..."
              placeholderTextColor={colors.textGhost}
              style={styles.modalInput}
              multiline
            />
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.actionBtn, styles.neutral, { flex: 1 }]}
                onPress={() => {
                  setNotifTargetReport(null);
                  setNotifMessage('');
                }}
              >
                <Text style={styles.actionBtnText}>Annuler</Text>
              </Pressable>
              <Pressable style={[styles.actionBtn, styles.info, { flex: 1 }]} onPress={sendNotificationToReported}>
                <Text style={styles.actionBtnText}>Envoyer</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Fin des styles dynamiques


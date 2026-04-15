import React, { memo, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View, Modal } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Avatar from './Avatar';
import { postService } from '../services/postService';
import { userService } from '../services/userService';
import { colors } from '../theme/colors';
import { useTheme } from '../contexts/ThemeContext';

const resolvePostImages = (post) => {
  if (Array.isArray(post?.images) && post.images.length > 0) return post.images;
  if (post?.image) return [post.image];
  return [];
};

const formatRelativeTime = (date) => {
  if (!date) return '';
  const now = new Date();
  const diff = Math.floor((now - new Date(date)) / 1000);

  if (diff < 0) return "À l'instant";
  if (diff < 60) return `Il y a ${diff}s`;
  if (diff < 3600) {
    const min = Math.floor(diff / 60);
    return `Il y a ${min} min`;
  }
  if (diff < 86400) {
    const hours = Math.floor(diff / 3600);
    return `Il y a ${hours}h`;
  }
  if (diff < 2592000) {
    const days = Math.floor(diff / 86400);
    return `Il y a ${days}j`;
  }
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short'
  });
};

function PostCard({
  post,
  currentUserId,
  userRole,
  isFollowingAuthor,
  onPostChanged,
  onPostDeleted,
  onFollowChanged,
  onOpenProfile
}) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const author = post?.userId || {};
  const authorId = author?._id;
  const myId = currentUserId ? String(currentUserId) : '';
  const isMine = authorId && String(authorId) === myId;
  const canDelete = isMine || userRole === 'root' || userRole === 'admin';
  const canFollow = Boolean(authorId) && !isMine;

  const images = useMemo(() => resolvePostImages(post), [post]);
  const hasLiked = useMemo(
    () => (post?.likes || []).some((id) => String(id) === myId),
    [post?.likes, myId]
  );

  const [commentText, setCommentText] = useState('');
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);
  const [commentBusy, setCommentBusy] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [showPostMenu, setShowPostMenu] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const handleEdit = () => {
    Alert.alert('Info', 'La modification de publication sera bientôt disponible !');
  };

  const handleLike = async () => {
    if (likeBusy) return;
    setLikeBusy(true);
    const currentLikes = Array.isArray(post.likes) ? post.likes : [];
    const nextLikes = hasLiked
      ? currentLikes.filter((id) => String(id) !== myId)
      : [...currentLikes, myId];

    onPostChanged?.({ ...post, likes: nextLikes });
    try {
      await postService.like(post._id);
    } catch (err) {
      onPostChanged?.(post);
      Alert.alert('Erreur', 'Impossible de liker cette publication.');
    } finally {
      setLikeBusy(false);
    }
  };

  const handleComment = async () => {
    const clean = commentText.trim();
    if (!clean || commentBusy) return;

    setCommentBusy(true);
    try {
      const result = await postService.comment(post._id, clean);
      const newComment = result?.comment;
      if (newComment) {
        onPostChanged?.({
          ...post,
          comments: [...(post.comments || []), newComment]
        });
      }
      setCommentText('');
      setCommentsOpen(true);
    } catch (err) {
      Alert.alert('Erreur', 'Commentaire non envoyé.');
    } finally {
      setCommentBusy(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer',
      'Voulez-vous vraiment supprimer cette publication ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await postService.delete(post._id);
              onPostDeleted?.(post._id);
            } catch (err) {
              Alert.alert('Erreur', 'Suppression impossible.');
            }
          }
        }
      ]
    );
  };

  const handleFollowToggle = async () => {
    if (!canFollow || followBusy) return;
    const next = !isFollowingAuthor;

    setFollowBusy(true);
    onFollowChanged?.(authorId, next);
    try {
      if (next) {
        await userService.follow(authorId);
      } else {
        await userService.unfollow(authorId);
      }
    } catch (err) {
      onFollowChanged?.(authorId, !next);
      Alert.alert('Erreur', "Impossible de modifier l'abonnement.");
    } finally {
      setFollowBusy(false);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.head}>
        <Pressable
          style={styles.authorPressable}
          onPress={() => onOpenProfile?.(author)}
          disabled={!authorId}
        >
          <Avatar
            uri={
              author?.profilePicture ||
              author?.googlePhoto ||
              author?.photos?.find?.((p) => p.isPrimary)?.url
            }
            size={42}
          />

          <View style={styles.headerText}>
            <Text style={[styles.name, { color: theme.text }]}>
              {author?.firstName || ''} {author?.lastName || ''}
            </Text>
            <Text style={[styles.meta, { color: theme.textMuted }]}>
              {formatRelativeTime(post.createdAt)}
            </Text>
          </View>
        </Pressable>

        <View style={styles.headerActions}>
          {canFollow && (
            <Pressable
              onPress={handleFollowToggle}
              style={[styles.followBtn, isFollowingAuthor && styles.followingBtn]}
            >
              <Text style={[styles.followText, isFollowingAuthor && styles.followingText]}>
                {followBusy ? '...' : isFollowingAuthor ? 'Abonne' : 'Suivre'}
              </Text>
            </Pressable>
          )}

          {canDelete && (
            <Pressable onPress={() => setShowPostMenu(true)} style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
              <Ionicons name="ellipsis-horizontal" size={20} color={theme.textGhost} />
            </Pressable>
          )}
        </View>
      </View>

      {!!post?.desc && <Text style={[styles.desc, { color: theme.text }]}>{post.desc}</Text>}

      {images.length > 0 && (
        <View style={styles.imageGrid}>
          {images.map((uri, idx) => (
            <Pressable key={`${post._id}-img-${idx}`} onPress={() => setSelectedImage(uri)}>
              <Image
                source={{ uri }}
                style={styles.postImage}
                contentFit="cover"
              />
            </Pressable>
          ))}
        </View>
      )}

      {/* Image Zoom Modal */}
      <Modal visible={!!selectedImage} transparent animationType="fade" statusBarTranslucent>
        <Pressable style={styles.fullImageOverlay} onPress={() => setSelectedImage(null)}>
          <Image
            source={{ uri: selectedImage }}
            style={styles.fullImage}
            contentFit="contain"
            transition={300}
          />
          <Pressable style={[styles.closeImageBtn, { top: insets.top + 10 }]} onPress={() => setSelectedImage(null)}>
            <Ionicons name="close-circle" size={40} color="#fff" />
          </Pressable>
        </Pressable>
      </Modal>

      <View style={[styles.footer, { borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
        <Pressable style={styles.iconBtn} onPress={handleLike}>
          <Ionicons
            name={hasLiked ? 'heart' : 'heart-outline'}
            size={18}
            color={hasLiked ? theme.primary : theme.textGhost}
          />
          <Text style={[styles.actionText, { color: theme.textMuted }]}>{post?.likes?.length || 0} J'aime</Text>
        </Pressable>

        <Pressable style={styles.iconBtn} onPress={() => setCommentsOpen((prev) => !prev)}>
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={theme.textGhost} />
          <Text style={[styles.actionText, { color: theme.textMuted }]}>{post?.comments?.length || 0} Commentaires</Text>
        </Pressable>
      </View>

      {commentsOpen && (
        <View style={[styles.commentsBox, { borderTopColor: theme.border }]}>
          {(post.comments || []).slice(-5).map((comment) => {
            const cUser = comment?.userId || {};
            return (
              <View key={String(comment._id || `${comment.createdAt}-${comment.text}`)} style={styles.commentItem}>
                <Avatar
                  uri={
                    cUser?.profilePicture ||
                    cUser?.googlePhoto ||
                    cUser?.photos?.find?.((p) => p.isPrimary)?.url
                  }
                  size={28}
                />
                <View style={[styles.commentBubble, { backgroundColor: theme.inputBg }]}>
                  <Text style={[styles.commentAuthor, { color: theme.text }]}>
                    {cUser?.firstName || ''} {cUser?.lastName || ''}
                  </Text>
                  <Text style={[styles.commentText, { color: theme.text }]}>{comment?.text}</Text>
                </View>
              </View>
            );
          })}

          <View style={styles.commentInputRow}>
            <TextInput
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Ecrire un commentaire..."
              placeholderTextColor={theme.textGhost}
              style={[styles.commentInput, { backgroundColor: theme.inputBg, color: theme.text }]}
            />
            <Pressable onPress={handleComment} disabled={commentBusy} style={styles.sendBtn}>
              <Ionicons
                name="send"
                size={16}
                color={commentBusy ? theme.textGhost : theme.primary}
              />
            </Pressable>
          </View>
        </View>
      )}

      {/* Menu Options Post */}
      <Modal visible={showPostMenu} transparent animationType="fade">
        <Pressable style={styles.menuOverlay} onPress={() => setShowPostMenu(false)}>
          <View style={[styles.postMenuBox, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: isDark ? 1 : 0 }]}>
            {isMine && (
              <Pressable style={styles.menuItem} onPress={() => { setShowPostMenu(false); handleEdit(); }}>
                <Ionicons name="pencil-outline" size={20} color={theme.text} />
                <Text style={[styles.menuItemText, { color: theme.text }]}>Modifier</Text>
              </Pressable>
            )}
            {canDelete && (
              <>
                {isMine && <View style={[styles.menuDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} />}
                <Pressable style={styles.menuItem} onPress={() => { setShowPostMenu(false); handleDelete(); }}>
                  <Ionicons name="trash-outline" size={20} color={colors.danger} />
                  <Text style={[styles.menuItemText, { color: colors.danger }]}>Supprimer</Text>
                </Pressable>
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

export default memo(PostCard);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)'
  },
  head: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  authorPressable: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerText: { flex: 1, marginLeft: 12 },
  name: { fontWeight: '800', color: colors.text, fontSize: 16 },
  meta: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 2,
    letterSpacing: 0.5
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  followBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(236, 72, 153, 0.08)'
  },
  followText: { color: colors.primary, fontWeight: '800', fontSize: 12, letterSpacing: 0.3 },
  followingBtn: { backgroundColor: 'rgba(16, 185, 129, 0.10)' },
  followingText: { color: '#047857' },
  actionBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.03)'
  },
  desc: { color: colors.text, fontSize: 16, lineHeight: 22, marginBottom: 12, fontWeight: '500' },
  imageGrid: { gap: 8, marginBottom: 12 },
  postImage: { width: '100%', height: 260, borderRadius: 14, backgroundColor: colors.inputBg },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.03)'
  },
  iconBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  actionText: { color: colors.textMuted, fontWeight: '700', fontSize: 13 },
  commentsBox: { marginTop: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, gap: 10 },
  commentItem: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  commentBubble: { flex: 1, backgroundColor: colors.inputBg, borderRadius: 14, padding: 10 },
  commentAuthor: { fontWeight: '700', color: colors.text, fontSize: 12, marginBottom: 2 },
  commentText: { color: colors.text, fontSize: 13, lineHeight: 18 },
  commentInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  commentInput: {
    flex: 1,
    minHeight: 40,
    borderRadius: 20,
    backgroundColor: colors.inputBg,
    color: colors.text,
    paddingHorizontal: 14
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(236, 72, 153, 0.08)'
  },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  postMenuBox: { backgroundColor: '#fff', width: 220, borderRadius: 14, padding: 8, elevation: 10, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  menuItemText: { fontSize: 15, fontWeight: '600', color: colors.text },
  menuDivider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginVertical: 4 },
  fullImageOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  fullImage: { width: '100%', height: '100%' },
  closeImageBtn: { position: 'absolute', right: 20, zIndex: 100 }
});

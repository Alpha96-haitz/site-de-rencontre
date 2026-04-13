import React, { useState, useRef, memo } from 'react';
import { Image, Pressable, StyleSheet, Text, View, Animated, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { postService } from '../services/postService';
import Avatar from './Avatar';
import { colors } from '../theme/colors';

function PostCard({ post, currentUserId, userRole, onRefresh }) {
  const author = post.userId || {}; // Corrected from post.user to post.userId based on FeedScreen map
  const hasLiked = (post.likes || []).includes(currentUserId);
  const likeScale = useRef(new Animated.Value(1)).current;
  
  const canDelete = currentUserId === author?._id || userRole === 'root' || userRole === 'admin';

  const handleLike = async () => {
    Animated.sequence([
      Animated.timing(likeScale, { toValue: 1.3, duration: 100, useNativeDriver: true }),
      Animated.spring(likeScale, { toValue: 1, friction: 3, useNativeDriver: true })
    ]).start();
    await postService.like(post._id);
    onRefresh?.();
  };

  const handleDelete = async () => {
    Alert.alert(
      "Supprimer",
      "Voulez-vous vraiment supprimer cette publication ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Supprimer", 
          style: "destructive",
          onPress: async () => {
            try {
              await postService.delete(post._id);
              onRefresh?.();
            } catch (err) {
              console.log('Erreur suppression', err);
            }
          } 
        }
      ]
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Avatar uri={author?.profilePicture || author?.googlePhoto || author?.photos?.find?.((p) => p.isPrimary)?.url} size={42} />
        <View style={styles.headerText}>
          <Text style={styles.name}>{author?.firstName} {author?.lastName}</Text>
          <Text style={styles.meta}>RÉCENT</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {canDelete && (
            <Pressable onPress={handleDelete} style={[styles.followBtn, { backgroundColor: 'rgba(239, 68, 68, 0.08)' }]}>
              <Ionicons name="trash-outline" size={16} color="#ef4444" />
            </Pressable>
          )}
          <Pressable style={styles.followBtn}>
            <Text style={styles.followText}>SUIVRE</Text>
          </Pressable>
        </View>
      </View>

      {!!post.desc && <Text style={styles.desc}>{post.desc}</Text>}
      
      {!!post.image && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: post.image }} style={styles.postImage} resizeMode="cover" />
        </View>
      )}

      {/* Action Footer style Facebook minimal */}
      <View style={styles.footer}>
        <Pressable style={styles.iconBtn} onPress={handleLike}>
          <Animated.View style={{ transform: [{ scale: likeScale }] }}>
            <Ionicons name={hasLiked ? 'heart' : 'heart'} size={18} color={hasLiked ? colors.primary : colors.textGhost} />
          </Animated.View>
          <Text style={styles.actionTextLike}>
            {post.likes?.length || 0} J'AIME
          </Text>
        </Pressable>

        <View style={styles.iconBtn}>
          <Text style={styles.actionTextComments}>{post.comments?.length || 0} Commentaires</Text>
        </View>
      </View>
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
  headerText: { flex: 1, marginLeft: 12 },
  name: { fontWeight: '800', color: colors.text, fontSize: 16 },
  meta: { color: colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginTop: 2, letterSpacing: 0.5 },
  followBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: 'rgba(236, 72, 153, 0.08)' },
  followText: { color: colors.primary, fontWeight: '800', fontSize: 12, letterSpacing: 0.5 },
  desc: { color: colors.text, fontSize: 16, lineHeight: 22, marginBottom: 12, fontWeight: '500' },
  imageContainer: { borderRadius: 16, overflow: 'hidden', marginBottom: 14, backgroundColor: colors.inputBg },
  postImage: { width: '100%', aspectRatio: 4/3 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.03)' },
  iconBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  actionTextLike: { color: colors.textMuted, fontWeight: '800', fontSize: 13, textTransform: 'uppercase' },
  actionTextComments: { color: colors.textMuted, fontWeight: '700', fontSize: 13 }
});

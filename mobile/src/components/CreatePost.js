import React, { useState } from 'react';
import { View, TextInput, Pressable, Text, StyleSheet, Image, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { postService } from '../services/postService';
import Avatar from './Avatar';
import { colors } from '../theme/colors';

export default function CreatePost({ onPostCreated }) {
  const { user } = useAuth();
  const [desc, setDesc] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const primaryPhoto = user?.photos?.find((p) => p.isPrimary) || user?.photos?.[0];
  const avatarUrl = primaryPhoto?.url || user?.googlePhoto;

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0]);
    }
  };

  const handlePost = async () => {
    if (!desc.trim() && !image) return;
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('desc', desc.trim());
      
      if (image) {
        const localUri = image.uri;
        const filename = localUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;
        formData.append('image', { uri: localUri, name: filename, type });
      }

      const newPost = await postService.create(formData);
      setDesc('');
      setImage(null);
      onPostCreated?.(newPost);
    } catch (err) {
      Alert.alert('Erreur', 'Erreur lors de la publication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.createBox}>
      <View style={styles.row}>
        <Avatar uri={avatarUrl} size={48} />
        <TextInput
          value={desc}
          onChangeText={setDesc}
          placeholder={`Quoi de neuf, ${user?.firstName || 'utilisateur'} ?`}
          placeholderTextColor={colors.textGhost}
          style={styles.input}
        />
      </View>

      {image && (
        <View style={styles.previewContainer}>
          <Image source={{ uri: image.uri }} style={styles.preview} />
          <Pressable style={styles.removeBtn} onPress={() => setImage(null)}>
            <Ionicons name="close" size={20} color="#fff" />
          </Pressable>
        </View>
      )}

      <View style={styles.footerRow}>
        <Pressable style={styles.actionBtn} onPress={pickImage} disabled={loading}>
          <Ionicons name="image-outline" size={20} color={colors.textMuted} />
          <Text style={styles.actionText}>PHOTO</Text>
        </Pressable>
        <Pressable 
          style={[styles.postBtn, (!desc.trim() && !image) && styles.postBtnDisabled]} 
          onPress={handlePost} 
          disabled={loading || (!desc.trim() && !image)}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="send" size={14} color="#fff" />
              <Text style={styles.postText}>Publier</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  createBox: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
    marginTop: 10
  },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  input: { flex: 1, backgroundColor: colors.inputBg, minHeight: 48, borderRadius: 24, color: colors.text, fontSize: 16, paddingHorizontal: 16 },
  previewContainer: { marginTop: 16, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  preview: { width: '100%', height: 200, resizeMode: 'cover' },
  removeBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12 },
  actionText: { color: colors.textMuted, fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
  postBtn: { flexDirection: 'row', gap: 8, backgroundColor: '#F472B6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  postBtnDisabled: { backgroundColor: colors.border },
  postText: { color: '#fff', fontWeight: '800', fontSize: 14 }
});

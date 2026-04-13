import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, PanResponder, Pressable, StyleSheet, Text, View, Dimensions, Platform } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { userService } from '../../services/userService';
import { matchService } from '../../services/matchService';
import { colors } from '../../theme/colors';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;

export default function DiscoverScreen() {
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const pos = useRef(new Animated.ValueXY()).current;
  const isActionRunning = useRef(false);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const data = await userService.suggestions(30);
      setCards(data || []);
      setIndex(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const current = cards[index];

  const swipeOut = (toRight, callback) => {
    if (isActionRunning.current) return;
    isActionRunning.current = true;
    Animated.timing(pos, {
      toValue: { x: toRight ? width + 100 : -width - 100, y: 0 },
      duration: 250,
      useNativeDriver: true
    }).start(() => {
      pos.setValue({ x: 0, y: 0 });
      callback?.().finally(() => {
        isActionRunning.current = false;
      });
    });
  };

  const swipeUp = (callback) => {
    if (isActionRunning.current) return;
    isActionRunning.current = true;
    Animated.timing(pos, {
      toValue: { x: 0, y: -height - 100 },
      duration: 250,
      useNativeDriver: true
    }).start(() => {
      pos.setValue({ x: 0, y: 0 });
      callback?.().finally(() => {
        isActionRunning.current = false;
      });
    });
  };

  const act = async (type) => {
    if (!current) return;
    try {
      if (type === 'like' || type === 'superlike') {
        const data = await matchService.like(current._id);
        if (data?.isMutual) {
          Alert.alert('🎉 Nouveau Match !', `Tu as matché avec ${current.firstName} !`);
        }
      } else {
        await matchService.dislike(current._id);
      }
    } catch (err) {
      console.log('Swipe error', err);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 12 && !isActionRunning.current,
      onPanResponderMove: (_, g) => pos.setValue({ x: g.dx, y: g.dy }),
      onPanResponderRelease: async (_, g) => {
        if (isActionRunning.current) return;
        
        if (g.dy < -SWIPE_THRESHOLD && Math.abs(g.dx) < 60) {
          // Super Like
          swipeUp(async () => {
            await act('superlike');
            setIndex((i) => i + 1);
          });
        }
        else if (g.dx > SWIPE_THRESHOLD) {
          swipeOut(true, async () => {
            await act('like');
            setIndex((i) => i + 1);
          });
        } else if (g.dx < -SWIPE_THRESHOLD) {
          swipeOut(false, async () => {
            await act('dislike');
            setIndex((i) => i + 1);
          });
        } else {
          Animated.spring(pos, { toValue: { x: 0, y: 0 }, friction: 5, useNativeDriver: true }).start();
        }
      }
    })
  ).current;

  if (loading) return <View style={styles.center}><Text style={styles.emptyText}>Recherche de profils...</Text></View>;
  
  if (!current) {
    return (
      <View style={styles.center}>
        <View style={styles.radarBox}>
          <Image source={require('../../../assets/logo.png')} style={{width: 60, height: 60, opacity: 0.2}} contentFit="contain" />
        </View>
        <Text style={styles.empty}>Vous avez vu tous les profils !</Text>
        <Pressable style={styles.actionBtn} onPress={fetchCards}>
          <Text style={styles.actionText}>Chercher à nouveau</Text>
        </Pressable>
      </View>
    );
  }

  const rotate = pos.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: ['-8deg', '0deg', '8deg'],
    extrapolate: 'clamp'
  });

  const nopeOpacity = pos.x.interpolate({ inputRange: [-width / 4, 0], outputRange: [1, 0], extrapolate: 'clamp' });
  const likeOpacity = pos.x.interpolate({ inputRange: [0, width / 4], outputRange: [0, 1], extrapolate: 'clamp' });
  const superLikeOpacity = pos.y.interpolate({ inputRange: [-height / 4, 0], outputRange: [1, 0], extrapolate: 'clamp' });

  const nextCard = cards[index + 1];

  return (
    <View style={styles.container}>
      <View style={styles.cardContainer}>
        {/* Next Card */}
        {nextCard && (
          <View style={[styles.card, styles.nextCard]}>
            <Image source={nextCard.photos?.find?.(p => p.isPrimary)?.url || nextCard.googlePhoto || 'https://placehold.co/600x800'} style={styles.image} contentFit="cover" />
          </View>
        )}

        {/* Current Card */}
        <Animated.View
          {...panResponder.panHandlers}
          style={[styles.card, styles.activeCard, { transform: [{ translateX: pos.x }, { translateY: pos.y }, { rotate }] }]}
        >
          <Image source={current?.photos?.find?.(p => p.isPrimary)?.url || current?.googlePhoto || 'https://placehold.co/600x800'} style={styles.image} contentFit="cover" transition={200} />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.gradient}>
            <View style={styles.infoContent}>
               <Text style={styles.name}>{current.firstName}  <Text style={styles.age}>{current.age || '22'}</Text></Text>
               <View style={styles.locationRow}>
                 <Ionicons name="location" size={16} color="#fff" />
                 <Text style={styles.locationText}>{current.location?.city || 'Près de chez vous'}</Text>
               </View>
            </View>
            <Pressable style={styles.infoBtn}>
              <Ionicons name="information" size={20} color="#000" />
            </Pressable>
          </LinearGradient>

          {/* Swipe Indication Labels */}
          <Animated.View style={[styles.labelWrap, styles.nopeLabelWrap, { opacity: nopeOpacity }]}>
            <Text style={styles.nopeLabel}>NOPE</Text>
          </Animated.View>
          <Animated.View style={[styles.labelWrap, styles.likeLabelWrap, { opacity: likeOpacity }]}>
            <Text style={styles.likeLabel}>LIKE</Text>
          </Animated.View>
          <Animated.View style={[styles.labelWrap, styles.superLabelWrap, { opacity: superLikeOpacity }]}>
            <Text style={styles.superLabel}>SUPER</Text>
          </Animated.View>
        </Animated.View>
      </View>

      {/* Action Row - ajusté pour ne pas être caché par la Tab Bar */}
      <View style={styles.actionRow}>
        {/* Rewind */}
        <Pressable style={[styles.btnSmall, styles.shadow]}>
          <Ionicons name="refresh" size={24} color="#F5B748" />
        </Pressable>
        {/* Dislike */}
        <Pressable style={[styles.btnLarge, styles.shadow]} onPress={() => swipeOut(false, async () => { await act('dislike'); setIndex(i => i + 1); })}>
          <Ionicons name="close" size={36} color="#FF4458" />
        </Pressable>
        {/* Super Like */}
        <Pressable style={[styles.btnMedium, styles.shadow]} onPress={() => swipeUp(async () => { await act('superlike'); setIndex(i => i + 1); })}>
          <Ionicons name="star" size={24} color="#2DB1FF" />
        </Pressable>
        {/* Like */}
        <Pressable style={[styles.btnLarge, styles.shadow]} onPress={() => swipeOut(true, async () => { await act('like'); setIndex(i => i + 1); })}>
          <MaterialCommunityIcons name="heart" size={36} color="#17E08F" style={{ marginTop: 2 }} />
        </Pressable>
        {/* Boost */}
        <Pressable style={[styles.btnSmall, styles.shadow]}>
          <Ionicons name="flash" size={24} color="#9436EC" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  radarBox: { width: 140, height: 140, borderRadius: 70, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 4, borderColor: '#fff', elevation: 2 },
  empty: { color: colors.textMuted, fontSize: 18, fontWeight: '700', marginBottom: 24 },
  emptyText: { color: colors.textMuted, fontSize: 16 },
  actionBtn: { backgroundColor: colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 30, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  actionText: { color: '#fff', fontWeight: '800', fontSize: 16, textTransform: 'uppercase' },

  cardContainer: { flex: 1, paddingHorizontal: 8, paddingTop: 16, paddingBottom: 10 },
  card: { position: 'absolute', top: 16, left: 8, right: 8, bottom: 0, borderRadius: 20, backgroundColor: '#000', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10 },
  nextCard: { zIndex: 1, transform: [{ scale: 0.96 }] },
  activeCard: { zIndex: 10 },
  image: { width: '100%', height: '100%', borderRadius: 20 },
  gradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  infoContent: { flex: 1 },
  name: { color: '#fff', fontSize: 34, fontWeight: '800', textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 4 },
  age: { fontSize: 24, fontWeight: '400' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  locationText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  infoBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },

  labelWrap: { position: 'absolute', top: 60, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 4, borderRadius: 10, transform: [{ rotate: '-15deg' }] },
  nopeLabelWrap: { right: 40, borderColor: '#FF4458', transform: [{ rotate: '15deg' }] },
  likeLabelWrap: { left: 40, borderColor: '#17E08F' },
  superLabelWrap: { bottom: 200, left: '30%', borderColor: '#2DB1FF', transform: [{ rotate: '-15deg' }] },
  nopeLabel: { color: '#FF4458', fontSize: 38, fontWeight: '900', letterSpacing: 2 },
  likeLabel: { color: '#17E08F', fontSize: 38, fontWeight: '900', letterSpacing: 2 },
  superLabel: { color: '#2DB1FF', fontSize: 34, fontWeight: '900', letterSpacing: 2 },

  // Padding-bottom énorme pour compenser la tab bar flottante
  actionRow: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', paddingBottom: 100, paddingTop: 16 },
  btnSmall: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  btnMedium: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  btnLarge: { width: 66, height: 66, borderRadius: 33, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#17E08F' },
  shadow: { elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 }
});

import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Modal, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { userService } from '../../services/userService';
import { matchService } from '../../services/matchService';
import { colors } from '../../theme/colors';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;
const SWIPE_VELOCITY = 0.22;
const LOVE_PARTICLES = [
  { x: -46, delay: 0, size: 16, color: '#ec4899' },
  { x: -20, delay: 40, size: 20, color: '#db2777' },
  { x: 8, delay: 85, size: 17, color: '#f472b6' },
  { x: 34, delay: 120, size: 15, color: '#be185d' }
];

export default function DiscoverScreen({ navigation }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [boosting, setBoosting] = useState(false);
  const [history, setHistory] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [matchBanner, setMatchBanner] = useState(null);
  const insets = useSafeAreaInsets();

  const pos = useRef(new Animated.ValueXY()).current;
  const isActionRunning = useRef(false);
  const loveAnims = useRef(
    LOVE_PARTICLES.map(() => ({
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.6),
      translateY: new Animated.Value(26)
    }))
  ).current;

  const current = cards[index];
  const nextCard = cards[index + 1];

  const triggerLoveAnimation = () => {
    loveAnims.forEach((anim) => {
      anim.opacity.setValue(0);
      anim.scale.setValue(0.6);
      anim.translateY.setValue(26);
    });

    LOVE_PARTICLES.forEach((particle, idx) => {
      const anim = loveAnims[idx];
      Animated.sequence([
        Animated.delay(particle.delay),
        Animated.parallel([
          Animated.timing(anim.opacity, { toValue: 1, duration: 130, useNativeDriver: true }),
          Animated.spring(anim.scale, { toValue: 1.22, friction: 4, useNativeDriver: true }),
          Animated.timing(anim.translateY, { toValue: -6, duration: 260, useNativeDriver: true })
        ]),
        Animated.parallel([
          Animated.timing(anim.opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.timing(anim.scale, { toValue: 0.95, duration: 220, useNativeDriver: true }),
          Animated.timing(anim.translateY, { toValue: -34, duration: 320, useNativeDriver: true })
        ])
      ]).start();
    });
  };

  const fetchCards = async () => {
    setLoading(true);
    try {
      const data = await userService.suggestions(30);
      setCards(data || []);
      setIndex(0);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  useEffect(() => {
    if (!feedback) return undefined;
    const t = setTimeout(() => setFeedback(null), 3200);
    return () => clearTimeout(t);
  }, [feedback]);


  const runMatchAction = async (actionType, cardToActOn) => {
    if (!cardToActOn?._id) return;
    try {
      let response = null;
      if (actionType === 'like') response = await matchService.like(cardToActOn._id);
      if (actionType === 'superlike') response = await matchService.superLike(cardToActOn._id);
      if (actionType === 'dislike') response = await matchService.dislike(cardToActOn._id);

      if (response?.alreadyLiked) {
        setFeedback({
          type: 'info',
          text: response.message || `Vous avez déjà liké ${cardToActOn.firstName}.`
        });
        return;
      }

      if (response?.isMutual) {
        triggerLoveAnimation();
        setMatchBanner({
          firstName: cardToActOn.firstName,
          userId: cardToActOn.username || cardToActOn._id,
          matchId: response?.match?._id || null
        });
        setFeedback({
          type: 'match',
          text: `Vous et ${cardToActOn.firstName} vous plaisez mutuellement.`
        });
      } else if (actionType === 'like') {
        triggerLoveAnimation();
        setFeedback({
          type: 'info',
          text: `Like envoyé à ${cardToActOn.firstName}.`
        });
      } else if (actionType === 'superlike') {
        triggerLoveAnimation();
        setFeedback({
          type: 'info',
          text: `Super Like envoyé à ${cardToActOn.firstName}.`
        });
      }
    } catch (err) {
      console.log('Match action error:', err);
    }
  };

  const registerSuccessAction = (actionType, userId) => {
    setHistory((prev) => [...prev, { actionType, userId }]);
  };

  const animateOut = (toValue, actionType) => {
    if (isActionRunning.current || !current) return;
    isActionRunning.current = true;

    const cardToActOn = current;

    Animated.timing(pos, {
      toValue,
      duration: 250,
      useNativeDriver: true
    }).start(() => {
      pos.setValue({ x: 0, y: 0 });
      setIndex((prev) => prev + 1);
      registerSuccessAction(actionType, cardToActOn._id);
      isActionRunning.current = false;
      runMatchAction(actionType, cardToActOn);
    });
  };

  const handleLike = () => animateOut({ x: width + 100, y: 0 }, 'like');
  const handleDislike = () => animateOut({ x: -width - 100, y: 0 }, 'dislike');
  const handleSuperLike = () => animateOut({ x: 0, y: -height - 100 }, 'superlike');

  const handlersRef = useRef({ handleLike, handleDislike, handleSuperLike });
  useEffect(() => {
    handlersRef.current = { handleLike, handleDislike, handleSuperLike };
  });

  const handleRewind = async () => {
    if (isActionRunning.current) return;
    if (index <= 0 || history.length === 0) {
      Alert.alert('Info', 'Aucune action a annuler.');
      return;
    }

    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setIndex((prev) => Math.max(prev - 1, 0));

    if (last?.actionType === 'like' || last?.actionType === 'superlike') {
      try {
        await matchService.dislike(last.userId);
      } catch (_) {}
    }
  };

  const handleBoost = async () => {
    if (boosting || loading) return;
    setBoosting(true);
    try {
      const fresh = await userService.suggestions(40);
      const existing = new Set(cards.map((c) => String(c._id)));
      const newOnes = (fresh || []).filter((u) => !existing.has(String(u._id)));

      if (!newOnes.length) {
        Alert.alert('Boost', 'Aucun nouveau profil pour le moment.');
        return;
      }

      setCards((prev) => [...prev, ...newOnes]);
      setFeedback({
        type: 'info',
        text: `Boost active: ${newOnes.length} nouveaux profils ajoutes.`
      });
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de booster pour le moment.');
    } finally {
      setBoosting(false);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) =>
        !isActionRunning.current && (Math.abs(g.dx) > 10 || Math.abs(g.dy) > 10),
      onPanResponderGrant: () => {
        pos.stopAnimation();
      },
      onPanResponderMove: (_, g) => {
        if (isActionRunning.current) return;
        pos.setValue({ x: g.dx, y: g.dy });
      },
      onPanResponderRelease: (_, g) => {
        if (isActionRunning.current) return;
        
        const shouldSuperLike = g.dy < -SWIPE_THRESHOLD || (g.dy < -60 && g.vy < -SWIPE_VELOCITY);
        const shouldLike = g.dx > SWIPE_THRESHOLD || (g.dx > 60 && g.vx > SWIPE_VELOCITY);
        const shouldDislike = g.dx < -SWIPE_THRESHOLD || (g.dx < -60 && g.vx < -SWIPE_VELOCITY);

        if (shouldSuperLike && Math.abs(g.dx) < 130) {
          handlersRef.current.handleSuperLike();
        } else if (shouldLike) {
          handlersRef.current.handleLike();
        } else if (shouldDislike) {
          handlersRef.current.handleDislike();
        } else {
          Animated.spring(pos, {
            toValue: { x: 0, y: 0 },
            friction: 5,
            tension: 40,
            useNativeDriver: true
          }).start();
        }
      }
    })
  ).current;

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={[styles.emptyText, { color: theme.textMuted }]}>Recherche de profils...</Text>
      </View>
    );
  }

  if (!current) {
    return (
      <View style={styles.center}>
        <View style={styles.radarBox}>
          <Image source={require('../../../assets/logo.png')} style={{ width: 60, height: 60, opacity: 0.2 }} contentFit="contain" />
        </View>
        <Text style={[styles.empty, { color: theme.text }]}>Vous avez vu tous les profils !</Text>
        <Pressable style={styles.actionBtn} onPress={fetchCards}>
          <Text style={styles.actionText}>Chercher a nouveau</Text>
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

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View pointerEvents="none" style={styles.loveLayer}>
        {LOVE_PARTICLES.map((particle, idx) => (
          <Animated.Text
            key={`love-${idx}`}
            style={[
              styles.loveParticle,
              {
                color: particle.color,
                fontSize: particle.size,
                transform: [
                  { translateX: particle.x },
                  { translateY: loveAnims[idx].translateY },
                  { scale: loveAnims[idx].scale }
                ],
                opacity: loveAnims[idx].opacity
              }
            ]}
          >
            {'\u2665'}
          </Animated.Text>
        ))}
      </View>

      {!!feedback && (
        <View style={[styles.feedbackBubble, feedback.type === 'match' && styles.feedbackMatch]}>
          <Text style={styles.feedbackText}>{feedback.text}</Text>
          <Pressable onPress={() => setFeedback(null)}>
            <Ionicons name="close" size={16} color="#fff" />
          </Pressable>
        </View>
      )}

      {!!matchBanner && (
        <View style={styles.matchCard}>
          <Text style={styles.matchTitle}>Nouveau Match</Text>
          <Text style={styles.matchText}>
            Vous et {matchBanner.firstName} vous plaisez mutuellement.
          </Text>
          <View style={styles.matchActions}>
            <Pressable
              style={[styles.matchBtn, styles.matchGhostBtn]}
              onPress={() => {
                navigation.navigate('ProfileMain', { userId: matchBanner.userId });
                setMatchBanner(null);
              }}
            >
              <Text style={styles.matchGhostText}>Voir profil</Text>
            </Pressable>
            <Pressable
              style={styles.matchBtn}
              onPress={() => {
                if (matchBanner.matchId) navigation.navigate('Messages', { matchId: matchBanner.matchId });
                setMatchBanner(null);
              }}
            >
              <Text style={styles.matchBtnText}>Envoyer message</Text>
            </Pressable>
          </View>
        </View>
      )}

      <View style={styles.cardContainer}>
        {nextCard && (
          <View style={[styles.card, styles.nextCard]}>
            <Image
              source={nextCard.photos?.find?.((p) => p.isPrimary)?.url || nextCard.googlePhoto || 'https://placehold.co/600x800'}
              style={styles.image}
              contentFit="cover"
            />
          </View>
        )}

        <Animated.View
          {...panResponder.panHandlers}
          style={[styles.card, styles.activeCard, { transform: [{ translateX: pos.x }, { translateY: pos.y }, { rotate }] }]}
        >
          <Image
            source={current?.photos?.find?.((p) => p.isPrimary)?.url || current?.googlePhoto || 'https://placehold.co/600x800'}
            style={styles.image}
            contentFit="cover"
            transition={180}
          />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.gradient}>
            <View style={styles.infoContent}>
              <Text style={styles.name}>
                {current.firstName} <Text style={styles.age}>{current.age || '22'}</Text>
              </Text>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={16} color="#fff" />
                <Text style={styles.locationText}>{current.location?.city || 'Pres de chez vous'}</Text>
              </View>
            </View>
            <Pressable
              style={styles.infoBtn}
              onPress={() => navigation.navigate('ProfileMain', { userId: current.username || current._id })}
            >
              <Ionicons name="information" size={20} color="#000" />
            </Pressable>
          </LinearGradient>

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

      <View style={styles.actionRow}>
        <View style={styles.tipsRow}>
          <Text style={styles.tip}>Annuler</Text>
          <Text style={styles.tip}>Passer</Text>
          <Text style={styles.tip}>Super</Text>
          <Text style={styles.tip}>Like</Text>
          <Text style={styles.tip}>Boost</Text>
        </View>
        <View style={styles.actionButtonsRow}>
          <Pressable style={[styles.btnSmall, styles.shadow]} onPress={handleRewind}>
            <Ionicons name="refresh" size={24} color="#F5B748" />
          </Pressable>
          <Pressable style={[styles.btnLarge, styles.shadow]} onPress={handleDislike}>
            <Ionicons name="close" size={36} color="#FF4458" />
          </Pressable>
          <Pressable style={[styles.btnMedium, styles.shadow]} onPress={handleSuperLike}>
            <Ionicons name="star" size={24} color="#2DB1FF" />
          </Pressable>
          <Pressable style={[styles.btnLarge, styles.shadow]} onPress={handleLike}>
            <MaterialCommunityIcons name="heart" size={36} color="#17E08F" style={{ marginTop: 2 }} />
          </Pressable>
          <Pressable style={[styles.btnSmall, styles.shadow]} onPress={handleBoost}>
            <Ionicons name="flash" size={24} color={boosting ? '#a855f7' : '#9436EC'} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loveLayer: {
    position: 'absolute',
    top: 88,
    alignSelf: 'center',
    width: 120,
    height: 90,
    zIndex: 60,
    alignItems: 'center',
    justifyContent: 'flex-end'
  },
  loveParticle: {
    position: 'absolute',
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2
  },
  feedbackBubble: {
    marginTop: 12,
    marginHorizontal: 14,
    backgroundColor: '#111827',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10
  },
  feedbackMatch: { backgroundColor: '#be185d' },
  feedbackText: { color: '#fff', fontWeight: '700', fontSize: 12, flex: 1 },
  matchCard: {
    marginHorizontal: 14,
    marginTop: 10,
    backgroundColor: '#fff0f6',
    borderColor: '#f9a8d4',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14
  },
  matchTitle: { color: '#be185d', fontWeight: '900', fontSize: 15 },
  matchText: { color: '#9d174d', marginTop: 4, fontWeight: '700' },
  matchActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  matchBtn: {
    flex: 1,
    backgroundColor: '#ec4899',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center'
  },
  matchBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  matchGhostBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#f9a8d4' },
  matchGhostText: { color: '#be185d', fontWeight: '800', fontSize: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  radarBox: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 4,
    borderColor: '#fff',
    elevation: 2
  },
  empty: { fontSize: 18, fontWeight: '700', marginBottom: 24 },
  emptyText: { fontSize: 16 },
  actionBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
    elevation: 4
  },
  actionText: { color: '#fff', fontWeight: '800', fontSize: 16, textTransform: 'uppercase' },

  cardContainer: { flex: 1, paddingHorizontal: 8, paddingTop: 16, paddingBottom: 10 },
  card: {
    position: 'absolute',
    top: 16,
    left: 8,
    right: 8,
    bottom: 0,
    borderRadius: 20,
    backgroundColor: '#000',
    elevation: 4
  },
  nextCard: { zIndex: 1, transform: [{ scale: 0.96 }] },
  activeCard: { zIndex: 10 },
  image: { width: '100%', height: '100%', borderRadius: 20 },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between'
  },
  infoContent: { flex: 1 },
  name: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4
  },
  age: { fontSize: 24, fontWeight: '400' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  locationText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  infoBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },

  labelWrap: {
    position: 'absolute',
    top: 60,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 4,
    borderRadius: 10,
    transform: [{ rotate: '-15deg' }]
  },
  nopeLabelWrap: { right: 40, borderColor: '#FF4458', transform: [{ rotate: '15deg' }] },
  likeLabelWrap: { left: 40, borderColor: '#17E08F' },
  superLabelWrap: { bottom: 200, left: '30%', borderColor: '#2DB1FF', transform: [{ rotate: '-15deg' }] },
  nopeLabel: { color: '#FF4458', fontSize: 38, fontWeight: '900', letterSpacing: 2 },
  likeLabel: { color: '#17E08F', fontSize: 38, fontWeight: '900', letterSpacing: 2 },
  superLabel: { color: '#2DB1FF', fontSize: 34, fontWeight: '900', letterSpacing: 2 },

  actionRow: { justifyContent: 'center', alignItems: 'center', paddingBottom: 100, paddingTop: 16 },
  tipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
    paddingHorizontal: 10,
    marginBottom: 8
  },
  tip: {
    backgroundColor: '#fff',
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border
  },
  actionButtonsRow: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', width: '100%' },
  btnSmall: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  btnMedium: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  btnLarge: { width: 66, height: 66, borderRadius: 33, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#17E08F' },
  shadow: { elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 }
});

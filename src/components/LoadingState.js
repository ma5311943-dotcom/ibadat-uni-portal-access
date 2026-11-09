import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors } from '../theme/colors';

export function LoadingState({ registration }) {
  const [pulse] = useState(() => new Animated.Value(0.35));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.9,
          duration: 650,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.35,
          duration: 650,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => animation.stop();
  }, [pulse]);

  return (
    <View
      style={styles.card}
      accessibilityLiveRegion="polite"
      accessibilityLabel={`Fetching the student record for ${registration}`}
    >
      <View style={styles.statusRow}>
        <ActivityIndicator size="small" color={colors.accent} />
        <View style={styles.statusCopy}>
          <Text style={styles.title}>Fetching student record</Text>
          <Text style={styles.meta} numberOfLines={1}>
            Looking up{' '}
            <Text style={styles.registration}>{registration}</Text>
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.skeletonRow}>
        <Animated.View style={[styles.avatarSkeleton, { opacity: pulse }]} />
        <View style={styles.skeletonLines}>
          <Animated.View
            style={[styles.skeletonLine, styles.titleLine, { opacity: pulse }]}
          />
          <Animated.View
            style={[styles.skeletonLine, styles.shortLine, { opacity: pulse }]}
          />
        </View>
      </View>

      <View style={styles.tileRow}>
        <Animated.View style={[styles.tileSkeleton, { opacity: pulse }]} />
        <Animated.View style={[styles.tileSkeleton, { opacity: pulse }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 18,
    padding: 20,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border, // Subtle card outline
    backgroundColor: colors.card, // Main dark card surface
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusCopy: {
    flex: 1,
    gap: 3,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
  },
  registration: {
    color: colors.textSecondary,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 18,
    backgroundColor: colors.border,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarSkeleton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.skeleton, // Loading placeholder block
  },
  skeletonLines: {
    flex: 1,
    gap: 9,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.skeleton, // Loading placeholder block
  },
  titleLine: {
    width: '62%',
  },
  shortLine: {
    width: '40%',
    height: 10,
  },
  tileRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  tileSkeleton: {
    flex: 1,
    height: 74,
    borderRadius: 14,
    backgroundColor: colors.skeleton, // Loading placeholder block
  },
});

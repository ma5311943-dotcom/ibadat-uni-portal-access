import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

const ERROR_PRESENTATION = {
  config: { icon: 'warning-outline', tone: 'warning' },
  not_found: { icon: 'search-outline', tone: 'warning' },
  timeout: { icon: 'time-outline', tone: 'warning' },
  network: { icon: 'cloud-offline-outline', tone: 'danger' },
  forbidden: { icon: 'lock-closed-outline', tone: 'danger' },
  rate_limited: { icon: 'hourglass-outline', tone: 'warning' },
  server_error: { icon: 'server-outline', tone: 'danger' },
  invalid_response: { icon: 'help-circle-outline', tone: 'danger' },
  invalid_request: { icon: 'alert-circle-outline', tone: 'warning' },
  api_failure: { icon: 'alert-circle-outline', tone: 'danger' },
  empty: { icon: 'keypad-outline', tone: 'warning' },
  unknown: { icon: 'alert-circle-outline', tone: 'danger' },
};

function getTone(toneName) {
  if (toneName === 'warning') {
    return {
      color: colors.warning,
      background: colors.warningSoft,
      border: colors.warningBorder,
    };
  }

  return {
    color: colors.danger,
    background: colors.dangerSoft,
    border: colors.dangerBorder,
  };
}

export function ErrorState({ error, registration, onRetry }) {
  const presentation =
    ERROR_PRESENTATION[error?.code] || ERROR_PRESENTATION.unknown;
  const tone = getTone(presentation.tone);
  const canRetry = typeof onRetry === 'function' && error?.code !== 'config';
  const message = String(error?.message || '').trim();
  const detail = String(error?.detail || '').trim();
  const showDetail = detail.length > 0 && detail !== message;

  return (
    <View
      style={styles.card}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: tone.background, borderColor: tone.border },
        ]}
      >
        <Ionicons
          name={presentation.icon}
          size={26}
          color={tone.color}
        />
      </View>

      <Text style={styles.title}>{error?.title || 'Something went wrong'}</Text>
      <Text style={styles.message}>
        {message || 'The student record could not be loaded.'}
      </Text>

      {showDetail ? <Text style={styles.detail}>{detail}</Text> : null}

      {registration ? (
        <View style={styles.queryPill}>
          <Text style={styles.queryLabel}>REGISTRATION</Text>
          <Text
            style={styles.queryValue}
            numberOfLines={1}
            ellipsizeMode="middle"
          >
            {registration}
          </Text>
        </View>
      ) : null}

      {canRetry ? (
        <Pressable
          onPress={onRetry}
          style={({ pressed }) => [
            styles.retryButton,
            pressed && styles.retryButtonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Try the search again"
          android_ripple={{ color: colors.accentSoft, borderless: false }}
        >
          <Ionicons name="refresh-outline" size={17} color={colors.accent} />
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      ) : null}
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
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  title: {
    marginTop: 16,
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  message: {
    marginTop: 7,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  detail: {
    marginTop: 8,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  queryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    maxWidth: '100%',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.input, // Near-black query chip
  },
  queryLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  queryValue: {
    flexShrink: 1,
    color: colors.textSecondary,
    fontFamily: 'monospace',
    fontSize: 12,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    marginTop: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.accentBorder, // Cyan outlined action
    backgroundColor: colors.accentSoft, // Cyan tinted action
    overflow: 'hidden',
  },
  retryButtonPressed: {
    opacity: 0.8,
  },
  retryText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

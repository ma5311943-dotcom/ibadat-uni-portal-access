import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";
import { hasText } from "../utils/format";

const TONES = {
  success: {
    color: colors.success,
    background: colors.successSoft,
    border: colors.successBorder,
  },
  warning: {
    color: colors.warning,
    background: colors.warningSoft,
    border: colors.warningBorder,
  },
  danger: {
    color: colors.danger,
    background: colors.dangerSoft,
    border: colors.dangerBorder,
  },
  accent: {
    color: colors.accent,
    background: colors.accentSoft,
    border: colors.accentBorder,
  },
};

export function getStatusTone(status) {
  const value = String(status || "").toLowerCase();

  if (!value) {
    return null;
  }

  if (
    /(inactive|deactivated|suspended|expelled|blocked|cancelled|canceled|dropped|expired|failed|withdrawn|terminated|unpaid|overdue|not allowed|denied|\bnot active\b)/.test(
      value,
    )
  ) {
    return TONES.danger;
  }

  if (
    /(pending|processing|provisional|on hold|\bhold\b|waiting|under review|incomplete|partial|no seating|not available|unavailable)/.test(
      value,
    )
  ) {
    return TONES.warning;
  }

  if (
    /(active|enrolled|approved|valid|current|regular|cleared|graduated|completed|passed|allowed|paid)/.test(
      value,
    )
  ) {
    return TONES.success;
  }

  return TONES.accent;
}

export function StatusPill({ value, style }) {
  if (!hasText(value)) {
    return null;
  }

  const tone = getStatusTone(value) || TONES.accent;

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: tone.background,
          borderColor: tone.border,
        },
        style,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: tone.color }]} />
      <Text style={[styles.text, { color: tone.color }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    maxWidth: "100%",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    flexShrink: 1,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});

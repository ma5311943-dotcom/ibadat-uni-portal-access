import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";

const TIPS = [
  "Use Previous/Next to step through nearby roll numbers.",
  "Tap any detail tile to copy it to the clipboard.",
  "Pull down to refresh the current record.",
];

export function CampusNote() {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name="sparkles-outline" size={16} color={colors.accent} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.label}>Quick tips</Text>
        {TIPS.map((tip) => (
          <View key={tip} style={styles.tipRow}>
            <View style={styles.dot} />
            <Text style={styles.text}>{tip}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 18,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundSoft,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentSoft,
  },
  copy: {
    flex: 1,
    gap: 6,
  },
  label: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 7,
    backgroundColor: colors.accent,
  },
  text: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
});

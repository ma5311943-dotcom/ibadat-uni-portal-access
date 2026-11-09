import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";

export function EmptyState() {
  return (
    <View style={styles.card}>
      <View style={styles.halo}>
        <View style={styles.orb}>
          <Ionicons name="id-card-outline" size={32} color={colors.accent} />
        </View>
      </View>

      <Text style={styles.title}>No record loaded</Text>
      <Text style={styles.message}>
        Enter a registration number above to view a student&apos;s profile and
        campus details.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 30,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  halo: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.accentBorder,
    backgroundColor: "rgba(34, 211, 238, 0.05)",
  },
  orb: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentSoft,
  },
  title: {
    marginTop: 18,
    color: colors.textPrimary,
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: 0.2,
    textAlign: "center",
  },
  message: {
    maxWidth: 320,
    marginTop: 8,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
});

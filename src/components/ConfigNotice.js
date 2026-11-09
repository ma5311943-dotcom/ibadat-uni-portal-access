import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";

export function ConfigNotice() {
  return (
    <View style={styles.container} accessibilityRole="alert">
      <View style={styles.iconWrap}>
        <Ionicons name="warning-outline" size={18} color={colors.warning} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>API endpoint not configured</Text>
        <Text style={styles.message}>
          Add EXPO_PUBLIC_API_BASE_URL to your .env file, then restart Expo.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginTop: 18,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.warningBorder, // Amber warning border
    backgroundColor: colors.warningSoft, // Amber warning tint
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(251, 191, 36, 0.12)",
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  title: {
    color: colors.warning,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  message: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
});

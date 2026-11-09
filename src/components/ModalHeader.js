import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, layout } from "../theme/colors";

export function ModalHeader({ title, subtitle, onBack }) {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={onBack}
        style={({ pressed }) => [
          styles.backButton,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Go back to the student record"
        android_ripple={{ color: colors.accentSoft, borderless: false }}
      >
        <Ionicons name="arrow-back" size={19} color={colors.textPrimary} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <View style={styles.copy}>
        <Text
          style={styles.title}
          numberOfLines={1}
          accessibilityRole="header"
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    width: "100%",
    maxWidth: layout.maxContentWidth,
    alignSelf: "center",
    paddingHorizontal: layout.screenPadding,
    paddingTop: 12,
    paddingBottom: 14,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    overflow: "hidden",
  },
  pressed: {
    opacity: 0.78,
  },
  backText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    alignItems: "flex-end",
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "700",
  },
  subtitle: {
    maxWidth: "100%",
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 12.5,
    lineHeight: 17,
  },
});

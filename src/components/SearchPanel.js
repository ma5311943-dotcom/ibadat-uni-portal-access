import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { colors } from "../theme/colors";

export function SearchPanel({
  value,
  onChangeText,
  onSubmit,
  onClear,
  onPrevious,
  onNext,
  isLoading,
  encodedPreview,
  canNavigate,
  history = [],
  onSelectHistory,
  onClearHistory,
}) {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value.trim().length > 0;
  const canSearch = hasValue && !isLoading;
  const showHistory = !isLoading && history.length > 0;

  return (
    <View>
      <View
        style={[
          styles.searchCard,
          (isFocused || hasValue) && styles.searchCardActive,
        ]}
      >
        <View style={styles.leadingIcon}>
          <Ionicons
            name="search"
            size={20}
            color={hasValue || isFocused ? colors.accent : colors.textMuted}
          />
        </View>

        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onSubmitEditing={onSubmit}
          placeholder="e.g. REG-12345"
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.accent}
          autoCapitalize="characters"
          autoCorrect={false}
          autoComplete="off"
          editable={!isLoading}
          maxLength={64}
          returnKeyType="search"
          style={styles.input}
          accessibilityLabel="Registration number"
          accessibilityHint="Type or paste a student registration number"
        />

        {hasValue && !isLoading ? (
          <Pressable
            onPress={onClear}
            hitSlop={8}
            style={styles.clearButton}
            accessibilityRole="button"
            accessibilityLabel="Clear registration number"
            android_ripple={{ color: colors.border, borderless: true }}
          >
            <Ionicons
              name="close-circle"
              size={18}
              color={colors.textMuted}
            />
          </Pressable>
        ) : null}

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
              () => {},
            );
            onSubmit();
          }}
          disabled={!canSearch}
          style={({ pressed }) => [
            styles.searchButton,
            !hasValue && styles.searchButtonDisabled,
            pressed && canSearch && styles.searchButtonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Search student"
          accessibilityHint="Fetches the student record for the entered registration number"
          accessibilityState={{ disabled: !canSearch, busy: isLoading }}
          android_ripple={{
            color: "rgba(0, 0, 0, 0.18)",
            borderless: false,
          }}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.onAccent} />
          ) : (
            <Ionicons
              name="arrow-forward"
              size={22}
              color={hasValue ? colors.onAccent : colors.textMuted}
            />
          )}
        </Pressable>
      </View>

      <View style={styles.navRow}>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            onPrevious?.();
          }}
          disabled={!canNavigate || isLoading}
          style={({ pressed }) => [
            styles.navButton,
            (!canNavigate || isLoading) && styles.navButtonDisabled,
            pressed && canNavigate && !isLoading && styles.navButtonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Search previous roll number"
          accessibilityHint="Finds and searches the previous registration number"
          accessibilityState={{ disabled: !canNavigate || isLoading }}
        >
          <Ionicons
            name="chevron-back"
            size={16}
            color={canNavigate && !isLoading ? colors.accent : colors.textMuted}
          />
          <Text
            style={[
              styles.navText,
              (!canNavigate || isLoading) && styles.navTextDisabled,
            ]}
          >
            Previous
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            onNext?.();
          }}
          disabled={!canNavigate || isLoading}
          style={({ pressed }) => [
            styles.navButton,
            (!canNavigate || isLoading) && styles.navButtonDisabled,
            pressed && canNavigate && !isLoading && styles.navButtonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Search next roll number"
          accessibilityHint="Finds and searches the next registration number"
          accessibilityState={{ disabled: !canNavigate || isLoading }}
        >
          <Text
            style={[
              styles.navText,
              (!canNavigate || isLoading) && styles.navTextDisabled,
            ]}
          >
            Next
          </Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={canNavigate && !isLoading ? colors.accent : colors.textMuted}
          />
        </Pressable>
      </View>

      {encodedPreview ? (
        <View style={styles.encodedPill}>
          <Text style={styles.encodedLabel}>BASE64</Text>
          <Text
            style={styles.encodedValue}
            numberOfLines={1}
            ellipsizeMode="middle"
          >
            {encodedPreview}
          </Text>
        </View>
      ) : null}

      {showHistory ? (
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyLabel}>Recent searches</Text>
            {onClearHistory ? (
              <Pressable
                onPress={onClearHistory}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Clear recent searches"
              >
                <Text style={styles.historyClear}>Clear</Text>
              </Pressable>
            ) : null}
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.historyRow}
          >
            {history.map((item) => (
              <Pressable
                key={item}
                onPress={() => onSelectHistory?.(item)}
                hitSlop={4}
                style={({ pressed }) => [
                  styles.historyChip,
                  pressed && styles.historyChipPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Search ${item}`}
              >
                <Ionicons name="time-outline" size={13} color={colors.accent} />
                <Text style={styles.historyText} numberOfLines={1}>
                  {item}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  searchCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 60,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.input,
  },
  searchCardActive: {
    borderColor: colors.accentBorder,
    backgroundColor: "#0A1114",
  },
  leadingIcon: {
    width: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 46,
    paddingVertical: 6,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  clearButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  searchButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: colors.accent,
  },
  searchButtonDisabled: {
    backgroundColor: "#1B1C1F",
  },
  searchButtonPressed: {
    opacity: 0.85,
  },
  navRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  navButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    minHeight: 44,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentSoft,
  },
  navButtonDisabled: {
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  navButtonPressed: {
    opacity: 0.8,
  },
  navText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "700",
  },
  navTextDisabled: {
    color: colors.textMuted,
  },
  encodedPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    maxWidth: "100%",
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentSoft,
  },
  encodedLabel: {
    color: colors.accent,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
  },
  encodedValue: {
    flexShrink: 1,
    color: colors.textSecondary,
    fontFamily: "monospace",
    fontSize: 11,
  },
  historySection: {
    marginTop: 14,
    gap: 8,
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  historyLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  historyClear: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "700",
  },
  historyRow: {
    gap: 8,
    paddingRight: 4,
  },
  historyChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: 220,
    minHeight: 36,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardElevated,
  },
  historyChipPressed: {
    opacity: 0.8,
  },
  historyText: {
    flexShrink: 1,
    color: colors.textSecondary,
    fontFamily: "monospace",
    fontSize: 11,
    fontWeight: "600",
  },
});

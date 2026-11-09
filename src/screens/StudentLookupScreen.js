import Ionicons from "@expo/vector-icons/Ionicons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Keyboard,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { CampusNote } from "../components/CampusNote";
import { ConfigNotice } from "../components/ConfigNotice";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { SearchPanel } from "../components/SearchPanel";
import { StudentCard } from "../components/StudentCard";
import { useStudentLookup } from "../hooks/useStudentLookup";
import { colors, layout } from "../theme/colors";
import { encodeBase64 } from "../utils/base64";
import {
  canNavigateRollNumber,
  getNextRollNumber,
  getPreviousRollNumber,
  normalizeRollNumber,
} from "../utils/rollNumber";

export function StudentLookupScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scrollRef = useRef(null);
  const resultsYRef = useRef(0);
  const [registrationInput, setRegistrationInput] = useState("");
  const {
    status,
    student,
    error,
    registration: activeRegistration,
    history,
    isConfigured,
    search,
    clearHistory,
  } = useStudentLookup();

  const compact = width < layout.breakpoints.smallPhone;
  const isLoading = status === "loading";
  const isConfigError = status === "error" && error?.code === "config";
  const showResultsHeader =
    (status === "success" || status === "error") && !isConfigError;

  const encodedPreview = useMemo(() => {
    const registration = registrationInput.trim();
    return registration ? encodeBase64(registration) : "";
  }, [registrationInput]);

  const canNavigate = canNavigateRollNumber(
    registrationInput || activeRegistration,
  );

  useEffect(() => {
    if (isConfigError) {
      scrollRef.current?.scrollTo?.({ y: 0, animated: true });
      return;
    }

    if (status === "success" || status === "error") {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo?.({
          y: Math.max(resultsYRef.current - 12, 0),
          animated: true,
        });
      });
    }
  }, [status, activeRegistration, isConfigError]);

  const handleSearch = useCallback(
    (value) => {
      const registration = normalizeRollNumber(
        typeof value === "string" ? value : registrationInput,
      );

      if (!registration) {
        return;
      }

      Keyboard.dismiss();
      setRegistrationInput(registration);
      search(registration);
    },
    [registrationInput, search],
  );

  const handleRetry = useCallback(() => {
    if (activeRegistration) {
      setRegistrationInput(activeRegistration);
      search(activeRegistration);
    }
  }, [activeRegistration, search]);

  const handleClear = useCallback(() => {
    setRegistrationInput("");
  }, []);

  const handlePrevious = useCallback(() => {
    const source = normalizeRollNumber(registrationInput || activeRegistration);
    const next = getPreviousRollNumber(source);
    if (next) {
      handleSearch(next);
    }
  }, [activeRegistration, handleSearch, registrationInput]);

  const handleNext = useCallback(() => {
    const source = normalizeRollNumber(registrationInput || activeRegistration);
    const next = getNextRollNumber(source);
    if (next) {
      handleSearch(next);
    }
  }, [activeRegistration, handleSearch, registrationInput]);

  const resultsLabel =
    status === "success" ? "Student record" : "Search result";

  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
      <View pointerEvents="none" style={styles.glow} />

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          compact && styles.scrollContentCompact,
          { paddingBottom: Math.max(insets.bottom, 16) + 28 },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={handleRetry}
            tintColor={colors.accent}
            colors={[colors.accent]}
            enabled={Boolean(activeRegistration) && !isLoading}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.brandMark}>
            <Ionicons name="school" size={22} color={colors.accent} />
          </View>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle} accessibilityRole="header">
              Student Lookup
            </Text>
            <Text style={styles.headerSubtitle}>
              Find student records by registration number.
            </Text>
          </View>
        </View>

        <View style={styles.searchArea}>
          <SearchPanel
            value={registrationInput}
            onChangeText={setRegistrationInput}
            onSubmit={handleSearch}
            onClear={handleClear}
            onPrevious={handlePrevious}
            onNext={handleNext}
            isLoading={isLoading}
            encodedPreview={encodedPreview}
            canNavigate={canNavigate}
            history={history}
            onSelectHistory={handleSearch}
            onClearHistory={clearHistory}
          />
        </View>

        {!isConfigured ? <ConfigNotice /> : null}

        {showResultsHeader ? (
          <View
            style={styles.resultsHeader}
            onLayout={(event) => {
              resultsYRef.current = event.nativeEvent.layout.y;
            }}
          >
            <Text style={styles.resultsLabel}>{resultsLabel}</Text>
            <View style={styles.resultsLine} />
          </View>
        ) : null}

        {status === "idle" && isConfigured ? <EmptyState /> : null}

        {status === "loading" ? (
          <LoadingState registration={activeRegistration} />
        ) : null}

        {status === "error" && !isConfigError ? (
          <ErrorState
            error={error}
            registration={activeRegistration}
            onRetry={handleRetry}
          />
        ) : null}

        {status === "success" && student ? (
          <StudentCard
            key={student.registrationNumber || activeRegistration}
            student={student}
            onSearchRegistration={handleSearch}
          />
        ) : null}

        <CampusNote />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  glow: {
    position: "absolute",
    top: -150,
    right: -110,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(34, 211, 238, 0.055)",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    width: "100%",
    maxWidth: layout.maxContentWidth,
    alignSelf: "center",
    paddingHorizontal: layout.screenPadding,
    paddingTop: 18,
  },
  scrollContentCompact: {
    paddingHorizontal: layout.screenPaddingCompact,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  brandMark: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentSoft,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  searchArea: {
    marginTop: 20,
  },
  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 26,
  },
  resultsLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.3,
    textTransform: "uppercase",
  },
  resultsLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});

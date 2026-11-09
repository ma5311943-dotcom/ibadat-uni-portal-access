import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import {
  initialWindowMetrics,
  SafeAreaProvider,
  SafeAreaView,
} from "react-native-safe-area-context";
import { File, Paths } from "expo-file-system";
import { Asset, requestPermissionsAsync } from "expo-media-library";
import * as Sharing from "expo-sharing";

import { colors, layout } from "../theme/colors";
import { decodeBase64ToUint8Array } from "../utils/base64";
import { ModalHeader } from "./ModalHeader";

function getImageExtension(url) {
  const clean = String(url || "")
    .split("?")[0]
    .toLowerCase();
  const match = clean.match(/\.(jpg|jpeg|png|webp|gif)$/);
  return match ? match[1].replace("jpeg", "jpg") : "jpg";
}

function getDataUriInfo(uri) {
  const match = /^data:image\/([a-z0-9+.-]+);base64,([\s\S]+)$/i.exec(
    String(uri || ""),
  );
  if (!match) {
    return null;
  }
  let ext = match[1].toLowerCase();
  if (ext === "jpeg") ext = "jpg";
  if (ext === "svg+xml") ext = "svg";
  return { ext, base64: match[2] };
}

async function downloadPhotoToCache(photoUrl, registrationNumber) {
  const uri = String(photoUrl || "");
  const safeId =
    String(registrationNumber || "student")
      .trim()
      .replace(/[^a-zA-Z0-9_-]+/g, "_")
      .slice(0, 48) || "student";

  const dataInfo = getDataUriInfo(uri);
  if (dataInfo) {
    const destination = new File(
      Paths.cache,
      `student_${safeId}_${Date.now()}.${dataInfo.ext}`,
    );
    const bytes = decodeBase64ToUint8Array(dataInfo.base64);
    await destination.write(bytes);
    return destination;
  }

  if (/^https?:\/\//i.test(uri)) {
    const ext = getImageExtension(uri);
    const destination = new File(
      Paths.cache,
      `student_${safeId}_${Date.now()}.${ext}`,
    );
    await File.downloadFileAsync(uri, destination, { idempotent: true });
    return destination;
  }

  if (uri.startsWith("file://") || uri.startsWith("content://")) {
    const ext = getImageExtension(uri) || "jpg";
    const source = new File(uri);
    const destination = new File(
      Paths.cache,
      `student_${safeId}_${Date.now()}.${ext}`,
    );
    await source.copy(destination);
    return destination;
  }

  throw new Error("Unsupported photo format.");
}

export function PhotoViewer({ visible, student, onClose }) {
  const { width, height } = useWindowDimensions();
  const [failed, setFailed] = useState(false);
  const [busyAction, setBusyAction] = useState("");
  const photoUrl = student?.photoUrl || "";
  const name = student?.name || "Student";
  const compact = width < layout.breakpoints.compact;
  const stageHeight = Math.min(Math.max(260, height * 0.55), 680);

  const resetViewerState = () => {
    setFailed(false);
    setBusyAction("");
  };

  const handleSave = async () => {
    if (!photoUrl || busyAction) {
      return;
    }

    try {
      setBusyAction("save");
      const permission = await requestPermissionsAsync(
        Platform.OS === "android" ? false : undefined,
      );

      if (!permission.granted) {
        Alert.alert(
          "Permission needed",
          "Allow photo library access to save the student image.",
        );
        return;
      }

      const file = await downloadPhotoToCache(
        photoUrl,
        student?.registrationNumber,
      );
      await Asset.create(file.uri);
      try {
        file.delete();
      } catch {
        // cache cleanup is best-effort
      }
      Alert.alert("Saved", "Student photo saved to your gallery.");
    } catch (error) {
      Alert.alert(
        "Could not save photo",
        error?.message || "The image could not be downloaded or saved.",
      );
    } finally {
      setBusyAction("");
    }
  };

  const handleShare = async () => {
    if (!photoUrl || busyAction) {
      return;
    }

    try {
      setBusyAction("share");
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert(
          "Sharing unavailable",
          "Sharing is not available on this device.",
        );
        return;
      }

      const file = await downloadPhotoToCache(
        photoUrl,
        student?.registrationNumber,
      );
      await Sharing.shareAsync(file.uri, {
        dialogTitle: `Share ${name}'s photo`,
      });
    } catch (error) {
      Alert.alert(
        "Could not share photo",
        error?.message || "The image could not be shared.",
      );
    } finally {
      setBusyAction("");
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      onShow={resetViewerState}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <SafeAreaProvider initialMetrics={initialWindowMetrics} style={styles.root}>
        <SafeAreaView
          style={styles.root}
          edges={["top", "bottom", "left", "right"]}
        >
          <ModalHeader
            title="Student photo"
            subtitle={name}
            onBack={onClose}
          />

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.stage, { height: stageHeight }]}>
              {photoUrl && !failed ? (
                <Image
                  source={{ uri: photoUrl }}
                  style={styles.image}
                  resizeMode="contain"
                  onError={() => setFailed(true)}
                  accessibilityLabel={`${name} photo`}
                />
              ) : (
                <View style={styles.fallback}>
                  <Ionicons
                    name="image-outline"
                    size={54}
                    color={colors.textMuted}
                  />
                  <Text style={styles.fallbackTitle}>Photo unavailable</Text>
                  <Text style={styles.fallbackMessage}>
                    The student photo could not be loaded.
                  </Text>
                </View>
              )}
            </View>

            {photoUrl && !failed ? (
              <View style={[styles.actions, compact && styles.actionsCompact]}>
                <Pressable
                  onPress={handleSave}
                  disabled={Boolean(busyAction)}
                  style={({ pressed }) => [
                    styles.actionButton,
                    styles.actionPrimary,
                    compact && styles.actionButtonCompact,
                    pressed && !busyAction && styles.pressed,
                    busyAction && styles.actionDisabled,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Save student photo to gallery"
                >
                  {busyAction === "save" ? (
                    <ActivityIndicator size="small" color={colors.onAccent} />
                  ) : (
                    <Ionicons
                      name="download-outline"
                      size={18}
                      color={colors.onAccent}
                    />
                  )}
                  <Text style={styles.actionPrimaryText}>
                    {busyAction === "save" ? "Saving..." : "Save image"}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleShare}
                  disabled={Boolean(busyAction)}
                  style={({ pressed }) => [
                    styles.actionButton,
                    compact && styles.actionButtonCompact,
                    pressed && !busyAction && styles.pressed,
                    busyAction && styles.actionDisabled,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Share student photo"
                >
                  {busyAction === "share" ? (
                    <ActivityIndicator size="small" color={colors.accent} />
                  ) : (
                    <Ionicons
                      name="share-outline"
                      size={18}
                      color={colors.accent}
                    />
                  )}
                  <Text style={styles.actionText}>
                    {busyAction === "share" ? "Sharing..." : "Share"}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    width: "100%",
    maxWidth: layout.maxContentWidth,
    alignSelf: "center",
    paddingHorizontal: layout.screenPadding,
    paddingTop: 4,
    paddingBottom: 24,
  },
  stage: {
    width: "100%",
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: colors.backgroundSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  fallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    margin: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 20,
  },
  fallbackTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "700",
  },
  fallbackMessage: {
    maxWidth: 300,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  actionsCompact: {
    flexDirection: "column",
  },
  actionButton: {
    flex: 1,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentSoft,
  },
  actionButtonCompact: {
    flex: 0,
  },
  actionPrimary: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  actionDisabled: {
    opacity: 0.7,
  },
  actionText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "700",
  },
  actionPrimaryText: {
    color: colors.onAccent,
    fontSize: 14,
    fontWeight: "700",
  },
});

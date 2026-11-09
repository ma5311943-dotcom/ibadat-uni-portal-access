import Ionicons from "@expo/vector-icons/Ionicons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Image,
  Linking,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { colors, layout } from "../theme/colors";
import { summarizeInvoiceGroup } from "../utils/fees";
import {
  buildStudentRecordText,
  buildStudentShareMessage,
  hasText,
} from "../utils/format";
import { DETAIL_FIELDS, SEAT_LOCATION_FIELDS } from "../utils/studentFields";
import { FeeViewer } from "./FeeViewer";
import { PhotoViewer } from "./PhotoViewer";
import { StatusPill } from "./StatusPill";

function differsFrom(value, other) {
  return (
    hasText(value) && String(value).trim() !== String(other || "").trim()
  );
}

function getInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "";
  }

  const firstCharacter = parts[0].charAt(0);
  const lastCharacter =
    parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";

  return `${firstCharacter}${lastCharacter}`.toUpperCase();
}

function getTileAction(label, value) {
  const text = String(value ?? "").trim();
  const lowerLabel = String(label || "").toLowerCase();
  if (!text) return null;
  if (lowerLabel.includes("email") && text.includes("@")) {
    return { type: "email", target: `mailto:${text}` };
  }
  if (lowerLabel.includes("phone")) {
    const digits = text.replace(/[^\d+]/g, "");
    if (digits.length >= 6) return { type: "phone", target: `tel:${digits}` };
  }
  return null;
}

function InfoTile({ icon, label, value, width }) {
  const action = getTileAction(label, value);

  const handlePress = async () => {
    const text = String(value ?? "").trim();
    if (!text) return;
    try {
      await Haptics.selectionAsync();
    } catch {}
    if (action) {
      Alert.alert(label, text, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Copy",
          onPress: async () => {
            await Clipboard.setStringAsync(text);
          },
        },
        {
          text: action.type === "email" ? "Open email" : "Call",
          onPress: () => Linking.openURL(action.target).catch(() => {}),
        },
      ]);
      return;
    }
    await Clipboard.setStringAsync(text);
    if (Platform.OS === "android") {
      Alert.alert("Copied", `${label} copied.`);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.tile,
        { width },
        pressed && styles.tilePressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}. Tap to copy`}
    >
      <View style={styles.tileHeader}>
        <Ionicons name={icon} size={13} color={colors.accent} />
        <Text style={styles.tileLabel} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text style={styles.tileValue} selectable>
        {value}
      </Text>
    </Pressable>
  );
}

function ActionButton({ icon, label, accessibilityLabel, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        pressed && styles.actionButtonPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      android_ripple={{ color: colors.accentBorder, borderless: false }}
    >
      <Ionicons name={icon} size={17} color={colors.accent} />
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

function CardSection({ title, children }) {
  return (
    <>
      <View style={styles.divider} />
      <View style={styles.sectionHeading}>
        <View style={styles.sectionTick} />
        <Text style={styles.sectionLabel}>{title}</Text>
      </View>
      {children}
    </>
  );
}

function SeatingTable({ headers, rows, cellWidth }) {
  return (
    <View style={styles.seatingTable}>
      {rows.map((row, rowIndex) => (
        <View
          key={`seating-row-${rowIndex}`}
          style={[styles.seatingRow, rowIndex > 0 && styles.seatingRowBorder]}
        >
          {row.map((cell, cellIndex) => (
            <View
              key={`seating-cell-${rowIndex}-${cellIndex}`}
              style={[styles.seatingCell, { width: cellWidth }]}
            >
              <Text style={styles.seatingLabel} numberOfLines={1}>
                {headers[cellIndex] || `Field ${cellIndex + 1}`}
              </Text>
              <Text style={styles.seatingValue}>{cell}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function getPercentageValue(value) {
  const number = Number.parseFloat(
    String(value ?? "").replace(/[^0-9.]/g, ""),
  );

  if (!Number.isFinite(number)) {
    return null;
  }

  return Math.min(100, Math.max(0, number));
}

function getAttendanceColor(percentage) {
  if (percentage === null) {
    return colors.accent;
  }

  if (percentage >= 75) {
    return colors.success;
  }

  if (percentage >= 50) {
    return colors.warning;
  }

  return colors.danger;
}

function AttendanceStat({ label, value, color }) {
  if (!hasText(value)) {
    return null;
  }

  return (
    <View style={styles.attendanceStat}>
      <Text style={styles.attendanceStatLabel}>{label}</Text>
      <Text style={[styles.attendanceStatValue, color ? { color } : null]}>
        {value}
      </Text>
    </View>
  );
}

function SeatingList({ entries }) {
  return (
    <View style={styles.seatList}>
      {entries.map((entry, index) => {
        const attendance = entry.attendance || null;
        const percentage = getPercentageValue(attendance?.percentage);
        const color = getAttendanceColor(percentage);
        const locations = SEAT_LOCATION_FIELDS.filter(({ key }) =>
          hasText(entry[key]),
        );

        return (
          <View
            key={`seat-${index}-${entry.subject || entry.room || index}`}
            style={styles.seatCard}
          >
            <View style={styles.seatHeader}>
              <View style={styles.seatSubjectWrap}>
                <Text style={styles.seatSubject}>
                  {entry.subject || "Exam"}
                </Text>
                {hasText(entry.subjectCode) ? (
                  <Text style={styles.seatSubjectCode}>
                    {entry.subjectCode}
                  </Text>
                ) : null}
              </View>
              <StatusPill value={entry.status} />
            </View>

            {hasText(entry.date) || hasText(entry.time) ? (
              <View style={styles.seatWhenRow}>
                {hasText(entry.date) ? (
                  <View style={styles.seatWhenItem}>
                    <Ionicons
                      name="calendar-outline"
                      size={13}
                      color={colors.accent}
                    />
                    <Text style={styles.seatWhenText}>{entry.date}</Text>
                  </View>
                ) : null}
                {hasText(entry.time) ? (
                  <View style={styles.seatWhenItem}>
                    <Ionicons
                      name="time-outline"
                      size={13}
                      color={colors.accent}
                    />
                    <Text style={styles.seatWhenText}>{entry.time}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {locations.length > 0 ? (
              <View style={styles.seatLocationRow}>
                {locations.map(({ key, label, icon }) => (
                  <View key={key} style={styles.seatLocation}>
                    <View style={styles.seatLocationHeader}>
                      <Ionicons
                        name={icon}
                        size={11}
                        color={colors.textMuted}
                      />
                      <Text style={styles.seatLocationLabel}>{label}</Text>
                    </View>
                    <Text style={styles.seatLocationValue} numberOfLines={1}>
                      {entry[key]}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            {attendance ? (
              <View style={styles.attendancePanel}>
                <View style={styles.attendanceHeader}>
                  <Text style={styles.attendanceTitle}>
                    Attendance details
                  </Text>
                  {percentage !== null ? (
                    <Text
                      style={[styles.attendancePercent, { color }]}
                    >
                      {attendance.percentage}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.attendanceStats}>
                  <AttendanceStat label="Held" value={attendance.held} />
                  <AttendanceStat label="Marked" value={attendance.marked} />
                  <AttendanceStat
                    label="Present"
                    value={attendance.present}
                    color={colors.success}
                  />
                  <AttendanceStat
                    label="Absent"
                    value={attendance.absent}
                    color={colors.danger}
                  />
                </View>

                {percentage !== null ? (
                  <View style={styles.attendanceBarTrack}>
                    <View
                      style={[
                        styles.attendanceBarFill,
                        { width: `${percentage}%`, backgroundColor: color },
                      ]}
                    />
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

export function StudentCard({ student, onSearchRegistration }) {
  const { width } = useWindowDimensions();
  const [entrance] = useState(() => new Animated.Value(0));
  const [failedPhotoUrl, setFailedPhotoUrl] = useState(null);
  const [photoViewerVisible, setPhotoViewerVisible] = useState(false);
  const [feeViewerVisible, setFeeViewerVisible] = useState(false);
  const initials = getInitials(student?.name);
  const compact = width < layout.breakpoints.compact;
  const tileColumns =
    width >= layout.breakpoints.threeColumn
      ? 3
      : width >= layout.breakpoints.twoColumn
        ? 2
        : 1;
  const tileWidth =
    tileColumns === 3 ? "31.5%" : tileColumns === 2 ? "48.5%" : "100%";
  const eventTickets = Array.isArray(student?.eventTickets)
    ? student.eventTickets
    : [];
  const feeGroups = Array.isArray(student?.feeGroups) ? student.feeGroups : [];
  const transport = student?.transport || null;
  const seating = student?.seating || null;
  const showFees = feeGroups.length > 0;

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    return () => entrance.stopAnimation();
  }, [entrance]);

  const details = useMemo(
    () =>
      DETAIL_FIELDS.filter(({ key }) => hasText(student?.[key])),
    [student],
  );

  const showPhoto =
    Boolean(student?.photoUrl) && failedPhotoUrl !== student.photoUrl;
  const registration = student?.registrationNumber || "";
  const seatingMessage = differsFrom(seating?.message, seating?.status)
    ? seating.message
    : null;
  const transportMessage = differsFrom(transport?.message, transport?.status)
    ? transport.message
    : null;
  const showSeatingHeader =
    hasText(seating?.status) || (seating?.entries?.length || 0) > 0;
  const seatingHasContent =
    Boolean(seating) &&
    (showSeatingHeader ||
      Boolean(seatingMessage) ||
      (seating.rows?.length || 0) > 0);
  const transportHasContent =
    Boolean(transport) &&
    (hasText(transport.status) ||
      Boolean(transportMessage) ||
      hasText(transport.route) ||
      hasText(transport.vehicleNumber) ||
      hasText(transport.busType) ||
      transport.active ||
      transport.validToday);

  const handleCopyRegistration = async () => {
    if (!registration) {
      return;
    }
    try {
      await Haptics.selectionAsync();
    } catch {}
    await Clipboard.setStringAsync(registration);
    Alert.alert("Copied", "Registration number copied.");
  };

  const handleShareRecord = async () => {
    const message = buildStudentShareMessage(student);
    if (!message) {
      return;
    }
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    await Share.share({ message, title: "Student record" });
  };

  const handleCopyAll = async () => {
    const text = buildStudentRecordText(student);
    if (!text) {
      return;
    }
    await Clipboard.setStringAsync(text);
    Alert.alert("Copied", "Record details copied.");
  };

  return (
    <>
      <Animated.View
        style={[
          styles.wrapper,
          {
            opacity: entrance,
            transform: [
              {
                translateY: entrance.interpolate({
                  inputRange: [0, 1],
                  outputRange: [14, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={[styles.card, compact && styles.cardCompact]}>
          <View
            style={[styles.identityRow, compact && styles.identityRowCompact]}
          >
            <View style={[styles.avatar, compact && styles.avatarCompact]}>
              {showPhoto ? (
                <Image
                  source={{ uri: student.photoUrl }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                  onError={() => setFailedPhotoUrl(student.photoUrl)}
                  accessibilityLabel={`${student.name || "Student"} photo`}
                />
              ) : initials ? (
                <Text
                  style={[
                    styles.avatarInitials,
                    compact && styles.avatarInitialsCompact,
                  ]}
                >
                  {initials}
                </Text>
              ) : (
                <Ionicons
                  name="person-outline"
                  size={28}
                  color={colors.accent}
                />
              )}
            </View>

            <View style={styles.identityCopy}>
              <Text style={[styles.name, compact && styles.nameCompact]}>
                {student.name || "Student record"}
              </Text>

              <StatusPill value={student.status} />
            </View>
          </View>

          <View style={styles.registrationPill}>
            <View style={styles.registrationIcon}>
              <Ionicons name="key-outline" size={17} color={colors.accent} />
            </View>
            <View style={styles.registrationCopy}>
              <Text style={styles.registrationLabel}>Registration number</Text>
              <Text
                style={styles.registrationValue}
                numberOfLines={1}
                ellipsizeMode="middle"
                selectable
              >
                {student.registrationNumber || "Not provided"}
              </Text>
            </View>
            {registration ? (
              <Pressable
                onPress={handleCopyRegistration}
                hitSlop={6}
                style={styles.copyButton}
                accessibilityRole="button"
                accessibilityLabel="Copy registration number"
              >
                <Ionicons name="copy-outline" size={16} color={colors.accent} />
              </Pressable>
            ) : null}
          </View>

          <View style={styles.actionRow}>
            {showPhoto ? (
              <ActionButton
                icon="image-outline"
                label="Photo"
                accessibilityLabel="View and save student photo"
                onPress={() => setPhotoViewerVisible(true)}
              />
            ) : null}
            <ActionButton
              icon="share-outline"
              label="Share"
              accessibilityLabel="Share student record"
              onPress={handleShareRecord}
            />
            <ActionButton
              icon="copy-outline"
              label="Copy"
              accessibilityLabel="Copy record details"
              onPress={handleCopyAll}
            />
            {registration && onSearchRegistration ? (
              <ActionButton
                icon="refresh-outline"
                label="Refresh"
                accessibilityLabel="Refresh student record"
                onPress={() => onSearchRegistration(registration)}
              />
            ) : null}
          </View>

          {details.length > 0 ? (
            <CardSection title="Academic & personal details">
              <View style={styles.tileGrid}>
                {details.map((field) => (
                  <InfoTile
                    key={field.key}
                    icon={field.icon}
                    label={field.label}
                    value={student[field.key]}
                    width={tileWidth}
                  />
                ))}
              </View>
            </CardSection>
          ) : null}

          {eventTickets.length > 0 ? (
            <CardSection title="Event ticket">
              {eventTickets.map((ticket, index) => (
                <View
                  key={`${ticket.title || "event"}-${index}`}
                  style={[styles.panel, index > 0 && styles.panelSpacing]}
                >
                  <View style={styles.panelHeader}>
                    <View style={styles.panelTitleWrap}>
                      <Text style={styles.panelTitle}>
                        {ticket.title || "Event"}
                      </Text>
                      <StatusPill
                        value={ticket.status}
                        style={styles.panelBadge}
                      />
                    </View>
                    {hasText(ticket.amount) ? (
                      <Text style={styles.panelAmount}>{ticket.amount}</Text>
                    ) : null}
                  </View>

                  <View style={styles.tileGrid}>
                    {hasText(ticket.date) ? (
                      <InfoTile
                        icon="calendar-outline"
                        label="Date"
                        value={ticket.date}
                        width={tileWidth}
                      />
                    ) : null}
                    {hasText(ticket.time) ? (
                      <InfoTile
                        icon="time-outline"
                        label="Time"
                        value={ticket.time}
                        width={tileWidth}
                      />
                    ) : null}
                    {hasText(ticket.venue) ? (
                      <InfoTile
                        icon="location-outline"
                        label="Venue"
                        value={ticket.venue}
                        width={tileWidth}
                      />
                    ) : null}
                    {hasText(ticket.ticketNumber) ? (
                      <InfoTile
                        icon="ticket-outline"
                        label="Ticket no"
                        value={ticket.ticketNumber}
                        width={tileWidth}
                      />
                    ) : null}
                    {differsFrom(ticket.paymentStatus, ticket.status) ? (
                      <InfoTile
                        icon="card-outline"
                        label="Payment"
                        value={ticket.paymentStatus}
                        width={tileWidth}
                      />
                    ) : null}
                  </View>
                </View>
              ))}
            </CardSection>
          ) : null}

          {transportHasContent ? (
            <CardSection title="Transport">
              <View style={styles.panel}>
                <View style={styles.panelHeader}>
                  <View style={styles.panelTitleWrap}>
                    <Text style={styles.panelTitle}>Bus service</Text>
                    <StatusPill
                      value={transport.status}
                      style={styles.panelBadge}
                    />
                  </View>
                </View>

                {transportMessage ? (
                  <Text style={styles.panelMessage}>{transportMessage}</Text>
                ) : null}

                <View style={styles.tileGrid}>
                  {hasText(transport.route) ? (
                    <InfoTile
                      icon="navigate-outline"
                      label="Route"
                      value={transport.route}
                      width={tileWidth}
                    />
                  ) : null}
                  {hasText(transport.vehicleNumber) ? (
                    <InfoTile
                      icon="bus-outline"
                      label="Vehicle no"
                      value={transport.vehicleNumber}
                      width={tileWidth}
                    />
                  ) : null}
                  {hasText(transport.busType) ? (
                    <InfoTile
                      icon="grid-outline"
                      label="Bus type"
                      value={transport.busType}
                      width={tileWidth}
                    />
                  ) : null}
                </View>

                {transport.active || transport.validToday ? (
                  <View style={styles.chipsRow}>
                    {transport.active && !hasText(transport.status) ? (
                      <View style={styles.chip}>
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={12}
                          color={colors.success}
                        />
                        <Text style={styles.chipText}>Active transport</Text>
                      </View>
                    ) : null}
                    {transport.validToday ? (
                      <View style={styles.chip}>
                        <Ionicons
                          name="time-outline"
                          size={12}
                          color={colors.success}
                        />
                        <Text style={styles.chipText}>Valid today</Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </View>
            </CardSection>
          ) : null}

          {seatingHasContent ? (
            <CardSection title="Exam seating">
              <View style={styles.panel}>
                {showSeatingHeader ? (
                  <View style={styles.panelHeader}>
                    <View style={styles.panelTitleWrap}>
                      <StatusPill value={seating.status} />
                    </View>
                    {seating.entries?.length > 0 ? (
                      <View style={styles.seatCountPill}>
                        <Ionicons
                          name="calendar-outline"
                          size={12}
                          color={colors.accent}
                        />
                        <Text style={styles.seatCountText}>
                          {seating.entries.length}{" "}
                          {seating.entries.length === 1 ? "exam" : "exams"}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}

                {seatingMessage ? (
                  <Text style={styles.panelMessage}>{seatingMessage}</Text>
                ) : null}

                {seating.entries?.length > 0 ? (
                  <SeatingList entries={seating.entries} />
                ) : seating.rows?.length > 0 ? (
                  <SeatingTable
                    headers={seating.headers}
                    rows={seating.rows}
                    cellWidth={tileWidth}
                  />
                ) : null}
              </View>
            </CardSection>
          ) : null}

          {showFees ? (
            <CardSection title="Fee details">
              <View style={styles.panel}>
                {feeGroups.map((group, index) => {
                  const summary = summarizeInvoiceGroup(group) || "No records";

                  return (
                    <Pressable
                      key={group.id || group.title || index}
                      onPress={() => setFeeViewerVisible(true)}
                      style={({ pressed }) => [
                        styles.feeRow,
                        index > 0 && styles.feeRowBorder,
                        pressed && styles.feeRowPressed,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Open ${group.title || "fee details"}`}
                    >
                      <View style={styles.feeIcon}>
                        <Ionicons
                          name={
                            group.id === "transport"
                              ? "bus-outline"
                              : "receipt-outline"
                          }
                          size={16}
                          color={colors.accent}
                        />
                      </View>
                      <View style={styles.feeCopy}>
                        <Text style={styles.feeTitle}>
                          {group.title || "Invoices"}
                        </Text>
                        <Text style={styles.feeSummary}>{summary}</Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={colors.textMuted}
                      />
                    </Pressable>
                  );
                })}
              </View>
            </CardSection>
          ) : null}

          {student.extraDetails?.length > 0 ? (
            <CardSection title="More details">
              <View style={styles.extraList}>
                {student.extraDetails.map((detail, index) => (
                  <View
                    key={`${detail.label}-${index}`}
                    style={[
                      styles.extraRow,
                      index > 0 && styles.extraRowBorder,
                    ]}
                  >
                    <Text
                      style={[
                        styles.extraLabel,
                        compact && styles.extraLabelCompact,
                      ]}
                    >
                      {detail.label}
                    </Text>
                    <Text style={styles.extraValue} selectable>
                      {detail.value}
                    </Text>
                  </View>
                ))}
              </View>
            </CardSection>
          ) : null}
        </View>
      </Animated.View>

      <PhotoViewer
        visible={photoViewerVisible}
        student={student}
        onClose={() => setPhotoViewerVisible(false)}
      />
      <FeeViewer
        visible={feeViewerVisible}
        student={student}
        onClose={() => setFeeViewerVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 16,
  },
  card: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  cardCompact: {
    padding: 16,
    borderRadius: 20,
  },
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  identityRowCompact: {
    gap: 12,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentSoft,
  },
  avatarCompact: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarInitials: {
    color: colors.accent,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  avatarInitialsCompact: {
    fontSize: 20,
  },
  identityCopy: {
    flex: 1,
    alignItems: "flex-start",
    gap: 8,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.1,
    lineHeight: 28,
  },
  nameCompact: {
    fontSize: 20,
    lineHeight: 26,
  },
  registrationPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 18,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardElevated,
  },
  registrationIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentSoft,
  },
  registrationCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  copyButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentSoft,
  },
  registrationLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  registrationValue: {
    color: colors.textPrimary,
    fontFamily: "monospace",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },
  actionButton: {
    flexGrow: 1,
    flexBasis: 0,
    minWidth: 104,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentSoft,
    overflow: "hidden",
  },
  actionButtonPressed: {
    opacity: 0.8,
  },
  actionText: {
    flexShrink: 1,
    color: colors.accent,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 20,
    backgroundColor: colors.border,
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTick: {
    width: 3,
    height: 12,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  tileGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
    columnGap: 8,
  },
  tile: {
    minHeight: 74,
    padding: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardElevated,
  },
  tilePressed: {
    opacity: 0.78,
    borderColor: colors.accentBorder,
  },
  tileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 7,
  },
  tileLabel: {
    flexShrink: 1,
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  tileValue: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  panel: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardElevated,
  },
  panelSpacing: {
    marginTop: 10,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },
  panelTitleWrap: {
    flex: 1,
    minWidth: 150,
    alignItems: "flex-start",
  },
  panelTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21,
  },
  panelBadge: {
    marginTop: 7,
  },
  panelAmount: {
    color: colors.accent,
    fontFamily: "monospace",
    fontSize: 13,
    fontWeight: "700",
  },
  panelMessage: {
    marginBottom: 12,
    color: colors.textSecondary,
    fontSize: 12.5,
    lineHeight: 18,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.successBorder,
    backgroundColor: colors.successSoft,
  },
  chipText: {
    color: colors.success,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  seatingTable: {
    marginTop: 2,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  seatingRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
    paddingVertical: 10,
  },
  seatingRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  seatingCell: {
    paddingRight: 8,
  },
  seatingLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  seatingValue: {
    marginTop: 3,
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
  },
  seatCountPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentSoft,
  },
  seatCountText: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  seatList: {
    gap: 10,
  },
  seatCard: {
    padding: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  seatHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  seatSubjectWrap: {
    flex: 1,
    minWidth: 0,
  },
  seatSubject: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 19,
  },
  seatSubjectCode: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  seatWhenRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },
  seatWhenItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  seatWhenText: {
    flexShrink: 1,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  seatLocationRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  seatLocation: {
    flexGrow: 1,
    flexBasis: "30%",
    minWidth: 86,
    padding: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardElevated,
  },
  seatLocationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  seatLocationLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  seatLocationValue: {
    marginTop: 3,
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 17,
  },
  attendancePanel: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  attendanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 8,
  },
  attendanceTitle: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  attendancePercent: {
    fontFamily: "monospace",
    fontSize: 14,
    fontWeight: "800",
  },
  attendanceStats: {
    flexDirection: "row",
    gap: 6,
  },
  attendanceStat: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 7,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardElevated,
  },
  attendanceStatLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  attendanceStatValue: {
    marginTop: 3,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 18,
  },
  attendanceBarTrack: {
    height: 4,
    marginTop: 8,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: colors.border,
  },
  attendanceBarFill: {
    height: "100%",
    borderRadius: 999,
  },
  feeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
  },
  feeRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  feeRowPressed: {
    opacity: 0.76,
  },
  feeIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentSoft,
  },
  feeCopy: {
    flex: 1,
  },
  feeTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  feeSummary: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 11.5,
    lineHeight: 16,
  },
  extraList: {
    gap: 0,
  },
  extraRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 11,
  },
  extraRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  extraLabel: {
    width: "38%",
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  extraLabelCompact: {
    width: "34%",
  },
  extraValue: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 19,
  },
});

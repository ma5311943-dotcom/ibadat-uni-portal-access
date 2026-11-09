import Ionicons from "@expo/vector-icons/Ionicons";
import {
  Modal,
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

import { colors, layout } from "../theme/colors";
import { isInvoicePaid, summarizeInvoiceGroup } from "../utils/fees";
import { ModalHeader } from "./ModalHeader";
import { StatusPill } from "./StatusPill";

function InvoiceCard({ invoice, width }) {
  return (
    <View style={[styles.invoiceCard, { width }]}>
      <View style={styles.invoiceHeader}>
        <View style={styles.invoiceIcon}>
          <Ionicons
            name="document-text-outline"
            size={17}
            color={colors.accent}
          />
        </View>
        <View style={styles.invoiceHeading}>
          <Text style={styles.invoiceLabel}>Invoice</Text>
          <Text
            style={styles.invoiceNumber}
            numberOfLines={1}
            ellipsizeMode="middle"
            selectable
          >
            {invoice.invoiceNumber || "Not provided"}
          </Text>
        </View>
      </View>

      <StatusPill value={invoice.status} style={styles.invoiceStatus} />

      <View style={styles.invoiceMetaRow}>
        <View style={styles.invoiceMeta}>
          <Text style={styles.invoiceMetaLabel}>Due date</Text>
          <Text style={styles.invoiceMetaValue}>
            {invoice.dueDate || "Not provided"}
          </Text>
        </View>
        <View style={styles.invoiceMeta}>
          <Text style={styles.invoiceMetaLabel}>Amount due</Text>
          <Text style={[styles.invoiceMetaValue, styles.amountValue]}>
            {invoice.amountDue || "Not provided"}
          </Text>
        </View>
      </View>
    </View>
  );
}

function InvoiceGroup({ group, cardWidth }) {
  const rows = Array.isArray(group.rows) ? group.rows : [];
  const summary = summarizeInvoiceGroup(group);

  return (
    <View style={styles.group}>
      <View style={styles.groupHeader}>
        <View style={styles.groupTitleWrap}>
          <View style={styles.sectionTick} />
          <Text style={styles.groupTitle}>
            {group.title || "Fee records"}
          </Text>
        </View>
        {summary ? (
          <Text style={styles.groupSummary} numberOfLines={2}>
            {summary}
          </Text>
        ) : null}
      </View>

      {rows.length > 0 ? (
        <View style={styles.invoiceGrid}>
          {rows.map((invoice, index) => (
            <InvoiceCard
              key={`${invoice.invoiceNumber || "invoice"}-${index}`}
              invoice={invoice}
              width={cardWidth}
            />
          ))}
        </View>
      ) : (
        <View style={styles.emptyGroup}>
          <Ionicons
            name="checkmark-circle-outline"
            size={22}
            color={colors.success}
          />
          <View style={styles.emptyGroupCopy}>
            <Text style={styles.emptyGroupTitle}>
              {group.emptyTitle || "No invoice records"}
            </Text>
            {group.emptyMessage ? (
              <Text style={styles.emptyGroupMessage}>
                {group.emptyMessage}
              </Text>
            ) : null}
          </View>
        </View>
      )}
    </View>
  );
}

export function FeeViewer({ visible, student, onClose }) {
  const { width } = useWindowDimensions();
  const groups = Array.isArray(student?.feeGroups)
    ? student.feeGroups
    : [];
  const cardWidth =
    width >= layout.breakpoints.wideModal ? "48.5%" : "100%";
  const totalInvoices = groups.reduce(
    (sum, group) =>
      sum + (Array.isArray(group.rows) ? group.rows.length : 0),
    0,
  );
  const unpaidInvoices = groups.reduce((sum, group) => {
    const rows = Array.isArray(group.rows) ? group.rows : [];
    return sum + rows.filter((row) => !isInvoicePaid(row.status)).length;
  }, 0);
  const summaryValue =
    totalInvoices === 0
      ? "No invoices on record"
      : `${totalInvoices} invoice${totalInvoices === 1 ? "" : "s"} · ${
          unpaidInvoices === 0 ? "all paid" : `${unpaidInvoices} unpaid`
        }`;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <SafeAreaProvider initialMetrics={initialWindowMetrics} style={styles.root}>
        <SafeAreaView
          style={styles.root}
          edges={["top", "bottom", "left", "right"]}
        >
          <ModalHeader
            title="Fee details"
            subtitle={student?.name || "Student"}
            onBack={onClose}
          />

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {groups.length > 0 ? (
              <View style={styles.summaryBanner}>
                <View style={styles.summaryIcon}>
                  <Ionicons
                    name="wallet-outline"
                    size={22}
                    color={colors.accent}
                  />
                </View>
                <View style={styles.summaryCopy}>
                  <Text style={styles.summaryLabel}>Summary</Text>
                  <Text style={styles.summaryValue}>{summaryValue}</Text>
                </View>
              </View>
            ) : null}

            {groups.length > 0 ? (
              groups.map((group, index) => (
                <InvoiceGroup
                  key={group.id || group.title || index}
                  group={group}
                  cardWidth={cardWidth}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons
                  name="receipt-outline"
                  size={34}
                  color={colors.textMuted}
                />
                <Text style={styles.emptyStateTitle}>No fee details</Text>
                <Text style={styles.emptyStateMessage}>
                  The student page did not include any invoice records.
                </Text>
              </View>
            )}
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
    paddingBottom: 28,
  },
  summaryBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentSoft,
  },
  summaryIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.accentBorder,
    backgroundColor: colors.card,
  },
  summaryCopy: {
    flex: 1,
    minWidth: 0,
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  summaryValue: {
    marginTop: 3,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  group: {
    marginTop: 16,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  groupTitleWrap: {
    flex: 1,
    minWidth: 180,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTick: {
    width: 3,
    height: 12,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
  groupTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  groupSummary: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 15,
  },
  invoiceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
    columnGap: 8,
  },
  invoiceCard: {
    padding: 14,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardElevated,
  },
  invoiceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  invoiceIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentSoft,
  },
  invoiceHeading: {
    flex: 1,
    minWidth: 0,
  },
  invoiceLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  invoiceNumber: {
    marginTop: 2,
    color: colors.textPrimary,
    fontFamily: "monospace",
    fontSize: 12,
    fontWeight: "700",
  },
  invoiceStatus: {
    marginTop: 12,
  },
  invoiceMetaRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  invoiceMeta: {
    flex: 1,
  },
  invoiceMetaLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  invoiceMetaValue: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
  },
  amountValue: {
    color: colors.textPrimary,
    fontFamily: "monospace",
  },
  emptyGroup: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 13,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardElevated,
  },
  emptyGroupCopy: {
    flex: 1,
  },
  emptyGroupTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
  },
  emptyGroupMessage: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  emptyState: {
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    padding: 28,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  emptyStateTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  emptyStateMessage: {
    maxWidth: 320,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
});

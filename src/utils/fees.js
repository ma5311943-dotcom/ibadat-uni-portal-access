const PAID_STATUS = /^(paid|cleared|settled|completed)$/i;

export function isInvoicePaid(status) {
  return PAID_STATUS.test(String(status ?? '').trim());
}

export function summarizeInvoiceGroup(group) {
  if (!group) {
    return '';
  }

  const rows = Array.isArray(group.rows) ? group.rows : [];

  if (rows.length === 0) {
    return group.emptyTitle || group.emptyMessage || '';
  }

  const unpaidCount = rows.filter(
    (row) => !isInvoicePaid(row.status),
  ).length;
  const invoiceLabel =
    rows.length === 1 ? '1 invoice' : `${rows.length} invoices`;

  if (unpaidCount === 0) {
    return `${invoiceLabel} \u00b7 paid`;
  }

  return `${invoiceLabel} \u00b7 ${unpaidCount} unpaid`;
}

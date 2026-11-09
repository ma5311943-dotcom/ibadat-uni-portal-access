import { summarizeInvoiceGroup } from "./fees";
import { DETAIL_FIELDS } from "./studentFields";

export function hasText(value) {
  return value !== null && value !== undefined && String(value).trim().length > 0;
}

function appendLine(lines, seen, label, value) {
  if (!hasText(value)) {
    return;
  }

  const text = String(value).trim();
  const key = `${label}\u0000${text}`;

  if (seen.has(key)) {
    return;
  }

  seen.add(key);
  lines.push(`${label}: ${text}`);
}

function appendSeating(lines, seen, seating) {
  const entries = Array.isArray(seating?.entries) ? seating.entries : [];

  entries.forEach((entry) => {
    const subject = hasText(entry.subject) ? String(entry.subject).trim() : "";
    const prefix = subject ? `${subject} seating` : "Seating";

    appendLine(lines, seen, prefix, entry.status);
    appendLine(lines, seen, `${prefix} date`, entry.date);
    appendLine(lines, seen, `${prefix} time`, entry.time);

    const location = [
      entry.block,
      entry.floor,
      entry.room,
      entry.column,
      entry.seatNumber,
    ]
      .filter(hasText)
      .map((part) => String(part).trim())
      .join(" · ");

    appendLine(lines, seen, `${prefix} location`, location);
  });

  if (entries.length === 0) {
    appendLine(lines, seen, "Seating", seating?.status);
  }
}

export function buildStudentRecordText(student) {
  if (!student) {
    return "";
  }

  const lines = [];
  const seen = new Set();

  appendLine(lines, seen, "Name", student.name);
  appendLine(lines, seen, "Registration", student.registrationNumber);

  DETAIL_FIELDS.forEach(({ key, label }) => {
    appendLine(lines, seen, label, student[key]);
  });

  if (Array.isArray(student.extraDetails)) {
    student.extraDetails.forEach(({ label, value }) => {
      appendLine(lines, seen, label, value);
    });
  }

  if (student.transport) {
    appendLine(lines, seen, "Transport", student.transport.status);
    appendLine(lines, seen, "Transport route", student.transport.route);
    appendLine(lines, seen, "Vehicle no", student.transport.vehicleNumber);
    appendLine(lines, seen, "Bus type", student.transport.busType);
    appendLine(lines, seen, "Transport note", student.transport.message);
  }

  if (student.seating) {
    appendSeating(lines, seen, student.seating);
  }

  if (Array.isArray(student.eventTickets)) {
    student.eventTickets.forEach((ticket) => {
      const title = hasText(ticket.title) ? String(ticket.title).trim() : "Event";

      appendLine(lines, seen, `${title} date`, ticket.date);
      appendLine(lines, seen, `${title} time`, ticket.time);
      appendLine(lines, seen, `${title} venue`, ticket.venue);
      appendLine(lines, seen, `${title} ticket no`, ticket.ticketNumber);
      appendLine(lines, seen, `${title} payment`, ticket.paymentStatus);
      appendLine(lines, seen, `${title} amount`, ticket.amount);
      appendLine(lines, seen, `${title} status`, ticket.status);
    });
  }

  if (Array.isArray(student.feeGroups)) {
    student.feeGroups.forEach((group) => {
      const summary = summarizeInvoiceGroup(group);
      appendLine(
        lines,
        seen,
        group.title || "Fee records",
        summary || group.emptyMessage,
      );
    });
  }

  return lines.join("\n");
}

export function buildStudentShareMessage(student) {
  const text = buildStudentRecordText(student);

  if (!text) {
    return "";
  }

  return ["Student record", text].join("\n");
}

const NAMED_ENTITIES = {
  amp: '&',
  apos: "'",
  bull: '\u2022',
  copy: '\u00a9',
  deg: '\u00b0',
  gt: '>',
  hellip: '\u2026',
  ldquo: '\u201c',
  lsquo: '\u2018',
  lt: '<',
  mdash: '\u2014',
  middot: '\u00b7',
  nbsp: ' ',
  ndash: '\u2013',
  quot: '"',
  rdquo: '\u201d',
  reg: '\u00ae',
  rsquo: '\u2019',
  trade: '\u2122',
};

const PROFILE_START = 'Student Profile Header';
const EVENT_START = 'University Event Tickets';
const TRANSPORT_START = 'Transport Status - Centered with Colorful Icons';
const SEATING_START = 'Seating Arrangement Section';
const CURRENT_INVOICES_START = 'Current Session Invoices';
const PREVIOUS_INVOICES_START = 'Previous Sessions Invoices';
const TRANSPORT_INVOICES_START = 'Transport Invoices';
const MAIN_END = 'main-area-end';

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toCodePoint(match, code, radix) {
  const codePoint = Number.parseInt(code, radix);

  if (
    !Number.isFinite(codePoint) ||
    codePoint < 0 ||
    codePoint > 0x10ffff
  ) {
    return match;
  }

  return String.fromCodePoint(codePoint);
}

function decodeHtmlEntities(value) {
  return String(value ?? '')
    .replace(/&#x([0-9a-f]+);/gi, (match, code) =>
      toCodePoint(match, code, 16),
    )
    .replace(/&#(\d+);/g, (match, code) => toCodePoint(match, code, 10))
    .replace(
      /&([a-z][a-z0-9]+);/gi,
      (match, name) => NAMED_ENTITIES[name.toLowerCase()] || match,
    );
}

function stripHtml(value) {
  return decodeHtmlEntities(
    String(value ?? '')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<\/(p|div|li|tr|h[1-6]|td|th|table|section)>/gi, ' ')
      .replace(/<[^>]*>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim();
}

function getSection(html, startLabel, endLabels) {
  const startPattern = new RegExp(
    `<!--\\s*${escapeRegExp(startLabel)}\\s*-->`,
    'i',
  );
  const startMatch = startPattern.exec(html);

  if (!startMatch) {
    return '';
  }

  const contentStart = startMatch.index + startMatch[0].length;
  let contentEnd = html.length;

  for (const label of endLabels) {
    const endPattern = new RegExp(
      `<!--\\s*${escapeRegExp(label)}\\s*-->`,
      'i',
    );
    const endMatch = endPattern.exec(html.slice(contentStart));

    if (endMatch) {
      const absoluteIndex = contentStart + endMatch.index;

      if (absoluteIndex < contentEnd) {
        contentEnd = absoluteIndex;
      }
    }
  }

  return html.slice(contentStart, contentEnd);
}

function getClassBlock(html, className) {
  const pattern = new RegExp(
    `<([a-z0-9]+)\\b[^>]*\\bclass=["'][^"']*\\b${escapeRegExp(
      className,
    )}\\b[^"']*["'][^>]*>([\\s\\S]*?)<\\/\\1>`,
    'i',
  );
  const match = pattern.exec(html);

  return match ? match[2] : '';
}

function cleanLabel(value) {
  return stripHtml(value)
    .replace(/[:：]\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanValue(value) {
  return stripHtml(value)
    .replace(/^[:：]\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizedKey(value) {
  return cleanLabel(value).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function titleCase(value) {
  const text = cleanValue(value);

  if (!text || text !== text.toUpperCase()) {
    return text;
  }

  return text
    .toLowerCase()
    .replace(/\b[a-z]/g, (character) => character.toUpperCase());
}

function normalizeImageUri(value) {
  const uri = decodeHtmlEntities(value).trim();

  if (/^data:image\/jpg;base64,/i.test(uri)) {
    return uri.replace(/^data:image\/jpg;/i, 'data:image/jpeg;');
  }

  if (/^data:image\/[^;]+;base64,/i.test(uri)) {
    return uri;
  }

  if (/^https?:\/\//i.test(uri)) {
    return uri;
  }

  return null;
}

function getHeading(section, level) {
  const pattern = new RegExp(
    `<h${level}\\b[^>]*>([\\s\\S]*?)<\\/h${level}>`,
    'i',
  );
  const match = pattern.exec(section);

  return match ? cleanValue(match[1]) : '';
}

function getFirstParagraph(section) {
  const match = /<p\b[^>]*>([\s\S]*?)<\/p>/i.exec(section);
  return match ? cleanValue(match[1]) : '';
}

function parseFacts(block) {
  const facts = {};
  const spanPattern = /<span\b[^>]*>([\s\S]*?)<\/span>/gi;
  let spanMatch;

  while ((spanMatch = spanPattern.exec(block))) {
    const labelMatch = /<small\b[^>]*>([\s\S]*?)<\/small>/i.exec(
      spanMatch[1],
    );

    if (!labelMatch) {
      continue;
    }

    const label = normalizedKey(labelMatch[1]);
    const value = cleanValue(spanMatch[1].replace(labelMatch[0], ' '));

    if (label && value) {
      facts[label] = value;
    }
  }

  return facts;
}

function parseProfile(section) {
  const headingMatch = /<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(section);
  const name = headingMatch ? cleanValue(headingMatch[1]) : '';
  const fields = {};
  const extraDetails = [];
  const paragraphPattern = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  const avatarBlock = getClassBlock(section, 'student-avatar');
  const imageMatch = /<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/i.exec(
    avatarBlock,
  );
  let paragraphMatch;

  while ((paragraphMatch = paragraphPattern.exec(section))) {
    const labelMatch = /<strong\b[^>]*>([\s\S]*?)<\/strong>/i.exec(
      paragraphMatch[1],
    );

    if (!labelMatch) {
      continue;
    }

    const label = cleanLabel(labelMatch[1]);
    const value = cleanValue(
      paragraphMatch[1].replace(labelMatch[0], ' '),
    );

    if (!label || !value) {
      continue;
    }

    const key = label.toLowerCase();

    if (/^registration\b/.test(key)) {
      fields.registrationNumber = value;
    } else if (/^(program|department)\b/.test(key)) {
      fields.department = value;
    } else if (/^semester\b/.test(key)) {
      fields.semester = value;
    } else if (/^session\b/.test(key)) {
      fields.session = value;
    } else if (/^status\b/.test(key)) {
      fields.status = value;
    } else {
      extraDetails.push({ label, value });
    }
  }

  return {
    name,
    registrationNumber: fields.registrationNumber || null,
    department: fields.department || null,
    semester: fields.semester || null,
    session: fields.session || null,
    status: fields.status || null,
    photoUrl: imageMatch ? normalizeImageUri(imageMatch[1]) : null,
    extraDetails,
  };
}

function parseEventTickets(html) {
  const section = getSection(html, EVENT_START, [
    TRANSPORT_START,
    'Transport Status - Centered with Icon & Text',
    SEATING_START,
    CURRENT_INVOICES_START,
  ]);

  if (!section) {
    return [];
  }

  const title = cleanValue(getClassBlock(section, 'ue1-title'));

  if (!title) {
    return [];
  }

  const stubMatch =
    /<div\b[^>]*\bclass=["'][^"']*\bue1-stub\b[^"']*["'][^>]*>/i.exec(
      section,
    );
  const stub = stubMatch ? section.slice(stubMatch.index) : section;
  const facts = parseFacts(getClassBlock(section, 'ue1-facts'));
  const paymentLabels = [];
  const amountLabels = [];
  const smallPattern = /<small\b[^>]*>([\s\S]*?)<\/small>/gi;
  const amountPattern =
    /<div\b[^>]*\bclass=["'][^"']*\bfw-bold\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi;
  let smallMatch;
  let amountMatch;

  while ((smallMatch = smallPattern.exec(stub))) {
    const label = cleanValue(smallMatch[1]);

    if (label) {
      paymentLabels.push(label);
    }
  }

  while ((amountMatch = amountPattern.exec(stub))) {
    const label = cleanValue(amountMatch[1]);

    if (label) {
      amountLabels.push(label);
    }
  }

  const paymentStatus =
    paymentLabels.find((label) => !/^ticket\s*no$/i.test(label)) || null;

  return [
    {
      title,
      status: titleCase(getClassBlock(section, 'ue1-kicker')) || null,
      stamp: titleCase(getClassBlock(section, 'ue1-stamp')) || null,
      date: facts.date || null,
      time: facts.time || null,
      venue: facts.venue || null,
      ticketNumber:
        cleanValue(getClassBlock(section, 'ue1-no')) || null,
      paymentStatus,
      amount: amountLabels[amountLabels.length - 1] || null,
    },
  ];
}

function parseTransportData(html) {
  const section = getSection(html, TRANSPORT_START, [
    SEATING_START,
    CURRENT_INVOICES_START,
  ]);

  if (!section) {
    return null;
  }

  const headingMatch = /<h[2-4]\b[^>]*>([\s\S]*?)<\/h[2-4]>/i.exec(
    section,
  );
  const status = titleCase(headingMatch ? headingMatch[1] : '');
  const message = getFirstParagraph(section);
  const details = {};
  const detailPattern =
    /<strong\b[^>]*>([\s\S]*?)<\/strong>\s*<span\b[^>]*>([\s\S]*?)<\/span>/gi;
  let detailMatch;

  while ((detailMatch = detailPattern.exec(section))) {
    const label = normalizedKey(detailMatch[1]);
    const value = cleanValue(detailMatch[2]);

    if (label && value) {
      details[label] = value;
    }
  }

  const text = stripHtml(section);

  if (
    !status &&
    !message &&
    !details.route &&
    !details.vehicleno &&
    !details.bustype
  ) {
    return null;
  }

  return {
    status: status || null,
    message: message || null,
    route: details.route || null,
    vehicleNumber: details.vehicleno || null,
    busType: details.bustype || null,
    active: /active transport/i.test(text),
    validToday: /valid today/i.test(text),
  };
}

function parseTable(section) {
  const headings = [];
  const rows = [];
  const headerMatch = /<thead\b[^>]*>([\s\S]*?)<\/thead>/i.exec(section);

  if (headerMatch) {
    const thPattern = /<th\b[^>]*>([\s\S]*?)<\/th>/gi;
    let thMatch;

    while ((thMatch = thPattern.exec(headerMatch[1]))) {
      const heading = cleanValue(thMatch[1]);

      if (heading) {
        headings.push(heading);
      }
    }
  }

  const bodyMatch = /<tbody\b[^>]*>([\s\S]*?)<\/tbody>/i.exec(section);
  const source = bodyMatch ? bodyMatch[1] : section;
  const rowPattern = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;

  while ((rowMatch = rowPattern.exec(source))) {
    const cells = [];
    const cellPattern = /<td\b[^>]*>([\s\S]*?)<\/td>/gi;
    let cellMatch;

    while ((cellMatch = cellPattern.exec(rowMatch[1]))) {
      const value = cleanValue(cellMatch[1]);

      if (value) {
        cells.push(value);
      }
    }

    if (cells.length > 0) {
      rows.push(cells);
    }
  }

  return { headings, rows };
}

function cleanSeatText(value) {
  return cleanValue(String(value ?? '').replace(/\\[nrt]/g, ' '));
}

function parseAttendanceDetails(cell) {
  if (!cell) {
    return null;
  }

  const details = {};
  const itemPattern =
    /<div\b[^>]*\bclass=["'][^"']*\battendance-item\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi;
  let itemMatch;

  while ((itemMatch = itemPattern.exec(cell))) {
    const labelMatch = /<small\b[^>]*>([\s\S]*?)<\/small>/i.exec(
      itemMatch[1],
    );
    const valueMatch = /<strong\b[^>]*>([\s\S]*?)<\/strong>/i.exec(
      itemMatch[1],
    );
    const label = labelMatch ? normalizedKey(labelMatch[1]) : '';
    const value = valueMatch ? cleanSeatText(valueMatch[1]) : '';

    if (label && value) {
      details[label] = value;
    }
  }

  let percentage = '';
  const percentageMatch =
    /Percentage\s*<\/small>\s*<div\b[^>]*>([\s\S]*?)<\/div>/i.exec(cell);

  if (percentageMatch) {
    percentage = cleanSeatText(percentageMatch[1]);
  }

  if (!percentage || Object.keys(details).length === 0) {
    const text = cleanSeatText(cell);
    const flatMatch =
      /Held\s+(\S+)\s+Marked\s+(\S+)\s+Present\s+(\S+)\s+Absent\s+(\S+)/i.exec(
        text,
      );

    if (flatMatch) {
      details.held = details.held || flatMatch[1];
      details.marked = details.marked || flatMatch[2];
      details.present = details.present || flatMatch[3];
      details.absent = details.absent || flatMatch[4];
    }

    if (!percentage) {
      const flatPercentage = /Percentage\s+([\d.]+%)/i.exec(text);

      if (flatPercentage) {
        percentage = flatPercentage[1];
      }
    }
  }

  const result = {
    held: details.held || null,
    marked: details.marked || null,
    present: details.present || null,
    absent: details.absent || null,
    percentage: percentage || null,
  };

  return Object.values(result).some(Boolean) ? result : null;
}

function parseSeatingEntries(section) {
  const bodyMatch = /<tbody\b[^>]*>([\s\S]*?)<\/tbody>/i.exec(section);
  const source = bodyMatch ? bodyMatch[1] : section;
  const headerMatch = /<thead\b[^>]*>([\s\S]*?)<\/thead>/i.exec(section);
  const headerIndexes = {};

  if (headerMatch) {
    const thPattern = /<th\b[^>]*>([\s\S]*?)<\/th>/gi;
    let thMatch;
    let index = 0;

    while ((thMatch = thPattern.exec(headerMatch[1]))) {
      headerIndexes[normalizedKey(thMatch[1])] = index;
      index += 1;
    }
  }

  const findIndex = (...keys) => {
    for (const key of keys) {
      if (headerIndexes[key] !== undefined) {
        return headerIndexes[key];
      }
    }

    return -1;
  };

  const indexes = {
    subject: findIndex('subject'),
    date: findIndex('date'),
    time: findIndex('time'),
    block: findIndex('block'),
    floor: findIndex('floor'),
    room: findIndex('room'),
    column: findIndex('column'),
    seatNumber: findIndex('seatno', 'seatnumber', 'seat'),
    attendance: findIndex('attendancedetails', 'attendance'),
    status: findIndex('status'),
  };

  if (!Object.values(indexes).some((index) => index >= 0)) {
    Object.assign(indexes, {
      subject: 0,
      date: 1,
      time: 2,
      block: 3,
      floor: 4,
      room: 5,
      column: 6,
      seatNumber: 7,
      attendance: 8,
      status: 9,
    });
  }

  const entries = [];
  const rowPattern = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;

  while ((rowMatch = rowPattern.exec(source))) {
    const cells = [];
    const cellPattern = /<td\b[^>]*>([\s\S]*?)<\/td>/gi;
    let cellMatch;

    while ((cellMatch = cellPattern.exec(rowMatch[1]))) {
      cells.push(cellMatch[1]);
    }

    if (cells.length === 0) {
      continue;
    }

    const getCell = (index) =>
      index >= 0 && index < cells.length ? cells[index] : '';
    const subjectCell = getCell(indexes.subject);
    const subjectHeading = /<h[3-6]\b[^>]*>([\s\S]*?)<\/h[3-6]>/i.exec(
      subjectCell,
    );
    const subjectCodeMatch = /<small\b[^>]*>([\s\S]*?)<\/small>/i.exec(
      subjectCell,
    );
    const entry = {
      subject:
        cleanSeatText(subjectHeading ? subjectHeading[1] : subjectCell) ||
        null,
      subjectCode: subjectCodeMatch
        ? cleanSeatText(subjectCodeMatch[1]) || null
        : null,
      date: cleanSeatText(getCell(indexes.date)) || null,
      time: cleanSeatText(getCell(indexes.time)) || null,
      block: cleanSeatText(getCell(indexes.block)) || null,
      floor: cleanSeatText(getCell(indexes.floor)) || null,
      room: cleanSeatText(getCell(indexes.room)) || null,
      column: cleanSeatText(getCell(indexes.column)) || null,
      seatNumber: cleanSeatText(getCell(indexes.seatNumber)) || null,
      attendance: parseAttendanceDetails(getCell(indexes.attendance)),
      status: cleanSeatText(getCell(indexes.status)) || null,
    };
    const hasContent = Object.entries(entry).some(([key, value]) => {
      if (key === 'attendance') {
        return value && Object.values(value).some(Boolean);
      }

      return Boolean(value);
    });

    if (hasContent) {
      entries.push(entry);
    }
  }

  return entries;
}

function parseSeatingData(html) {
  const section = getSection(html, SEATING_START, [
    CURRENT_INVOICES_START,
  ]);

  if (!section) {
    return null;
  }

  const table = parseTable(section);

  return {
    title: getHeading(section, 4) || 'Exam Seating Arrangement',
    status: getHeading(section, 5) || null,
    message: getFirstParagraph(section) || null,
    headers: table.headings,
    rows: table.rows,
    entries: parseSeatingEntries(section),
  };
}

function buildInvoiceGroup(html, start, endLabels, id, fallbackTitle) {
  const section = getSection(html, start, endLabels);

  if (!section) {
    return null;
  }

  const table = parseTable(section);
  const rows = table.rows.map((cells) => ({
    invoiceNumber: cells[0] || null,
    dueDate: cells[1] || null,
    amountDue: cells[2] || null,
    status: cells[cells.length - 1] || null,
  }));
  const emptyTitle = rows.length === 0 ? getHeading(section, 5) : '';
  const emptyMessage =
    rows.length === 0 ? getFirstParagraph(section) : '';

  return {
    id,
    title: getHeading(section, 4) || fallbackTitle,
    headers: table.headings,
    rows,
    emptyTitle: emptyTitle || null,
    emptyMessage: emptyMessage || null,
  };
}

function parseFeeGroups(html) {
  return [
    buildInvoiceGroup(
      html,
      CURRENT_INVOICES_START,
      [PREVIOUS_INVOICES_START],
      'current',
      'Current session invoices',
    ),
    buildInvoiceGroup(
      html,
      PREVIOUS_INVOICES_START,
      [TRANSPORT_INVOICES_START],
      'previous',
      'Previous session invoices',
    ),
    buildInvoiceGroup(
      html,
      TRANSPORT_INVOICES_START,
      [MAIN_END],
      'transport',
      'Transport fee invoices',
    ),
  ].filter(Boolean);
}

function dedupeDetails(details) {
  const seen = new Set();

  return details.filter((detail) => {
    if (!detail.label || !detail.value) {
      return false;
    }

    const key = `${detail.label}\u0000${detail.value}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function parseStudentHtml(html, requestedRegistration) {
  if (typeof html !== 'string' || html.trim().length === 0) {
    return null;
  }

  const profileSection =
    getSection(html, PROFILE_START, [
      EVENT_START,
      TRANSPORT_START,
      'Transport Status - Centered with Icon & Text',
      SEATING_START,
      CURRENT_INVOICES_START,
    ]) || html.slice(0, 20000);
  const profile = parseProfile(profileSection);

  if (
    !profile.name ||
    (!profile.registrationNumber &&
      !profile.department &&
      !profile.semester)
  ) {
    return null;
  }

  const requested = String(requestedRegistration ?? '').trim();

  return {
    name: profile.name,
    registrationNumber:
      profile.registrationNumber || requested || null,
    department: profile.department,
    semester: profile.semester,
    session: profile.session,
    status: profile.status,
    photoUrl: profile.photoUrl,
    eventTickets: parseEventTickets(html),
    transport: parseTransportData(html),
    seating: parseSeatingData(html),
    feeGroups: parseFeeGroups(html),
    extraDetails: dedupeDetails(profile.extraDetails),
  };
}

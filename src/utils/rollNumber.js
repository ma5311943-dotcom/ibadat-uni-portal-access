const TRAILING_NUMBER = /(.*?)(\d+)$/;

export function normalizeRollNumber(value) {
  return String(value ?? "").trim();
}

export function getAdjacentRollNumber(value, delta) {
  const registration = normalizeRollNumber(value);
  const match = registration.match(TRAILING_NUMBER);

  if (!match) {
    return null;
  }

  const [, prefix, digits] = match;
  const current = Number.parseInt(digits, 10);

  if (!Number.isFinite(current)) {
    return null;
  }

  const next = current + delta;

  if (next < 0) {
    return null;
  }

  const nextDigits = String(next).padStart(digits.length, "0");
  return `${prefix}${nextDigits}`;
}

export function getPreviousRollNumber(value) {
  return getAdjacentRollNumber(value, -1);
}

export function getNextRollNumber(value) {
  return getAdjacentRollNumber(value, 1);
}

export function canNavigateRollNumber(value) {
  return TRAILING_NUMBER.test(normalizeRollNumber(value));
}

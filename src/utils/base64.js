const BASE64_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const BASE64_LOOKUP = Object.create(null);
for (let i = 0; i < BASE64_ALPHABET.length; i += 1) {
  BASE64_LOOKUP[BASE64_ALPHABET[i]] = i;
}

function pushUtf8Bytes(bytes, codePoint) {
  if (codePoint <= 0x7f) {
    bytes.push(codePoint);
    return;
  }

  if (codePoint <= 0x7ff) {
    bytes.push(0xc0 | (codePoint >> 6));
    bytes.push(0x80 | (codePoint & 0x3f));
    return;
  }

  if (codePoint <= 0xffff) {
    bytes.push(0xe0 | (codePoint >> 12));
    bytes.push(0x80 | ((codePoint >> 6) & 0x3f));
    bytes.push(0x80 | (codePoint & 0x3f));
    return;
  }

  bytes.push(0xf0 | (codePoint >> 18));
  bytes.push(0x80 | ((codePoint >> 12) & 0x3f));
  bytes.push(0x80 | ((codePoint >> 6) & 0x3f));
  bytes.push(0x80 | (codePoint & 0x3f));
}

function toUtf8Bytes(value) {
  const text = String(value);
  const bytes = [];

  for (let index = 0; index < text.length; index += 1) {
    let codePoint = text.charCodeAt(index);

    if (codePoint >= 0xd800 && codePoint <= 0xdbff) {
      const nextCodeUnit = text.charCodeAt(index + 1);

      if (nextCodeUnit >= 0xdc00 && nextCodeUnit <= 0xdfff) {
        codePoint =
          0x10000 + ((codePoint - 0xd800) << 10) + (nextCodeUnit - 0xdc00);
        index += 1;
      } else {
        codePoint = 0xfffd;
      }
    } else if (codePoint >= 0xdc00 && codePoint <= 0xdfff) {
      codePoint = 0xfffd;
    }

    pushUtf8Bytes(bytes, codePoint);
  }

  return bytes;
}

export function encodeBase64(value) {
  const bytes = toUtf8Bytes(value);
  let encoded = '';

  for (let index = 0; index < bytes.length; index += 3) {
    const byte1 = bytes[index];
    const byte2 = index + 1 < bytes.length ? bytes[index + 1] : null;
    const byte3 = index + 2 < bytes.length ? bytes[index + 2] : null;

    encoded += BASE64_ALPHABET[byte1 >> 2];
    encoded += BASE64_ALPHABET[((byte1 & 0x03) << 4) | ((byte2 ?? 0) >> 4)];
    encoded +=
      byte2 === null
        ? '='
        : BASE64_ALPHABET[((byte2 & 0x0f) << 2) | ((byte3 ?? 0) >> 6)];
    encoded += byte3 === null ? '=' : BASE64_ALPHABET[byte3 & 0x3f];
  }

  return encoded;
}

export function decodeBase64ToUint8Array(value) {
  const clean = String(value || '').replace(/\s+/g, '');
  if (!clean) {
    return new Uint8Array(0);
  }

  const padded = clean.replace(/=+$/, '');
  const bytes = [];
  let buffer = 0;
  let bits = 0;

  for (let index = 0; index < padded.length; index += 1) {
    const char = padded[index];
    const val = BASE64_LOOKUP[char];
    if (val === undefined) {
      if (char === '-' || char === '_') {
        const urlVal = BASE64_LOOKUP[char === '-' ? '+' : '/'];
        buffer = (buffer << 6) | urlVal;
      } else {
        continue;
      }
    } else {
      buffer = (buffer << 6) | val;
    }
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }

  return new Uint8Array(bytes);
}

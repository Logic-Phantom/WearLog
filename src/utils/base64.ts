const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const LOOKUP = new Uint8Array(256).fill(255);
for (let i = 0; i < ALPHABET.length; i++) LOOKUP[ALPHABET.charCodeAt(i)] = i;
LOOKUP['-'.charCodeAt(0)] = 62;
LOOKUP['_'.charCodeAt(0)] = 63;

/** Decodes base64 (standard or URL-safe, with or without a data: prefix) to bytes. */
export function base64ToBytes(input: string): Uint8Array {
  const comma = input.startsWith('data:') ? input.indexOf(',') : -1;
  const s = comma >= 0 ? input.slice(comma + 1) : input;
  const clean = s.replace(/[^A-Za-z0-9+/\-_]/g, '');
  const outLen = Math.floor((clean.length * 3) / 4);
  const out = new Uint8Array(outLen);
  let o = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const a = LOOKUP[clean.charCodeAt(i)];
    const b = LOOKUP[clean.charCodeAt(i + 1)];
    const c = i + 2 < clean.length ? LOOKUP[clean.charCodeAt(i + 2)] : 0;
    const d = i + 3 < clean.length ? LOOKUP[clean.charCodeAt(i + 3)] : 0;
    const n = (a << 18) | (b << 12) | (c << 6) | d;
    if (o < outLen) out[o++] = (n >> 16) & 0xff;
    if (o < outLen && i + 2 < clean.length) out[o++] = (n >> 8) & 0xff;
    if (o < outLen && i + 3 < clean.length) out[o++] = n & 0xff;
  }
  return out.subarray(0, o);
}

export function bytesToBase64(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    const n = (a << 16) | (b << 8) | c;
    out += ALPHABET[(n >> 18) & 63] + ALPHABET[(n >> 12) & 63];
    out += i + 1 < bytes.length ? ALPHABET[(n >> 6) & 63] : '=';
    out += i + 2 < bytes.length ? ALPHABET[n & 63] : '=';
  }
  return out;
}

/**
 * Minimal JPEG metadata scanner: reports whether an EXIF (APP1) block and a GPS IFD pointer exist.
 * Used as a privacy guard on exported/uploaded copies. Never reads or returns coordinate values.
 */
export interface JpegMetadataScan {
  isJpeg: boolean;
  hasExif: boolean;
  hasGps: boolean;
}

const GPS_IFD_TAG = 0x8825;

export function scanJpegMetadata(bytes: Uint8Array): JpegMetadataScan {
  const out: JpegMetadataScan = { isJpeg: false, hasExif: false, hasGps: false };
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return out;
  out.isJpeg = true;
  let p = 2;
  while (p + 4 <= bytes.length) {
    if (bytes[p] !== 0xff) break;
    const marker = bytes[p + 1];
    if (marker === 0xd9 || marker === 0xda) break; // EOI / start of scan: no more metadata segments
    const len = (bytes[p + 2] << 8) | bytes[p + 3];
    if (len < 2) break;
    const start = p + 4;
    if (marker === 0xe1 && start + 6 <= bytes.length && isExifHeader(bytes, start)) {
      out.hasExif = true;
      if (tiffHasGps(bytes, start + 6, Math.min(bytes.length, p + 2 + len))) out.hasGps = true;
    }
    p += 2 + len;
  }
  return out;
}

function isExifHeader(b: Uint8Array, i: number): boolean {
  // "Exif\0\0"
  return b[i] === 0x45 && b[i + 1] === 0x78 && b[i + 2] === 0x69 && b[i + 3] === 0x66 && b[i + 4] === 0 && b[i + 5] === 0;
}

function tiffHasGps(b: Uint8Array, tiff: number, end: number): boolean {
  if (tiff + 8 > end) return false;
  const little = b[tiff] === 0x49 && b[tiff + 1] === 0x49; // "II"
  const u16 = (o: number) => (little ? b[o] | (b[o + 1] << 8) : (b[o] << 8) | b[o + 1]);
  const u32 = (o: number) => (little ? (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0 : ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0);
  const ifd0 = tiff + u32(tiff + 4);
  if (ifd0 + 2 > end) return false;
  const count = u16(ifd0);
  for (let i = 0; i < count; i++) {
    const entry = ifd0 + 2 + i * 12;
    if (entry + 12 > end) return false;
    if (u16(entry) === GPS_IFD_TAG) return true;
  }
  return false;
}

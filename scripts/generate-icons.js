import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Function to generate a valid PNG file purely with Node.js standard libraries
function createShieldPNG(size) {
  const width = size;
  const height = size;

  // RGBA buffer: 4 bytes per pixel + 1 filter byte per row
  const rowSize = width * 4 + 1;
  const rawData = Buffer.alloc(rowSize * height);

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.45;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = (x - cx) / radius;
      const dy = (y - cy) / radius;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Shield shape condition
      const inShield = (Math.abs(dx) <= 0.85) && (dy >= -0.85) && (dy <= 0.85 - Math.abs(dx) * 0.5);

      if (inShield && dist <= 1.05) {
        // Gradient from cyan (#06b6d4) to emerald (#10b981) to indigo (#6366f1)
        const t = (y / height);
        const r = Math.round(16 * (1 - t) + 14 * t);
        const g = Math.round(185 * (1 - t) + 165 * t);
        const b = Math.round(230 * (1 - t) + 233 * t);

        // Subtle border check
        const isBorder = (Math.abs(dx) > 0.72 || dy < -0.72 || dy > 0.72 - Math.abs(dx) * 0.5);
        if (isBorder) {
          rawData[pxOffset] = 255;
          rawData[pxOffset + 1] = 255;
          rawData[pxOffset + 2] = 255;
          rawData[pxOffset + 3] = 255;
        } else {
          // Center checkmark/emblem
          const inCheck = (Math.abs(dx + 0.15) < 0.12 && dy > -0.1 && dy < 0.25) ||
                          (dx >= -0.15 && dx <= 0.4 && Math.abs(dy - (dx * 1.1 - 0.2)) < 0.14);
          if (inCheck && size >= 32) {
            rawData[pxOffset] = 255;
            rawData[pxOffset + 1] = 255;
            rawData[pxOffset + 2] = 255;
            rawData[pxOffset + 3] = 255;
          } else {
            rawData[pxOffset] = r;
            rawData[pxOffset + 1] = g;
            rawData[pxOffset + 2] = b;
            rawData[pxOffset + 3] = 255;
          }
        }
      } else {
        // Transparent background
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
      }
    }
  }

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT Chunk
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressed);

  // IEND Chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crc = crc32(chunk.subarray(4, 8 + len));
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

// CRC32 implementation for PNG
function crc32(buf) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
  }
  crcTable[n] = c;
}

const assetsDir = path.resolve('src/assets');
fs.mkdirSync(assetsDir, { recursive: true });

for (const size of [16, 48, 128]) {
  const png = createShieldPNG(size);
  const filePath = path.join(assetsDir, `icon${size}.png`);
  fs.writeFileSync(filePath, png);
  console.log(`Generated ${filePath} (${png.length} bytes)`);
}

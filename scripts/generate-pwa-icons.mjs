import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC = join(
  ROOT,
  '../.cursor/projects/c-Users-1-soccer-web-1/assets/c__Users_1_AppData_Roaming_Cursor_User_workspaceStorage_0e5c6d1a0a69b8c1fb931768852d2060_images____fc___-5acc1bd7-5b26-4a2c-a4a3-528094e5c79a.png',
);

function isBackgroundPixel(r, g, b, a) {
  if (a < 10) return true;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max - min;
  return max <= 42 && saturation < 35;
}

function removeBackgroundByFloodFill(data, width, height) {
  const visited = new Uint8Array(width * height);
  const queue = [];

  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const idx = y * width + x;
    if (visited[idx]) return;
    const i = idx * 4;
    if (!isBackgroundPixel(data[i], data[i + 1], data[i + 2], data[i + 3])) return;
    visited[idx] = 1;
    queue.push(idx);
  };

  for (let x = 0; x < width; x++) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    push(0, y);
    push(width - 1, y);
  }

  while (queue.length > 0) {
    const idx = queue.pop();
    const i = idx * 4;
    data[i + 3] = 0;

    const x = idx % width;
    const y = (idx - x) / width;
    push(x - 1, y);
    push(x + 1, y);
    push(x, y - 1);
    push(x, y + 1);
  }

  // 가장자리 안티앨리어싱: 반투명 검정 정리
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const max = Math.max(r, g, b);
    if (max <= 55 && data[i + 3] > 0 && data[i + 3] < 255) {
      const fade = max / 55;
      data[i + 3] = Math.round(data[i + 3] * fade);
    }
  }
}

async function buildLogoPng() {
  const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const buf = Buffer.from(data);
  removeBackgroundByFloodFill(buf, info.width, info.height);
  const trimmed = await sharp(buf, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim({ threshold: 1 })
    .png()
    .toBuffer();
  writeFileSync(join(ROOT, 'public/로고.png'), trimmed);
  return trimmed;
}

async function makeSquareIcon(logoBuffer, size, paddingRatio) {
  const inner = Math.round(size * (1 - paddingRatio * 2));
  const resized = await sharp(logoBuffer).resize(inner, inner, { fit: 'inside' }).png().toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: resized, gravity: 'center' }])
    .png()
    .toBuffer();
}

const logo = await buildLogoPng();
writeFileSync(join(ROOT, 'public/icon-192.png'), await makeSquareIcon(logo, 192, 0.06));
writeFileSync(join(ROOT, 'public/icon-512.png'), await makeSquareIcon(logo, 512, 0.06));
writeFileSync(join(ROOT, 'public/apple-touch-icon.png'), await makeSquareIcon(logo, 180, 0.06));
// maskable: 안전 영역(중앙 80%)용 여백
writeFileSync(join(ROOT, 'public/icon-maskable-512.png'), await makeSquareIcon(logo, 512, 0.12));

console.log('Icons generated.');

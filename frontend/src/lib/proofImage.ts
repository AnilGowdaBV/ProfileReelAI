const MAX_EDGE = 1280;
const JPEG_QUALITY = 0.72;
const MAX_INPUT_BYTES = 8 * 1024 * 1024;

export async function readProofImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Upload a screenshot image (PNG or JPG).');
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error('Screenshot is too large. Use a smaller image.');
  }

  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not read this screenshot.');
    ctx.drawImage(bitmap, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  } finally {
    bitmap.close();
  }
}

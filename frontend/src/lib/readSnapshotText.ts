export async function readSnapshotText(dataUrl: string): Promise<string> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('eng');
  try {
    const result = await worker.recognize(dataUrl);
    return result.data.text || '';
  } finally {
    await worker.terminate();
  }
}

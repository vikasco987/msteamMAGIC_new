import * as faceapi from "@vladmandic/face-api";

let modelsLoaded = false;
let loadingPromise: Promise<void> | null = null;

export async function loadFaceApiModels(): Promise<void> {
  if (modelsLoaded) return;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const MODEL_URL = "/models";
    // Load lightweight, high-performance models for browser face detection, landmarks and 128D embeddings
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    modelsLoaded = true;
  })();

  return loadingPromise;
}

/**
 * Detects face from an HTMLImageElement, HTMLVideoElement, or HTMLCanvasElement
 * and returns the 128-dimensional Float32 biometric embedding vector.
 */
export async function getFaceEmbeddingFromElement(
  element: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<{ embedding: number[]; confidence: number } | null> {
  await loadFaceApiModels();

  const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 });
  const detection = await faceapi
    .detectSingleFace(element, options)
    .withFaceLandmarks(true)
    .withFaceDescriptor();

  if (!detection) return null;

  return {
    embedding: Array.from(detection.descriptor),
    confidence: detection.detection.score,
  };
}

/**
 * Averages multiple 128-d vectors into a single robust template vector (like training on multiple face samples).
 */
export function computeAverageEmbedding(embeddings: number[][]): number[] {
  if (embeddings.length === 0) throw new Error("No embeddings to average");
  const len = embeddings[0].length;
  const avg = new Array(len).fill(0);

  for (const emb of embeddings) {
    for (let i = 0; i < len; i++) {
      avg[i] += emb[i];
    }
  }

  // Calculate mean
  for (let i = 0; i < len; i++) {
    avg[i] /= embeddings.length;
  }

  // Normalize L2
  let sumSq = 0;
  for (let i = 0; i < len; i++) {
    sumSq += avg[i] * avg[i];
  }
  const norm = Math.sqrt(sumSq);
  if (norm === 0) return avg;
  return avg.map(v => v / norm);
}

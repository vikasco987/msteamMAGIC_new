export const DEFAULT_FACE_MATCH_THRESHOLD = 0.48; // Euclidean distance threshold
export const VECTOR_DIMENSION = 128; // FaceNet / standard embedding length

/**
 * Calculates Euclidean distance between two 128-d vectors.
 * Lower value means more similar (0 = exact match).
 */
export function calculateEuclideanDistance(v1: number[], v2: number[]): number {
  if (!v1 || !v2 || v1.length !== v2.length) {
    throw new Error("Invalid vector dimensions for distance calculation");
  }

  let sum = 0;
  for (let i = 0; i < v1.length; i++) {
    const diff = v1[i] - v2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/**
 * Validates that an embedding array is finite, non-null, and exactly the expected length.
 */
export function isValidEmbedding(vector: unknown): vector is number[] {
  if (!Array.isArray(vector)) return false;
  if (vector.length !== VECTOR_DIMENSION) return false;

  for (let i = 0; i < vector.length; i++) {
    const val = vector[i];
    if (typeof val !== "number" || !Number.isFinite(val) || Number.isNaN(val)) {
      return false;
    }
  }

  return true;
}

/**
 * Normalizes a vector to unit length (L2 norm).
 */
export function normalizeL2(vector: number[]): number[] {
  let sumSq = 0;
  for (let i = 0; i < vector.length; i++) {
    sumSq += vector[i] * vector[i];
  }
  const norm = Math.sqrt(sumSq);
  if (norm === 0) return vector;
  return vector.map((v) => v / norm);
}

/**
 * Parses and validates an image data URL or base64 payload.
 * Enforces size limits and signature check.
 */
export function validateImagePayload(base64Data: string, maxBytes = 500 * 1024): { buffer: Buffer; mimeType: string } {
  if (!base64Data || typeof base64Data !== "string") {
    throw new Error("Missing image payload");
  }

  let cleanBase64 = base64Data;
  let mimeType = "image/jpeg";

  if (base64Data.startsWith("data:")) {
    const parts = base64Data.split(",");
    if (parts.length !== 2) throw new Error("Invalid data URL format");
    const mimeMatch = parts[0].match(/:(.*?);/);
    if (mimeMatch) mimeType = mimeMatch[1];
    cleanBase64 = parts[1];
  }

  const buffer = Buffer.from(cleanBase64, "base64");

  if (buffer.length === 0) {
    throw new Error("Empty image data");
  }

  if (buffer.length > maxBytes) {
    throw new Error(`Image size exceeds maximum limit of ${maxBytes / 1024}KB`);
  }

  // Validate magic bytes (JPEG or PNG)
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  const isWebp = buffer.slice(0, 4).toString() === "RIFF" && buffer.slice(8, 12).toString() === "WEBP";

  if (!isJpeg && !isPng && !isWebp) {
    throw new Error("Unsupported image format. Only JPEG, PNG, and WebP are allowed.");
  }

  return { buffer, mimeType };
}

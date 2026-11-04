import { calculateEuclideanDistance, isValidEmbedding, normalizeL2, validateImagePayload } from "../src/lib/biometrics/vectors";
import { generateChallenge, validateAndConsumeChallenge } from "../src/lib/biometrics/challenges";

async function runTests() {
  console.log("🚀 Starting Biometric Security & Logic Unit Tests...\n");
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      process.exitCode = 1;
    }
  }

  // 1. Vector Dimension & Finite Checks
  const validVector = new Array(128).fill(0.05);
  assert(isValidEmbedding(validVector), "128-d finite vector is valid");

  const invalidLength = new Array(64).fill(0.1);
  assert(!isValidEmbedding(invalidLength), "64-d vector correctly rejected");

  const hasNaN = [...validVector];
  hasNaN[5] = NaN;
  assert(!isValidEmbedding(hasNaN), "Vector with NaN correctly rejected");

  const hasInfinity = [...validVector];
  hasInfinity[10] = Infinity;
  assert(!isValidEmbedding(hasInfinity), "Vector with Infinity correctly rejected");

  // 2. Vector Normalization & Euclidean Distance
  const v1 = new Array(128).fill(0.1);
  const v2 = new Array(128).fill(0.1);
  const sameDist = calculateEuclideanDistance(v1, v2);
  assert(sameDist === 0, "Identical vectors yield 0 distance");

  const v3 = new Array(128).fill(0.5);
  const diffDist = calculateEuclideanDistance(v1, v3);
  assert(diffDist > 0, "Different vectors yield positive distance");

  const norm = normalizeL2(v3);
  let normSum = 0;
  for (const n of norm) normSum += n * n;
  assert(Math.abs(Math.sqrt(normSum) - 1.0) < 1e-6, "Vector normalized to unit length");

  // 3. Challenge Generation, Consumption & Anti-Replay
  const { challengeId } = generateChallenge("user_123", "verify");
  assert(typeof challengeId === "string" && challengeId.length > 10, "Cryptographic challenge generated");

  // First consumption: Should SUCCEED
  const firstConsume = validateAndConsumeChallenge(challengeId, "user_123", "verify");
  assert(firstConsume.valid === true, "Challenge consumed successfully on first attempt");

  // Second consumption (Replay Attack): Must FAIL
  const replayAttempt = validateAndConsumeChallenge(challengeId, "user_123", "verify");
  assert(replayAttempt.valid === false, "Replayed challenge rejected atomically");

  // Mismatched user check
  const { challengeId: challenge2 } = generateChallenge("user_456", "verify");
  const wrongUserAttempt = validateAndConsumeChallenge(challenge2, "user_999", "verify");
  assert(wrongUserAttempt.valid === false, "Challenge bound to different user rejected");

  // 4. Image Payload Security & Signature Validation
  try {
    validateImagePayload("not-base-64", 500 * 1024);
    assert(false, "Invalid image payload threw error");
  } catch {
    assert(true, "Malformed image data rejected");
  }

  // Oversized payload check
  const fakeLargeBuffer = Buffer.alloc(600 * 1024);
  const fakeLargeBase64 = `data:image/jpeg;base64,${fakeLargeBuffer.toString("base64")}`;
  try {
    validateImagePayload(fakeLargeBase64, 500 * 1024);
    assert(false, "Oversized image rejected");
  } catch (err: any) {
    assert(err.message.includes("exceeds maximum limit"), "Image size exceeding 500KB rejected");
  }

  console.log(`\n🎉 Test Suite Completed: ${passed}/${total} passed.\n`);
}

runTests().catch(console.error);

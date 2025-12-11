/**
 * Placeholder helper for Gemini calls.
 * In production, replace this with a call to a secure backend or serverless function
 * that injects GEMINI_API_KEY and proxies the request. Keep this interface stable
 * so the UI does not need to change.
 *
 * Example swap-in approach:
 * - Deploy a serverless function that accepts { modelName, prompt }
 * - Store GEMINI_API_KEY securely in that environment
 * - Update this helper to POST to that function and return its JSON
 */
export async function callGemini(modelName, prompt) {
  console.warn("callGemini is currently a mock and must be wired to a backend.");
  // Mocked, lightweight summary based on prompt length for demo purposes
  const text = `Mock summary for ${modelName}: ${prompt.slice(0, 60)}...`;
  return { text };
}

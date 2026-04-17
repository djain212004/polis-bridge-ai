const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

export interface GeminiConfig {
  temperature?: number;
  topK?: number;
  topP?: number;
  responseMimeType?: string;
}

interface GeminiCandidate {
  content?: {
    parts?: Array<{ text?: string; data?: string }>;
  };
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
}

const defaultConfig: Required<GeminiConfig> = {
  temperature: 0.35,
  topK: 32,
  topP: 0.95,
  responseMimeType: "text/plain",
};

const BACKUP_GEMINI_KEYS = [
  "AIzaSyB2_O0_NXKMLm80tkRQSBzkvxsVddaQmNU",
  "AIzaSyAf60DZjKMls70Rt1G8gJT2WJxmvK2lmH8",
  "AIzaSyCCJJd3LFuIQsT0RvN5AlgrwsC-q_eBd-k",
];

export async function generateGeminiContent(prompt: string, config?: GeminiConfig): Promise<string> {
  const primaryKey = import.meta.env.VITE_GEMINI_API_KEY;
  const keysToTry = primaryKey ? [primaryKey, ...BACKUP_GEMINI_KEYS.filter(k => k !== primaryKey)] : [...BACKUP_GEMINI_KEYS];

  if (keysToTry.length === 0) {
    throw new Error("Missing VITE_GEMINI_API_KEY and no backup keys available");
  }

  const merged = { ...defaultConfig, ...config };
  let lastError = "";

  for (const apiKey of keysToTry) {
    try {
      const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: merged,
        }),
      });

      if (!response.ok) {
        lastError = await response.text();
        console.warn(`Gemini key failed (${response.status}), trying next key...`);
        continue;
      }

      const data = (await response.json()) as GeminiResponse;
      const text =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ??
        data?.candidates?.[0]?.content?.parts?.[0]?.data;

      if (!text) {
        throw new Error("Gemini returned no content.");
      }

      return text;
    } catch (error) {
      if (error instanceof Error && error.message === "Gemini returned no content.") {
        throw error;
      }
      lastError = error instanceof Error ? error.message : String(error);
      console.warn(`Gemini key failed: ${lastError}, trying next key...`);
      continue;
    }
  }

  throw new Error(`All Gemini API keys failed. Last error: ${lastError}`);
}

export async function generateGeminiJson<T>(prompt: string, config?: GeminiConfig): Promise<T> {
  const text = await generateGeminiContent(prompt, { ...config, responseMimeType: "application/json" });
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new Error("Gemini returned invalid JSON.");
  }
}

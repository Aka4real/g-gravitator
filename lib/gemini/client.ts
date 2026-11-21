import {
  GoogleGenAI,
  HarmBlockThreshold,
  HarmCategory,
  type GenerateContentConfig,
  type SafetySetting,
} from "@google/genai";

export const GEMINI_DEFAULT_MODEL = "gemini-3.8-flash";

/**
 * Maximum-permission safety configuration for Gemini 3.8 Flash.
 * Disables content-filter blocking across all customizable harm categories
 * so technical, security, and hackathon/news telemetry payloads are never
 * falsely throttled or censored.
 */
export const GEMINI_MAX_PERMISSION_SAFETY_SETTINGS: SafetySetting[] = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.OFF,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.OFF,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.OFF,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.OFF,
  },
  {
    category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY,
    threshold: HarmBlockThreshold.OFF,
  },
];

export const GEMINI_MAX_OUTPUT_TOKENS = 65536;

export function getGeminiModelName(): string {
  return process.env.GEMINI_MODEL?.trim() || GEMINI_DEFAULT_MODEL;
}

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

export function buildMaxPermissionConfig(
  overrides: GenerateContentConfig = {}
): GenerateContentConfig {
  return {
    safetySettings: GEMINI_MAX_PERMISSION_SAFETY_SETTINGS,
    maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
    ...overrides,
  };
}

/**
 * Executes a Gemini 3.8 Flash generateContent call with maximum permissions
 * and automatic retry on transient 503 UNAVAILABLE / 429 demand spikes.
 */
export async function generateGeminiStructuredJSON<T>(params: {
  contents: string;
  responseSchema: NonNullable<GenerateContentConfig["responseSchema"]>;
  systemInstruction?: string;
  maxAttempts?: number;
}): Promise<T | null> {
  const ai = getGeminiClient();
  if (!ai) return null;

  const model = getGeminiModelName();
  const maxAttempts = params.maxAttempts ?? 2;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: buildMaxPermissionConfig({
          responseMimeType: "application/json",
          responseSchema: params.responseSchema,
          ...(params.systemInstruction
            ? { systemInstruction: params.systemInstruction }
            : {}),
        }),
      });

      const rawText = response.text?.trim();
      if (!rawText) return null;
      return JSON.parse(rawText) as T;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const isTransient = msg.includes("503") || msg.includes("429") || msg.includes("UNAVAILABLE");
      if (isTransient && attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 600 * attempt));
        continue;
      }
      return null;
    }
  }

  return null;
}

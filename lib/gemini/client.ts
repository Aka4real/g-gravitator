import {
  GoogleGenAI,
  HarmBlockThreshold,
  HarmCategory,
  type GenerateContentConfig,
  type SafetySetting,
} from "@google/genai";

export const GEMINI_DEFAULT_MODEL = "gemini-3.8-flash";

export const GEMINI_FALLBACK_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
] as const;

export const GEMINI_IMAGE_MODELS = [
  "gemini-3.1-flash-image",
  "gemini-3.1-flash-lite-image",
  "gemini-2.5-flash-image",
] as const;

export const GEMINI_TTS_MODELS = [
  "gemini-3.8-flash-tts",
  "gemini-3.8-flash-lite-tts",
  "gemini-2.5-flash-preview-tts",
] as const;

export const GEMINI_TRANSCRIBE_MODELS = [
  "gemini-3.5-transcribe",
  "gemini-3.8-flash",
  "gemini-3.5-flash",
] as const;

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

export function getGeminiBetaClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: { apiVersion: "v1beta" },
  });
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

export function isTransientGeminiError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes("503") ||
    msg.includes("429") ||
    msg.includes("UNAVAILABLE") ||
    msg.includes("RESOURCE_EXHAUSTED")
  );
}

export function getOrderedGeminiModels(): string[] {
  const primary = getGeminiModelName();
  return [
    primary,
    ...GEMINI_FALLBACK_MODELS.filter((m) => m !== primary),
  ];
}

/**
 * Executes a Gemini 3.8 Flash generateContent call with maximum permissions,
 * transient 503/429 retry, and automatic fallback across Gemini 3.x Flash models.
 */
export async function generateGeminiStructuredJSON<T>(params: {
  contents: string;
  responseSchema: NonNullable<GenerateContentConfig["responseSchema"]>;
  systemInstruction?: string;
  maxAttempts?: number;
}): Promise<T | null> {
  const ai = getGeminiClient();
  if (!ai) return null;

  const models = getOrderedGeminiModels();
  const maxAttempts = params.maxAttempts ?? 2;

  for (const model of models.slice(0, 3)) {
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
        console.warn(`[gemini:structured] ${model} attempt ${attempt} failed: ${msg.slice(0, 180)}`);
        if (isTransientGeminiError(error)) {
          if (attempt < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 450 * attempt));
            continue;
          }
          break; // try next fallback model
        }
        return null;
      }
    }
  }

  return null;
}

/**
 * Generates an image using Gemini Image models on v1beta.
 * Returns null if quota (429) or availability prevents generation so callers can fall back cleanly.
 */
export async function generateGeminiImage(params: {
  prompt: string;
}): Promise<{ mimeType: string; base64: string; model: string } | null> {
  const ai = getGeminiBetaClient();
  if (!ai) return null;

  for (const model of GEMINI_IMAGE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.prompt,
        config: {
          responseModalities: ["IMAGE"],
          safetySettings: GEMINI_MAX_PERMISSION_SAFETY_SETTINGS,
        },
      });
      const parts = response.candidates?.[0]?.content?.parts ?? [];
      const imgPart = parts.find((p) => p.inlineData?.data);
      if (imgPart?.inlineData?.data) {
        return {
          mimeType: imgPart.inlineData.mimeType || "image/png",
          base64: imgPart.inlineData.data,
          model,
        };
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn(`[gemini:image] ${model} failed: ${msg.slice(0, 180)}`);
    }
  }

  return null;
}

/**
 * Synthesizes natural human speech (WAV audio) using Gemini 3.8 Flash TTS on v1beta.
 */
export async function synthesizeGeminiSpeech(
  text: string,
  voiceName = "Kore"
): Promise<{ mimeType: string; base64: string; model: string } | null> {
  const ai = getGeminiBetaClient();
  if (!ai) return null;

  const trimmed = text.trim().slice(0, 2400);
  if (!trimmed) return null;

  for (const model of GEMINI_TTS_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: trimmed,
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });
      const parts = response.candidates?.[0]?.content?.parts ?? [];
      const audioPart = parts.find((p) => p.inlineData?.data);
      if (audioPart?.inlineData?.data) {
        return {
          mimeType: audioPart.inlineData.mimeType || "audio/wav",
          base64: audioPart.inlineData.data,
          model,
        };
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn(`[gemini:tts] ${model} failed: ${msg.slice(0, 180)}`);
    }
  }

  return null;
}

/**
 * Transcribes spoken audio into clean text using Gemini audio transcription models.
 */
export async function transcribeGeminiAudio(
  base64Audio: string,
  mimeType: string
): Promise<string | null> {
  const ai = getGeminiBetaClient();
  if (!ai) return null;

  for (const model of GEMINI_TRANSCRIBE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  data: base64Audio,
                  mimeType: mimeType || "audio/webm",
                },
              },
              {
                text: "Transcribe the spoken command accurately into clean English text. Output only the transcription without extra commentary.",
              },
            ],
          },
        ],
        config: {
          safetySettings: GEMINI_MAX_PERMISSION_SAFETY_SETTINGS,
        },
      });
      const text = response.text?.trim();
      if (text) return text;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn(`[gemini:transcribe] ${model} failed: ${msg.slice(0, 180)}`);
    }
  }

  return null;
}

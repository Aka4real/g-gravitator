import {
  AudioTranscriptionConfigMode,
  GoogleGenAI,
  HarmBlockThreshold,
  HarmCategory,
  ThinkingLevel,
  type GenerateContentConfig,
  type SafetySetting,
  type ThinkingConfig,
} from "@google/genai";

export const GEMINI_DEFAULT_MODEL = "gemini-3.8-flash";

export const GEMINI_FALLBACK_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash-lite",
  "gemini-2.5-flash",
] as const;

export const GEMINI_IMAGE_MODELS = [
  "gemini-nano-banana-2.1",
  "gemini-3.1-flash-image",
  "gemini-3.1-flash-lite-image",
  "gemini-2.5-flash-image",
] as const;

/**
 * Gemini 3.8 Flash-Lite TTS is prioritized first for low-latency conversational
 * voice agent cascades, falling back to Studio Gemini 3.8 Flash TTS and 2.5 preview.
 */
export const GEMINI_TTS_MODELS = [
  "gemini-3.8-flash-lite-tts",
  "gemini-3.8-flash-tts",
  "gemini-2.5-flash-preview-tts",
] as const;

export const GEMINI_TRANSCRIBE_MODELS = [
  "gemini-3.5-transcribe",
  "gemini-3.8-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash-lite",
] as const;

export const DOMAIN_CUSTOM_VOCABULARY = [
  "G-Gravitator",
  "OXAKALABS",
  "Orbital Wire",
  "Skunkworks",
  "Gravity Deck",
  "OpsPilot",
  "Kinetic Studio",
  "OrbitBench",
  "Devpost",
  "DoraHacks",
  "Lablab",
  "ETHGlobal",
  "Devfolio",
  "MCP",
];

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

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

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

/**
 * Returns a model-compatible ThinkingConfig.
 * Gemini 3.x / 4.x models use `thinkingLevel` ("LOW" | "MEDIUM" | "HIGH";
 * note that "MINIMAL" is rejected on Gemini 3.8 Flash).
 * Gemini 2.5 models use `thinkingBudget` instead and omit `thinkingLevel`.
 */
export function buildThinkingConfigForModel(
  model: string,
  level: "low" | "medium" | "high" = "low"
): ThinkingConfig | undefined {
  const normalized = model.toLowerCase();
  if (normalized.includes("tts") || normalized.includes("transcribe") || normalized.includes("image")) {
    return undefined;
  }
  if (normalized.startsWith("gemini-3") || normalized.startsWith("gemini-4")) {
    const mapped =
      level === "high"
        ? ThinkingLevel.HIGH
        : level === "medium"
        ? ThinkingLevel.MEDIUM
        : ThinkingLevel.LOW;
    return { thinkingLevel: mapped };
  }
  return undefined;
}

export function isTransientGeminiError(error: unknown): boolean {
  const msg = (error instanceof Error ? error.message : String(error)).toUpperCase();
  return (
    msg.includes("503") ||
    msg.includes("429") ||
    msg.includes("500") ||
    msg.includes("504") ||
    msg.includes("UNAVAILABLE") ||
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.includes("INTERNAL") ||
    msg.includes("DEADLINE_EXCEEDED") ||
    msg.includes("TIMEOUT") ||
    msg.includes("ABORT") ||
    msg.includes("FETCH FAILED") ||
    msg.includes("ECONNRESET")
  );
}

export function isAuthGeminiError(error: unknown): boolean {
  const msg = (error instanceof Error ? error.message : String(error)).toUpperCase();
  return (
    msg.includes("API_KEY_INVALID") ||
    msg.includes("API KEY NOT VALID") ||
    msg.includes("INVALID API KEY") ||
    msg.includes("401")
  );
}

export function isModelFallbackableError(error: unknown): boolean {
  if (isAuthGeminiError(error)) return false;
  if (isTransientGeminiError(error)) return true;
  const msg = (error instanceof Error ? error.message : String(error)).toUpperCase();
  return (
    msg.includes("404") ||
    msg.includes("NOT_FOUND") ||
    msg.includes("NOT FOUND") ||
    msg.includes("UNSUPPORTED") ||
    msg.includes("NOT ENABLED FOR THIS MODEL") ||
    msg.includes("DEPRECATED") ||
    msg.includes("OVERLOADED") ||
    msg.includes("PERMISSION_DENIED")
  );
}

export function getOrderedGeminiModels(): string[] {
  const primary = getGeminiModelName();
  const ordered = [
    primary,
    ...GEMINI_FALLBACK_MODELS.filter((m) => m !== primary),
  ];
  return Array.from(new Set(ordered));
}

/**
 * Strips codec parameters (e.g. "audio/webm;codecs=opus" -> "audio/webm")
 * because Gemini inlineData rejects MIME strings containing codec suffixes.
 */
export function normalizeAudioMimeType(rawMime?: string): string {
  const base = (rawMime || "audio/webm").split(";")[0].trim().toLowerCase();
  if (!base) return "audio/webm";
  if (base === "video/webm") return "audio/webm";
  if (base === "video/mp4" || base === "audio/x-m4a") return "audio/mp4";
  if (base === "audio/wave" || base === "audio/x-wav") return "audio/wav";
  if (base.startsWith("audio/")) return base;
  return "audio/webm";
}

function parsePcmSampleRate(mimeType?: string): number {
  const match = (mimeType || "").match(/rate=(\d+)/i);
  const parsed = match ? Number.parseInt(match[1], 10) : 24000;
  return Number.isFinite(parsed) && parsed >= 8000 && parsed <= 96000
    ? parsed
    : 24000;
}

/**
 * Wraps headerless 16-bit little-endian linear PCM bytes into a standard RIFF WAV container.
 */
export function wrapPcmAsWav(
  pcmBuffer: Buffer,
  sampleRate = 24000,
  numChannels = 1,
  bitsPerSample = 16
): Buffer {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const header = Buffer.alloc(44);

  header.write("RIFF", 0, "ascii");
  header.writeUInt32LE(36 + pcmBuffer.length, 4);
  header.write("WAVE", 8, "ascii");
  header.write("fmt ", 12, "ascii");
  header.writeUInt32LE(16, 16); // Subchunk1Size (PCM)
  header.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36, "ascii");
  header.writeUInt32LE(pcmBuffer.length, 40);

  return Buffer.concat([header, pcmBuffer]);
}

function hasStandardAudioContainerHeader(buf: Buffer): boolean {
  if (buf.length < 12) return false;
  const ascii4 = buf.subarray(0, 4).toString("ascii");
  // RIFF..WAVE
  if (ascii4 === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WAVE") {
    return true;
  }
  // Ogg / FLAC / MP3 (ID3 or MPEG frame sync) / MP4 (ftyp)
  if (ascii4 === "OggS" || ascii4 === "fLaC" || ascii4.startsWith("ID3")) {
    return true;
  }
  if (buf.subarray(4, 8).toString("ascii") === "ftyp") {
    return true;
  }
  if (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0) {
    return true;
  }
  return false;
}

/**
 * Ensures any Gemini TTS audio payload is browser-playable.
 * Gemini 3.8 TTS unary calls already include a RIFF WAV header, whereas
 * Gemini 2.5 preview TTS and streaming chunks return headerless raw L16 PCM.
 */
export function ensureWavAudioBuffer(
  audioBuffers: Buffer[],
  mimeType?: string
): { buffer: Buffer; mimeType: string } {
  const nonEmpty = audioBuffers.filter((b) => b.length > 0);
  if (nonEmpty.length === 0) {
    return { buffer: Buffer.alloc(0), mimeType: "audio/wav" };
  }

  const lowerMime = (mimeType || "").toLowerCase();
  const isRawPcmMime =
    lowerMime.includes("audio/l16") || lowerMime.includes("audio/pcm");

  // Single buffer that already has a valid WAV/MP3/OGG/MP4 container header
  if (nonEmpty.length === 1 && !isRawPcmMime && hasStandardAudioContainerHeader(nonEmpty[0])) {
    const cleanMime = lowerMime.split(";")[0].trim() || "audio/wav";
    return { buffer: nonEmpty[0], mimeType: cleanMime };
  }

  // If multiple WAV buffers were returned across parts, strip 44-byte RIFF headers and re-wrap cleanly
  const sampleRate = parsePcmSampleRate(mimeType);
  const pcmChunks = nonEmpty.map((buf) => {
    if (
      buf.length > 44 &&
      buf.subarray(0, 4).toString("ascii") === "RIFF" &&
      buf.subarray(8, 12).toString("ascii") === "WAVE"
    ) {
      return buf.subarray(44);
    }
    return buf;
  });

  const combinedPcm = Buffer.concat(pcmChunks);
  return {
    buffer: wrapPcmAsWav(combinedPcm, sampleRate, 1, 16),
    mimeType: "audio/wav",
  };
}

function stripJsonCodeFences(raw: string): string {
  const trimmed = raw.trim();
  const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return match ? match[1].trim() : trimmed;
}

/**
 * Executes a Gemini 3.8 Flash generateContent call with maximum permissions,
 * low-latency thinking level for structured extraction, transient retry,
 * and automatic fallback across Gemini Flash models.
 */
export async function generateGeminiStructuredJSON<T>(params: {
  contents: string;
  responseSchema: NonNullable<GenerateContentConfig["responseSchema"]>;
  systemInstruction?: string;
  maxAttempts?: number;
  thinkingLevel?: "low" | "medium" | "high";
  timeoutMs?: number;
}): Promise<T | null> {
  const ai = getGeminiClient();
  if (!ai) return null;

  const models = getOrderedGeminiModels();
  const maxAttempts = params.maxAttempts ?? 2;
  const thinkingLevel = params.thinkingLevel ?? "low";
  const timeoutMs = params.timeoutMs ?? 25_000;

  for (const model of models) {
    const thinkingConfig = buildThinkingConfigForModel(model, thinkingLevel);
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: buildMaxPermissionConfig({
            abortSignal: AbortSignal.timeout(timeoutMs),
            responseMimeType: "application/json",
            responseSchema: params.responseSchema,
            ...(thinkingConfig ? { thinkingConfig } : {}),
            ...(params.systemInstruction
              ? { systemInstruction: params.systemInstruction }
              : {}),
          }),
        });

        const rawText = response.text?.trim();
        if (!rawText) continue;
        return JSON.parse(stripJsonCodeFences(rawText)) as T;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.warn(`[gemini:structured] ${model} attempt ${attempt} failed: ${msg.slice(0, 180)}`);
        if (isAuthGeminiError(error)) {
          return null;
        }
        if (isTransientGeminiError(error) && attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 450 * attempt));
          continue;
        }
        if (isModelFallbackableError(error)) {
          break; // try next fallback model
        }
        break;
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
  aspectRatio?: "1:1" | "16:9" | "4:3" | "3:2";
}): Promise<{ mimeType: string; base64: string; model: string } | null> {
  const ai = getGeminiBetaClient();
  if (!ai) return null;

  for (const model of GEMINI_IMAGE_MODELS) {
    try {
      const isGemini3Image = model.includes("3") || model.includes("nano-banana");
      const response = await ai.models.generateContent({
        model,
        contents: params.prompt,
        config: {
          abortSignal: AbortSignal.timeout(28_000),
          responseModalities: ["IMAGE"],
          safetySettings: GEMINI_MAX_PERMISSION_SAFETY_SETTINGS,
          ...(isGemini3Image && params.aspectRatio
            ? { imageConfig: { aspectRatio: params.aspectRatio } }
            : {}),
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
      if (isAuthGeminiError(error)) return null;
    }
  }

  return null;
}

/**
 * Synthesizes natural human speech (browser-playable WAV audio) using
 * Gemini 3.8 Flash-Lite TTS / Gemini 3.8 Flash TTS on v1beta, with automatic
 * RIFF WAV header wrapping if any fallback model returns headerless L16 PCM.
 */
export async function synthesizeGeminiSpeech(
  text: string,
  voiceName = "Kore",
  options?: { style?: string }
): Promise<{
  mimeType: string;
  base64: string;
  model: string;
} | null> {
  const result = await synthesizeGeminiSpeechDetailed(text, voiceName, options);
  return result.audio;
}

export async function synthesizeGeminiSpeechDetailed(
  text: string,
  voiceName = "Kore",
  options?: { style?: string }
): Promise<{
  audio: { mimeType: string; base64: string; model: string } | null;
  error?: string;
}> {
  const ai = getGeminiBetaClient();
  if (!ai) {
    return { audio: null, error: "GEMINI_API_KEY is not configured on the server." };
  }

  const trimmed = text.trim().slice(0, 1800);
  if (!trimmed) {
    return { audio: null, error: "Speech text was empty." };
  }

  const style =
    options?.style?.trim() ||
    "clear, natural, warm executive operator with crisp conversational pacing";
  let lastError = "TTS synthesis unavailable.";

  for (const model of GEMINI_TTS_MODELS) {
    try {
      const isGemini38Tts = model.startsWith("gemini-3.8");
      const contents = isGemini38Tts
        ? [
            {
              role: "user" as const,
              parts: [
                {
                  text: trimmed,
                  speechMetadata: { style },
                },
              ],
            },
          ]
        : trimmed;

      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          abortSignal: AbortSignal.timeout(24_000),
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

      const parts = response.candidates?.[0]?.content?.parts ?? [];
      const audioParts = parts.filter((p) => p.inlineData?.data);
      if (audioParts.length > 0) {
        const rawMime = audioParts[0].inlineData?.mimeType || "audio/wav";
        const buffers = audioParts.map((p) =>
          Buffer.from(p.inlineData!.data!, "base64")
        );
        const normalized = ensureWavAudioBuffer(buffers, rawMime);
        if (normalized.buffer.length > 44) {
          return {
            audio: {
              mimeType: normalized.mimeType,
              base64: normalized.buffer.toString("base64"),
              model,
            },
          };
        }
      }
      lastError = `${model} returned no audio payload.`;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      lastError = `${model}: ${msg.slice(0, 180)}`;
      console.warn(`[gemini:tts] ${lastError}`);
      if (isAuthGeminiError(error)) {
        return { audio: null, error: "Invalid GEMINI_API_KEY." };
      }
    }
  }

  return { audio: null, error: lastError };
}

/**
 * Transcribes spoken audio into clean text using Gemini 3.5 Transcribe (SMART mode)
 * with automatic MIME normalization and Gemini Flash multimodal fallback.
 */
export async function transcribeGeminiAudio(
  base64Audio: string,
  mimeType: string
): Promise<string | null> {
  const result = await transcribeGeminiAudioDetailed(base64Audio, mimeType);
  return result.transcript;
}

export async function transcribeGeminiAudioDetailed(
  base64Audio: string,
  mimeType: string
): Promise<{
  transcript: string | null;
  model?: string;
  error?: string;
}> {
  const ai = getGeminiBetaClient();
  if (!ai) {
    return {
      transcript: null,
      error: "GEMINI_API_KEY is not configured on the server.",
    };
  }

  const cleanBase64 = base64Audio.includes(",")
    ? base64Audio.split(",").pop() || ""
    : base64Audio.trim();
  if (!cleanBase64) {
    return { transcript: null, error: "Empty audio recording." };
  }

  const normalizedMime = normalizeAudioMimeType(mimeType);
  let lastError = "Could not transcribe audio clip.";

  for (const model of GEMINI_TRANSCRIBE_MODELS) {
    try {
      const isDedicatedTranscribe = model.includes("transcribe");
      const thinkingConfig = buildThinkingConfigForModel(model, "low");

      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts: isDedicatedTranscribe
              ? [
                  {
                    inlineData: {
                      data: cleanBase64,
                      mimeType: normalizedMime,
                    },
                  },
                ]
              : [
                  {
                    inlineData: {
                      data: cleanBase64,
                      mimeType: normalizedMime,
                    },
                  },
                  {
                    text: "Transcribe the spoken command accurately into clean text. Preserve technical terms like G-Gravitator, OXAKALABS, Orbital Wire, Devpost, and MCP. Output only the spoken transcript without quotes or commentary.",
                  },
                ],
          },
        ],
        config: isDedicatedTranscribe
          ? {
              abortSignal: AbortSignal.timeout(24_000),
              audioTranscriptionConfig: {
                mode: AudioTranscriptionConfigMode.SMART,
                customVocabulary: DOMAIN_CUSTOM_VOCABULARY,
              },
            }
          : {
              abortSignal: AbortSignal.timeout(24_000),
              safetySettings: GEMINI_MAX_PERMISSION_SAFETY_SETTINGS,
              ...(thinkingConfig ? { thinkingConfig } : {}),
            },
      });

      const text = response.text?.trim();
      if (text) {
        return { transcript: text, model };
      }
      lastError = `${model} returned an empty transcription.`;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      lastError = `${model}: ${msg.slice(0, 180)}`;
      console.warn(`[gemini:transcribe] ${lastError}`);
      if (isAuthGeminiError(error)) {
        return { transcript: null, error: "Invalid GEMINI_API_KEY." };
      }
    }
  }

  return { transcript: null, error: lastError };
}

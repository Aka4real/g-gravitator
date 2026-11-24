import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth/admin-auth";
import {
  isGeminiConfigured,
  synthesizeGeminiSpeechDetailed,
  transcribeGeminiAudioDetailed,
} from "@/lib/gemini/client";

export const maxDuration = 60;

const MAX_AUDIO_BASE64_CHARS = 10 * 1024 * 1024; // ~7.5 MB binary audio

const ALLOWED_VOICES = new Set([
  "Kore",
  "Aoede",
  "Puck",
  "Charon",
  "Fenrir",
  "Leda",
  "Orus",
  "Zephyr",
]);

export async function POST(request: Request) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      action?: "speak" | "transcribe";
      text?: string;
      voiceName?: string;
      style?: string;
      audioBase64?: string;
      mimeType?: string;
    };

    if (body.action === "transcribe") {
      if (!body.audioBase64 || typeof body.audioBase64 !== "string") {
        return NextResponse.json(
          { error: "audioBase64 is required for transcription." },
          { status: 400 }
        );
      }
      if (body.audioBase64.length > MAX_AUDIO_BASE64_CHARS) {
        return NextResponse.json(
          { error: "Voice clip is too large (max ~7 MB). Keep voice commands concise." },
          { status: 413 }
        );
      }
      if (!isGeminiConfigured()) {
        return NextResponse.json(
          {
            error:
              "GEMINI_API_KEY is not configured on the server. Switch to Live Browser Dictation or add GEMINI_API_KEY.",
          },
          { status: 503 }
        );
      }

      const result = await transcribeGeminiAudioDetailed(
        body.audioBase64,
        body.mimeType || "audio/webm"
      );
      if (!result.transcript) {
        return NextResponse.json(
          {
            error: result.error || "Could not transcribe audio clip.",
          },
          { status: 422 }
        );
      }
      return NextResponse.json({
        ok: true,
        transcript: result.transcript,
        model: result.model,
      });
    }

    // Default: speak
    const text = (body.text || "").trim();
    if (!text) {
      return NextResponse.json(
        { error: "text is required for speech synthesis." },
        { status: 400 }
      );
    }

    const voiceName = ALLOWED_VOICES.has(body.voiceName || "")
      ? body.voiceName!
      : "Kore";

    const { audio, error } = await synthesizeGeminiSpeechDetailed(
      text,
      voiceName,
      { style: body.style }
    );
    if (!audio) {
      return NextResponse.json({
        ok: false,
        fallbackToBrowserSpeech: true,
        reason: error || "Gemini TTS unavailable; using browser speech synthesis.",
      });
    }

    return NextResponse.json({
      ok: true,
      audioBase64: audio.base64,
      mimeType: audio.mimeType,
      model: audio.model,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Voice service error" },
      { status: 500 }
    );
  }
}

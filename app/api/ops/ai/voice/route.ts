import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth/admin-auth";
import {
  synthesizeGeminiSpeech,
  transcribeGeminiAudio,
} from "@/lib/gemini/client";

export const maxDuration = 60;

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
      audioBase64?: string;
      mimeType?: string;
    };

    if (body.action === "transcribe") {
      if (!body.audioBase64) {
        return NextResponse.json(
          { error: "audioBase64 is required for transcription." },
          { status: 400 }
        );
      }
      const transcript = await transcribeGeminiAudio(
        body.audioBase64,
        body.mimeType || "audio/webm"
      );
      if (!transcript) {
        return NextResponse.json(
          { error: "Could not transcribe audio clip." },
          { status: 422 }
        );
      }
      return NextResponse.json({ ok: true, transcript });
    }

    // Default: speak
    const text = (body.text || "").trim();
    if (!text) {
      return NextResponse.json(
        { error: "text is required for speech synthesis." },
        { status: 400 }
      );
    }

    const allowedVoices = new Set(["Kore", "Aoede", "Puck", "Charon", "Fenrir"]);
    const voiceName = allowedVoices.has(body.voiceName || "")
      ? body.voiceName!
      : "Kore";

    const audio = await synthesizeGeminiSpeech(text, voiceName);
    if (!audio) {
      return NextResponse.json({
        ok: false,
        fallbackToBrowserSpeech: true,
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

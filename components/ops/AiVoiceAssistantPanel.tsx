"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Bot,
  Loader2,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  CheckCircle2,
  AlertCircle,
  Play,
  Square,
} from "lucide-react";
import type { ExecutedToolTrace } from "@/lib/ops/ai-agent";

interface ChatEntry {
  id: string;
  role: "user" | "assistant";
  content: string;
  voiceSummary?: string;
  toolCalls?: ExecutedToolTrace[];
  modelUsed?: string;
}

interface AiVoiceAssistantPanelProps {
  open: boolean;
  onClose: () => void;
  onMutated: () => Promise<void> | void;
  initialPrompt?: string;
}

const QUICK_COMMANDS = [
  "Check pending reviews and summarize what needs approval",
  "Research the latest AI multi-agent frameworks, generate a cover image, and design a rich Journal Dispatch",
  "Clean up any expired hackathons on the radar",
  "Run live hackathon and news ingestion across all providers",
];

const VOICE_OPTIONS = [
  { id: "Kore", label: "Kore (Warm Studio)" },
  { id: "Aoede", label: "Aoede (Clear Editorial)" },
  { id: "Puck", label: "Puck (Crisp Energetic)" },
  { id: "Charon", label: "Charon (Deep Authoritative)" },
  { id: "Fenrir", label: "Fenrir (Direct Executive)" },
];

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((ev: { results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

export function AiVoiceAssistantPanel({
  open,
  onClose,
  onMutated,
  initialPrompt,
}: AiVoiceAssistantPanelProps) {
  const [messages, setMessages] = useState<ChatEntry[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "I am your G-Gravitator Executive AI Operator. Talk to me by voice or text to research the web, design rich Journal/News/Hackathon posts with generated or imported images, review submissions, approve or revoke posts, clean stale content, and manage everything on the platform.",
      voiceSummary:
        "I am your G-Gravitator Executive AI Operator. Tell me what you want to research, design, publish, review, or clean up.",
    },
  ]);
  const [input, setInput] = useState(initialPrompt ?? "");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [voiceName, setVoiceName] = useState("Kore");
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaChunksRef = useRef<Blob[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const msgSeqRef = useRef(0);

  const nextEntryId = (prefix: string) => {
    msgSeqRef.current += 1;
    return `${prefix}-${msgSeqRef.current}`;
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingId(null);
  };

  const speakText = async (entryId: string, textToSpeak: string) => {
    stopSpeaking();
    const clean = textToSpeak.trim();
    if (!clean) return;
    setSpeakingId(entryId);

    try {
      const res = await fetch("/api/ops/ai/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "speak",
          text: clean,
          voiceName,
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok && data?.audioBase64) {
        const audio = new Audio(
          `data:${data.mimeType || "audio/wav"};base64,${data.audioBase64}`
        );
        audioRef.current = audio;
        audio.onended = () => setSpeakingId(null);
        audio.onerror = () => setSpeakingId(null);
        await audio.play();
        return;
      }
    } catch {
      // Fall back to browser Web Speech API
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utter = new SpeechSynthesisUtterance(clean);
      utter.rate = 1.03;
      utter.onend = () => setSpeakingId(null);
      utter.onerror = () => setSpeakingId(null);
      window.speechSynthesis.speak(utter);
    } else {
      setSpeakingId(null);
    }
  };

  const sendMessage = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || loading) return;

    setMicError(null);
    const userMsg: ChatEntry = {
      id: nextEntryId("u"),
      role: "user",
      content: text,
    };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    if (!textOverride) setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ops/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextHistory
            .filter((m) => m.id !== "welcome")
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        const errReply: ChatEntry = {
          id: nextEntryId("a"),
          role: "assistant",
          content: data?.error || "Failed to execute command.",
        };
        setMessages((prev) => [...prev, errReply]);
        return;
      }

      const aiMsg: ChatEntry = {
        id: nextEntryId("a"),
        role: "assistant",
        content: data.reply,
        voiceSummary: data.voiceSummary || data.reply,
        toolCalls: Array.isArray(data.toolCalls) ? data.toolCalls : [],
        modelUsed: data.modelUsed,
      };
      setMessages((prev) => [...prev, aiMsg]);

      if (aiMsg.toolCalls && aiMsg.toolCalls.length > 0) {
        await onMutated();
      }

      if (autoSpeak) {
        await speakText(aiMsg.id, aiMsg.voiceSummary || aiMsg.content);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: nextEntryId("a"),
          role: "assistant",
          content: "Network error while contacting the AI Operator.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const startVoiceCapture = async () => {
    setMicError(null);
    stopSpeaking();

    if (listening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      setListening(false);
      return;
    }

    // Prefer native Web Speech API when supported for instant live speech-to-text
    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const SpeechRecCtor = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (SpeechRecCtor) {
      try {
        const rec = new SpeechRecCtor();
        rec.continuous = false;
        rec.interimResults = true;
        rec.lang = "en-US";
        let finalTranscript = "";

        rec.onresult = (event) => {
          let interim = "";
          for (let i = 0; i < event.results.length; i++) {
            const chunk = event.results[i][0]?.transcript || "";
            if (event.results[i].isFinal) {
              finalTranscript += `${chunk} `;
            } else {
              interim += chunk;
            }
          }
          setInput((finalTranscript + interim).trim());
        };

        rec.onerror = (ev) => {
          setListening(false);
          if (ev.error !== "aborted" && ev.error !== "no-speech") {
            setMicError(`Microphone error: ${ev.error}`);
          }
        };

        rec.onend = () => {
          setListening(false);
          recognitionRef.current = null;
          const cleaned = finalTranscript.trim();
          if (cleaned) {
            void sendMessage(cleaned);
          }
        };

        recognitionRef.current = rec;
        rec.start();
        setListening(true);
        return;
      } catch {
        // Fall through to MediaRecorder + Gemini audio transcription
      }
    }

    // MediaRecorder + Gemini transcription fallback
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) mediaChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setListening(false);
        const blob = new Blob(mediaChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        if (blob.size < 200) return;
        setTranscribing(true);
        try {
          const reader = new FileReader();
          const base64Audio: string = await new Promise((resolve, reject) => {
            reader.onload = () =>
              resolve(String(reader.result || "").split(",")[1] || "");
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          const res = await fetch("/api/ops/ai/voice", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "transcribe",
              audioBase64: base64Audio,
              mimeType: blob.type || "audio/webm",
            }),
          });
          const data = await res.json().catch(() => null);
          if (res.ok && data?.transcript) {
            setInput(data.transcript);
            await sendMessage(data.transcript);
          } else {
            setMicError(data?.error || "Could not transcribe voice recording.");
          }
        } finally {
          setTranscribing(false);
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setListening(true);
    } catch {
      setMicError("Microphone permission denied or unavailable in this browser.");
      setListening(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div
        className="flex h-full w-full max-w-xl flex-col border-l border-white/[0.1] bg-[#0B0B0E] text-[#F4F3EF] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#FF3B1F]/40 bg-[#FF3B1F]/15 text-[#FF6B54]">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-semibold text-[#F4F3EF]">
                Admin AI &amp; Voice Operator
              </h2>
              <p className="text-xs text-[#8B8B94]">
                Gemini 3.8 Flash · Full tool execution + TTS voice
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              aria-label="AI Voice"
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value)}
              className="h-8 rounded-full border border-white/[0.1] bg-[#18181D] px-3 text-xs text-[#D4D4D8] focus:outline-none"
            >
              {VOICE_OPTIONS.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                if (autoSpeak) stopSpeaking();
                setAutoSpeak((v) => !v);
              }}
              title={autoSpeak ? "Auto-speak ON" : "Auto-speak OFF"}
              className={`inline-flex h-8 cursor-pointer items-center gap-1 rounded-full border px-3 text-xs font-medium ${
                autoSpeak
                  ? "border-[#10B981]/40 bg-[#10B981]/15 text-[#34D399]"
                  : "border-white/[0.1] bg-[#18181D] text-[#A1A1AA]"
              }`}
            >
              {autoSpeak ? (
                <Volume2 className="h-3.5 w-3.5" />
              ) : (
                <VolumeX className="h-3.5 w-3.5" />
              )}
              <span>Voice</span>
            </button>

            <button
              type="button"
              aria-label="Close AI Operator"
              onClick={() => {
                stopSpeaking();
                onClose();
              }}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/[0.1] bg-[#18181D] text-[#A1A1AA] hover:text-[#F4F3EF]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Quick Suggestions */}
        <div className="flex gap-2 overflow-x-auto border-b border-white/[0.06] px-5 py-2.5">
          {QUICK_COMMANDS.map((cmd, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => void sendMessage(cmd)}
              className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-full border border-white/[0.08] bg-[#141418] px-3 py-1 text-xs text-[#D4D4D8] hover:border-[#FF3B1F]/40 hover:text-[#F4F3EF]"
            >
              <Sparkles className="h-3 w-3 text-[#FF6B54]" />
              <span className="max-w-[240px] truncate">{cmd}</span>
            </button>
          ))}
        </div>

        {/* Transcript */}
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${
                m.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-[#FF3B1F] font-medium text-[#08080A]"
                    : "border border-white/[0.08] bg-[#141418] text-[#E4E4E7]"
                }`}
              >
                <div className="whitespace-pre-wrap">{m.content}</div>

                {m.toolCalls && m.toolCalls.length > 0 && (
                  <div className="mt-3 space-y-1.5 border-t border-white/[0.08] pt-2.5">
                    {m.toolCalls.map((tc, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 font-mono text-[11px] ${
                          tc.ok
                            ? "bg-[#10B981]/10 text-[#34D399]"
                            : "bg-[#FF3B1F]/10 text-[#FF8A7A]"
                        }`}
                      >
                        {tc.ok ? (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        )}
                        <span className="font-semibold">{tc.name}</span>
                        <span className="truncate opacity-80">· {tc.summary}</span>
                      </div>
                    ))}
                  </div>
                )}

                {m.role === "assistant" && (
                  <div className="mt-2.5 flex items-center justify-between gap-2 text-[11px] text-[#8B8B94]">
                    <span>{m.modelUsed || "AI Operator"}</span>
                    <button
                      type="button"
                      onClick={() =>
                        speakingId === m.id
                          ? stopSpeaking()
                          : void speakText(m.id, m.voiceSummary || m.content)
                      }
                      className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-white/[0.08] bg-[#18181D] px-2.5 py-0.5 text-[11px] text-[#D4D4D8] hover:text-[#F4F3EF]"
                    >
                      {speakingId === m.id ? (
                        <>
                          <Square className="h-2.5 w-2.5 text-[#FF6B54]" />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-2.5 w-2.5 text-[#34D399]" />
                          <span>Speak</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {(loading || transcribing) && (
            <div className="flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-[#141418] px-4 py-3 text-xs text-[#A1A1AA]">
              <Loader2 className="h-4 w-4 animate-spin text-[#FF6B54]" />
              <span>
                {transcribing
                  ? "Transcribing your voice command..."
                  : "Researching & executing tools across the platform..."}
              </span>
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-white/[0.08] bg-[#0B0B0E] p-4">
          {micError && (
            <div className="mb-2.5 rounded-xl border border-[#FF3B1F]/35 bg-[#FF3B1F]/12 px-3 py-2 text-xs text-[#FF8A7A]">
              {micError}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage();
            }}
            className="flex items-end gap-2"
          >
            <button
              type="button"
              onClick={() => void startVoiceCapture()}
              title={listening ? "Stop recording & send" : "Speak human voice command"}
              className={`flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border transition-colors ${
                listening
                  ? "animate-pulse border-[#FF3B1F] bg-[#FF3B1F] text-[#08080A]"
                  : "border-white/[0.12] bg-[#18181D] text-[#F4F3EF] hover:border-[#FF3B1F]/50"
              }`}
            >
              {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>

            <textarea
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage();
                }
              }}
              placeholder={
                listening
                  ? "Listening... speak naturally"
                  : "Tell the AI to research, design a post with images/colors, approve, or run any admin task..."
              }
              className="flex-1 resize-none rounded-2xl border border-white/[0.12] bg-[#141418] px-4 py-2.5 text-sm text-[#F4F3EF] placeholder:text-[#71717A] focus:border-[#FF3B1F] focus:outline-none"
            />

            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#FF3B1F] text-[#08080A] transition-colors hover:bg-[#FF5238] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

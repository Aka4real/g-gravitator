"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Headphones,
  Loader2,
  Mic,
  MicOff,
  Play,
  Radio,
  RotateCcw,
  Send,
  Sparkles,
  Square,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import type { OpsSystemHealth } from "@/components/ops/ops-types";
import type { ExecutedToolTrace } from "@/lib/ops/ai-agent";

interface ChatEntry {
  id: string;
  role: "user" | "assistant";
  content: string;
  voiceSummary?: string;
  toolCalls?: ExecutedToolTrace[];
  modelUsed?: string;
  isError?: boolean;
}

interface AiVoiceAssistantPanelProps {
  open: boolean;
  onClose: () => void;
  onMutated: () => Promise<void> | void;
  initialPrompt?: string;
  systemHealth?: OpsSystemHealth;
}

type MicMode = "studio" | "browser";

const WELCOME_MESSAGE: ChatEntry = {
  id: "welcome",
  role: "assistant",
  content:
    "I am your G-Gravitator Executive AI Operator. Talk to me by voice or text to research the web, design rich Journal/News/Hackathon posts with generated or imported visuals, inspect entries, approve or revoke posts, clean stale content, and manage everything on the platform.",
  voiceSummary:
    "I am your G-Gravitator Executive AI Operator. Tell me what you want to research, design, publish, review, or clean up.",
};

const QUICK_COMMANDS = [
  "Check pending reviews and summarize what needs approval",
  "Research the latest AI multi-agent frameworks, generate a cover image, and design a rich Journal Dispatch",
  "Clean up any expired hackathons on the radar",
  "Run live hackathon and news ingestion across all providers",
];

const VOICE_OPTIONS = [
  { id: "Kore", label: "Kore · Warm Studio" },
  { id: "Aoede", label: "Aoede · Clear Editorial" },
  { id: "Puck", label: "Puck · Crisp Energetic" },
  { id: "Charon", label: "Charon · Deep Authoritative" },
  { id: "Fenrir", label: "Fenrir · Direct Executive" },
  { id: "Leda", label: "Leda · Calm Analytical" },
  { id: "Orus", label: "Orus · Grounded Baritone" },
  { id: "Zephyr", label: "Zephyr · Bright Conversational" },
];

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: { transcript: string };
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((ev: { results: ArrayLike<SpeechRecognitionResultLike> }) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort?: () => void;
};

type WindowWithAudio = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  webkitAudioContext?: typeof AudioContext;
};

function pickBestRecorderMimeType(): string {
  if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") {
    return "";
  }
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
    "audio/ogg",
  ];
  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }
  return "";
}

function stripMimeParameters(mimeType: string): string {
  const base = (mimeType || "audio/webm").split(";")[0]?.trim().toLowerCase() || "audio/webm";
  if (base === "video/webm") return "audio/webm";
  if (base === "video/mp4") return "audio/mp4";
  return base;
}

function decodeBase64ToBytes(base64: string): Uint8Array {
  const binary = window.atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function AiVoiceAssistantPanel({
  open,
  onClose,
  onMutated,
  initialPrompt,
  systemHealth,
}: AiVoiceAssistantPanelProps) {
  const geminiReady = systemHealth ? systemHealth.geminiConfigured : true;

  const [messages, setMessages] = useState<ChatEntry[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState(initialPrompt ?? "");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>(() => new Array(12).fill(0.14));
  const [transcribing, setTranscribing] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [handsFree, setHandsFree] = useState(false);
  const [micMode, setMicMode] = useState<MicMode>(geminiReady ? "studio" : "browser");
  const [voiceName, setVoiceName] = useState("Kore");
  const [synthesizingId, setSynthesizingId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [ttsEngineLabel, setTtsEngineLabel] = useState<string>(
    geminiReady ? "Gemini 3.8 TTS" : "Browser Speech"
  );
  const [voiceBanner, setVoiceBanner] = useState<{
    tone: "info" | "warn" | "error";
    text: string;
  } | null>(null);
  const [blockedAudioEntryId, setBlockedAudioEntryId] = useState<string | null>(null);
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});

  // Refs for fresh state in async callbacks (prevents stale closures)
  const messagesRef = useRef<ChatEntry[]>(messages);
  const voiceNameRef = useRef(voiceName);
  const autoSpeakRef = useRef(autoSpeak);
  const handsFreeRef = useRef(handsFree);
  const loadingRef = useRef(loading);
  const openRef = useRef(open);
  const micModeRef = useRef<MicMode>(micMode);
  const onMutatedRef = useRef(onMutated);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  useEffect(() => {
    voiceNameRef.current = voiceName;
  }, [voiceName]);
  useEffect(() => {
    autoSpeakRef.current = autoSpeak;
  }, [autoSpeak]);
  useEffect(() => {
    handsFreeRef.current = handsFree;
  }, [handsFree]);
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);
  useEffect(() => {
    openRef.current = open;
  }, [open]);
  useEffect(() => {
    micModeRef.current = micMode;
  }, [micMode]);
  useEffect(() => {
    onMutatedRef.current = onMutated;
  }, [onMutated]);

  // Audio playback & capture refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const bufferSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const htmlAudioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const pendingAudioRef = useRef<{
    entryId: string;
    bytes: Uint8Array;
    mimeType: string;
    autoFollowUp: boolean;
  } | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaChunksRef = useRef<Blob[]>([]);
  const meterFrameRef = useRef<number | null>(null);
  const meterCtxRef = useRef<AudioContext | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const liveTranscriptRef = useRef("");
  const cancelRecordingRef = useRef(false);

  const chatAbortRef = useRef<AbortController | null>(null);
  const ttsAbortRef = useRef<AbortController | null>(null);
  const sttAbortRef = useRef<AbortController | null>(null);
  const handsFreeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const msgSeqRef = useRef(0);
  const startVoiceCaptureRef = useRef<(modeOverride?: MicMode) => Promise<void>>(async () => {});

  const nextEntryId = (prefix: string) => {
    msgSeqRef.current += 1;
    return `${prefix}-${msgSeqRef.current}`;
  };

  useEffect(() => {
    if (open && initialPrompt) {
      setInput(initialPrompt);
    }
  }, [open, initialPrompt]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, transcribing]);

  // Unlock shared Web Audio context synchronously inside any user gesture so
  // delayed AI TTS responses (5-25s later) are never blocked by browser autoplay rules.
  const unlockAudioContext = useCallback(() => {
    if (typeof window === "undefined") return null;
    const win = window as WindowWithAudio;
    const AudioCtxCtor = window.AudioContext || win.webkitAudioContext;
    if (!AudioCtxCtor) return null;

    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      audioCtxRef.current = new AudioCtxCtor();
    }
    if (audioCtxRef.current.state === "suspended") {
      void audioCtxRef.current.resume().catch(() => null);
    }
    return audioCtxRef.current;
  }, []);

  const stopMetering = useCallback(() => {
    if (meterFrameRef.current !== null) {
      cancelAnimationFrame(meterFrameRef.current);
      meterFrameRef.current = null;
    }
    if (timerIntervalRef.current !== null) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (meterCtxRef.current) {
      void meterCtxRef.current.close().catch(() => null);
      meterCtxRef.current = null;
    }
    setRecordingSeconds(0);
    setAudioLevels(new Array(12).fill(0.14));
  }, []);

  const stopSpeaking = useCallback(() => {
    if (handsFreeTimerRef.current) {
      clearTimeout(handsFreeTimerRef.current);
      handsFreeTimerRef.current = null;
    }
    if (ttsAbortRef.current) {
      ttsAbortRef.current.abort();
      ttsAbortRef.current = null;
    }
    if (bufferSourceRef.current) {
      try {
        bufferSourceRef.current.onended = null;
        bufferSourceRef.current.stop();
        bufferSourceRef.current.disconnect();
      } catch {
        // Already stopped
      }
      bufferSourceRef.current = null;
    }
    if (htmlAudioRef.current) {
      htmlAudioRef.current.onended = null;
      htmlAudioRef.current.onerror = null;
      htmlAudioRef.current.pause();
      htmlAudioRef.current.src = "";
      htmlAudioRef.current = null;
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    pendingAudioRef.current = null;
    setBlockedAudioEntryId(null);
    setSynthesizingId(null);
    setSpeakingId(null);
  }, []);

  const cleanupRecording = useCallback(
    (discard: boolean) => {
      cancelRecordingRef.current = discard;
      stopMetering();
      if (recognitionRef.current) {
        const rec = recognitionRef.current;
        recognitionRef.current = null;
        try {
          if (discard && rec.abort) {
            rec.abort();
          } else {
            rec.stop();
          }
        } catch {
          // Ignore stop errors
        }
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // Ignore stop errors
        }
      }
      if (discard && mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
      setListening(false);
    },
    [stopMetering]
  );

  const scheduleHandsFreeFollowUp = useCallback(() => {
    if (!handsFreeRef.current || !openRef.current || loadingRef.current) return;
    if (handsFreeTimerRef.current) clearTimeout(handsFreeTimerRef.current);
    handsFreeTimerRef.current = setTimeout(() => {
      if (handsFreeRef.current && openRef.current && !loadingRef.current) {
        void startVoiceCaptureRef.current();
      }
    }, 450);
  }, []);

  const playAudioBytes = useCallback(
    async (
      entryId: string,
      bytes: Uint8Array,
      mimeType: string,
      autoFollowUp: boolean
    ): Promise<boolean> => {
      // Strategy 1: Unlocked Web Audio API (immune to delayed autoplay restriction once resumed)
      const ctx = audioCtxRef.current;
      if (ctx && ctx.state !== "closed") {
        try {
          if (ctx.state === "suspended") {
            await ctx.resume();
          }
          if (ctx.state === "running") {
            const copy = new ArrayBuffer(bytes.byteLength);
            new Uint8Array(copy).set(bytes);
            const audioBuffer = await ctx.decodeAudioData(copy);
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            bufferSourceRef.current = source;
            setSynthesizingId(null);
            setSpeakingId(entryId);
            setBlockedAudioEntryId(null);
            pendingAudioRef.current = null;

            source.onended = () => {
              if (bufferSourceRef.current === source) {
                bufferSourceRef.current = null;
                setSpeakingId((curr) => (curr === entryId ? null : curr));
                if (autoFollowUp) {
                  scheduleHandsFreeFollowUp();
                }
              }
            };
            source.start(0);
            return true;
          }
        } catch {
          // Fall through to HTML5 Blob Audio playback
        }
      }

      // Strategy 2: Blob URL HTMLAudioElement
      try {
        const blobCopy = new Uint8Array(bytes.byteLength);
        blobCopy.set(bytes);
        const blob = new Blob([blobCopy.buffer], { type: mimeType || "audio/wav" });
        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;
        const audio = new Audio(url);
        htmlAudioRef.current = audio;
        setSynthesizingId(null);
        setSpeakingId(entryId);
        setBlockedAudioEntryId(null);
        pendingAudioRef.current = null;

        audio.onended = () => {
          if (blobUrlRef.current === url) {
            URL.revokeObjectURL(url);
            blobUrlRef.current = null;
          }
          htmlAudioRef.current = null;
          setSpeakingId((curr) => (curr === entryId ? null : curr));
          if (autoFollowUp) {
            scheduleHandsFreeFollowUp();
          }
        };
        audio.onerror = () => {
          if (blobUrlRef.current === url) {
            URL.revokeObjectURL(url);
            blobUrlRef.current = null;
          }
          htmlAudioRef.current = null;
          setSpeakingId((curr) => (curr === entryId ? null : curr));
        };

        await audio.play();
        return true;
      } catch (err) {
        const name = err instanceof Error ? err.name : "";
        if (name === "NotAllowedError") {
          // Browser blocked autoplay — retain high-quality audio for 1-tap playback
          pendingAudioRef.current = { entryId, bytes, mimeType, autoFollowUp };
          setSynthesizingId(null);
          setSpeakingId(null);
          setBlockedAudioEntryId(entryId);
          setVoiceBanner({
            tone: "info",
            text: "Browser paused autoplay. Tap Play on the message to hear Gemini Studio Voice.",
          });
          return true;
        }
        return false;
      }
    },
    [scheduleHandsFreeFollowUp]
  );

  const speakWithBrowserFallback = useCallback(
    (entryId: string, clean: string, autoFollowUp: boolean, reason?: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        setSynthesizingId(null);
        setSpeakingId(null);
        setVoiceBanner({
          tone: "warn",
          text: reason || "Voice playback is unavailable in this browser.",
        });
        return;
      }

      setTtsEngineLabel("Browser Speech");
      if (reason) {
        setVoiceBanner({ tone: "info", text: reason });
      }
      const utter = new SpeechSynthesisUtterance(clean);
      utter.rate = 1.02;
      const voices = window.speechSynthesis.getVoices();
      const preferred =
        voices.find((v) => v.lang.startsWith("en") && /natural|google|samantha|daniel|aria/i.test(v.name)) ||
        voices.find((v) => v.lang.startsWith("en"));
      if (preferred) {
        utter.voice = preferred;
      }

      setSynthesizingId(null);
      setSpeakingId(entryId);
      utter.onend = () => {
        setSpeakingId((curr) => (curr === entryId ? null : curr));
        if (autoFollowUp) {
          scheduleHandsFreeFollowUp();
        }
      };
      utter.onerror = () => {
        setSpeakingId((curr) => (curr === entryId ? null : curr));
      };
      window.speechSynthesis.speak(utter);
    },
    [scheduleHandsFreeFollowUp]
  );

  const speakText = useCallback(
    async (
      entryId: string,
      textToSpeak: string,
      options?: { autoFollowUp?: boolean; fromGesture?: boolean }
    ) => {
      if (options?.fromGesture) {
        unlockAudioContext();
      }

      // If we already synthesized audio for this exact entry and it was only autoplay-blocked, play it instantly!
      if (
        pendingAudioRef.current &&
        pendingAudioRef.current.entryId === entryId &&
        options?.fromGesture
      ) {
        const cached = pendingAudioRef.current;
        setVoiceBanner(null);
        await playAudioBytes(cached.entryId, cached.bytes, cached.mimeType, cached.autoFollowUp);
        return;
      }

      stopSpeaking();
      const clean = textToSpeak.trim();
      if (!clean) return;

      const autoFollowUp = Boolean(options?.autoFollowUp);
      setSynthesizingId(entryId);

      const controller = new AbortController();
      ttsAbortRef.current = controller;

      try {
        const res = await fetch("/api/ops/ai/voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            action: "speak",
            text: clean,
            voiceName: voiceNameRef.current,
          }),
        });

        if (controller.signal.aborted || !openRef.current) return;

        const data = (await res.json().catch(() => null)) as {
          ok?: boolean;
          audioBase64?: string;
          mimeType?: string;
          model?: string;
          fallbackToBrowserSpeech?: boolean;
          reason?: string;
        } | null;

        if (res.ok && data?.ok && data?.audioBase64) {
          const bytes = decodeBase64ToBytes(data.audioBase64);
          const mimeType = data.mimeType || "audio/wav";
          setTtsEngineLabel(
            data.model ? data.model.replace(/^gemini-/, "Gemini ").replace(/-/g, " ") : "Gemini 3.8 TTS"
          );
          setVoiceBanner(null);
          const played = await playAudioBytes(entryId, bytes, mimeType, autoFollowUp);
          if (played) return;
        }

        speakWithBrowserFallback(entryId, clean, autoFollowUp, data?.reason);
      } catch (err) {
        if (controller.signal.aborted) return;
        const msg = err instanceof Error ? err.message : undefined;
        speakWithBrowserFallback(
          entryId,
          clean,
          autoFollowUp,
          msg ? `Gemini TTS fallback (${msg})` : undefined
        );
      } finally {
        if (ttsAbortRef.current === controller) {
          ttsAbortRef.current = null;
        }
        setSynthesizingId((curr) => (curr === entryId ? null : curr));
      }
    },
    [playAudioBytes, speakWithBrowserFallback, stopSpeaking, unlockAudioContext]
  );

  const stopGeneration = useCallback(() => {
    if (chatAbortRef.current) {
      chatAbortRef.current.abort();
      chatAbortRef.current = null;
    }
    setLoading(false);
  }, []);

  const sendMessage = useCallback(
    async (textOverride?: string, options?: { fromVoice?: boolean }) => {
      const text = (textOverride ?? input).trim();
      if (!text || loadingRef.current) return;

      unlockAudioContext();
      stopSpeaking();
      setVoiceBanner(null);

      const userMsg: ChatEntry = {
        id: nextEntryId("u"),
        role: "user",
        content: text,
      };
      const nextHistory = [...messagesRef.current, userMsg];
      messagesRef.current = nextHistory;
      setMessages(nextHistory);
      setInput("");
      setLoading(true);
      loadingRef.current = true;

      const controller = new AbortController();
      chatAbortRef.current = controller;

      try {
        const res = await fetch("/api/ops/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            messages: nextHistory
              .filter((m) => m.id !== "welcome")
              .map((m) => ({ role: m.role, content: m.content })),
          }),
        });
        const data = (await res.json().catch(() => null)) as {
          ok?: boolean;
          reply?: string;
          voiceSummary?: string;
          toolCalls?: ExecutedToolTrace[];
          modelUsed?: string;
          error?: string;
        } | null;

        if (!res.ok || !data?.ok || !data?.reply) {
          const errMsg: ChatEntry = {
            id: nextEntryId("a"),
            role: "assistant",
            content: data?.error || `Command failed (HTTP ${res.status}).`,
            isError: true,
          };
          setMessages((prev) => [...prev, errMsg]);
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

        // Refresh dashboard data in parallel with TTS synthesis so voice starts immediately
        const refreshPromise =
          aiMsg.toolCalls && aiMsg.toolCalls.length > 0
            ? Promise.resolve(onMutatedRef.current()).catch(() => null)
            : Promise.resolve(null);

        const shouldSpeak = autoSpeakRef.current || Boolean(options?.fromVoice);
        if (shouldSpeak && openRef.current) {
          await Promise.all([
            refreshPromise,
            speakText(aiMsg.id, aiMsg.voiceSummary || aiMsg.content, {
              autoFollowUp: handsFreeRef.current && Boolean(options?.fromVoice),
            }),
          ]);
        } else {
          await refreshPromise;
        }
      } catch (err) {
        if (controller.signal.aborted) {
          setMessages((prev) => [
            ...prev,
            {
              id: nextEntryId("a"),
              role: "assistant",
              content: "Generation stopped.",
            },
          ]);
          return;
        }
        setMessages((prev) => [
          ...prev,
          {
            id: nextEntryId("a"),
            role: "assistant",
            content:
              err instanceof Error
                ? `Network error while contacting AI Operator: ${err.message}`
                : "Network error while contacting the AI Operator.",
            isError: true,
          },
        ]);
      } finally {
        if (chatAbortRef.current === controller) {
          chatAbortRef.current = null;
        }
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [input, speakText, stopSpeaking, unlockAudioContext]
  );

  const startStudioRecording = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setVoiceBanner({
        tone: "error",
        text: "Microphone recording is not supported in this browser.",
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;
      cancelRecordingRef.current = false;

      // Setup live waveform analyser
      const win = window as WindowWithAudio;
      const AudioCtxCtor = window.AudioContext || win.webkitAudioContext;
      if (AudioCtxCtor) {
        const meterCtx = new AudioCtxCtor();
        meterCtxRef.current = meterCtx;
        const source = meterCtx.createMediaStreamSource(stream);
        const analyser = meterCtx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.72;
        source.connect(analyser);

        const freqData = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          analyser.getByteFrequencyData(freqData);
          const bars: number[] = [];
          const step = Math.max(1, Math.floor(freqData.length / 12));
          for (let i = 0; i < 12; i++) {
            const val = freqData[i * step] / 255;
            bars.push(Math.max(0.14, Math.min(1, val * 1.35)));
          }
          setAudioLevels(bars);
          meterFrameRef.current = requestAnimationFrame(tick);
        };
        meterFrameRef.current = requestAnimationFrame(tick);
      }

      setRecordingSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);

      const chosenMime = pickBestRecorderMimeType();
      const recorder = chosenMime
        ? new MediaRecorder(stream, { mimeType: chosenMime })
        : new MediaRecorder(stream);

      mediaChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          mediaChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        stopMetering();
        stream.getTracks().forEach((t) => t.stop());
        if (mediaStreamRef.current === stream) {
          mediaStreamRef.current = null;
        }
        mediaRecorderRef.current = null;
        setListening(false);

        if (cancelRecordingRef.current || !openRef.current) {
          mediaChunksRef.current = [];
          return;
        }

        const rawMime = recorder.mimeType || chosenMime || "audio/webm";
        const blob = new Blob(mediaChunksRef.current, { type: rawMime });
        mediaChunksRef.current = [];

        if (blob.size < 400) {
          setVoiceBanner({
            tone: "info",
            text: "Recording was too short. Tap the mic, speak your command, then tap Send.",
          });
          return;
        }

        setTranscribing(true);
        const controller = new AbortController();
        sttAbortRef.current = controller;

        try {
          const base64Audio: string = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve(String(reader.result || "").split(",")[1] || "");
            reader.onerror = () => reject(new Error("Failed to read recorded audio."));
            reader.readAsDataURL(blob);
          });

          const res = await fetch("/api/ops/ai/voice", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
              action: "transcribe",
              audioBase64: base64Audio,
              mimeType: stripMimeParameters(blob.type || rawMime),
            }),
          });
          const data = (await res.json().catch(() => null)) as {
            ok?: boolean;
            transcript?: string;
            error?: string;
          } | null;

          if (res.ok && data?.transcript) {
            const cleaned = data.transcript.trim();
            if (cleaned) {
              await sendMessage(cleaned, { fromVoice: true });
            } else {
              setVoiceBanner({
                tone: "info",
                text: "No speech detected in recording. Please try again.",
              });
            }
          } else {
            setVoiceBanner({
              tone: "error",
              text: data?.error || "Could not transcribe voice recording.",
            });
          }
        } catch (err) {
          if (!controller.signal.aborted) {
            setVoiceBanner({
              tone: "error",
              text:
                err instanceof Error
                  ? `Transcription error: ${err.message}`
                  : "Network error during voice transcription.",
            });
          }
        } finally {
          if (sttAbortRef.current === controller) {
            sttAbortRef.current = null;
          }
          setTranscribing(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setListening(true);
    } catch {
      stopMetering();
      setVoiceBanner({
        tone: "error",
        text: "Microphone permission denied or no audio input device found.",
      });
      setListening(false);
    }
  }, [sendMessage, stopMetering]);

  const startVoiceCapture = useCallback(
    async (modeOverride?: MicMode) => {
      unlockAudioContext();
      setVoiceBanner(null);
      stopSpeaking();

      if (listening) {
        // Stop and submit what was captured
        cleanupRecording(false);
        return;
      }

      const mode = modeOverride ?? micModeRef.current;

      if (mode === "browser") {
        const win = window as WindowWithAudio;
        const SpeechRecCtor = win.SpeechRecognition || win.webkitSpeechRecognition;

        if (SpeechRecCtor) {
          try {
            const rec = new SpeechRecCtor();
            rec.continuous = true;
            rec.interimResults = true;
            rec.lang = "en-US";
            liveTranscriptRef.current = "";
            cancelRecordingRef.current = false;

            rec.onresult = (event) => {
              let committed = "";
              let interim = "";
              for (let i = 0; i < event.results.length; i++) {
                const chunk = event.results[i][0]?.transcript || "";
                if (event.results[i].isFinal) {
                  committed += `${chunk} `;
                } else {
                  interim += chunk;
                }
              }
              const combined = (committed + interim).replace(/\s+/g, " ").trim();
              liveTranscriptRef.current = combined;
              setInput(combined);
            };

            rec.onerror = (ev) => {
              stopMetering();
              recognitionRef.current = null;
              setListening(false);

              if (
                ev.error === "network" ||
                ev.error === "service-not-allowed" ||
                ev.error === "language-not-supported"
              ) {
                if (geminiReady) {
                  setMicMode("studio");
                  setVoiceBanner({
                    tone: "info",
                    text: "Live browser dictation unavailable here — switched to Studio AI recording.",
                  });
                  void startStudioRecording();
                  return;
                }
              }

              if (ev.error !== "aborted" && ev.error !== "no-speech") {
                setVoiceBanner({
                  tone: "error",
                  text: `Speech recognition error: ${ev.error}`,
                });
              }
            };

            rec.onend = () => {
              stopMetering();
              recognitionRef.current = null;
              setListening(false);
              const cleaned = liveTranscriptRef.current.trim();
              liveTranscriptRef.current = "";
              if (!cancelRecordingRef.current && cleaned && openRef.current) {
                void sendMessage(cleaned, { fromVoice: true });
              }
            };

            setRecordingSeconds(0);
            timerIntervalRef.current = setInterval(() => {
              setRecordingSeconds((s) => s + 1);
            }, 1000);

            recognitionRef.current = rec;
            rec.start();
            setListening(true);
            return;
          } catch {
            // Fall through to Studio recording
          }
        } else {
          setMicMode("studio");
          setVoiceBanner({
            tone: "info",
            text: "This browser does not support Web Speech API — using Studio AI recording.",
          });
        }
      }

      await startStudioRecording();
    },
    [
      cleanupRecording,
      geminiReady,
      listening,
      sendMessage,
      startStudioRecording,
      stopMetering,
      stopSpeaking,
      unlockAudioContext,
    ]
  );

  useEffect(() => {
    startVoiceCaptureRef.current = startVoiceCapture;
  }, [startVoiceCapture]);

  const handleFullCleanup = useCallback(() => {
    stopGeneration();
    stopSpeaking();
    cleanupRecording(true);
    if (sttAbortRef.current) {
      sttAbortRef.current.abort();
      sttAbortRef.current = null;
    }
    setTranscribing(false);
  }, [cleanupRecording, stopGeneration, stopSpeaking]);

  // Stop all audio, mic tracks, and in-flight requests when panel closes or unmounts
  useEffect(() => {
    if (!open) {
      handleFullCleanup();
    }
    return () => {
      handleFullCleanup();
    };
  }, [open, handleFullCleanup]);

  // Escape key closes panel cleanly
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleFullCleanup();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, handleFullCleanup, onClose]);

  const handleClose = () => {
    handleFullCleanup();
    onClose();
  };

  const handleNewChat = () => {
    handleFullCleanup();
    setMessages([WELCOME_MESSAGE]);
    setInput("");
    setVoiceBanner(null);
    setExpandedTools({});
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/65 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Admin AI and Voice Operator"
        className="flex h-full w-full max-w-xl flex-col border-l border-white/[0.1] bg-[#0B0B0E] text-[#F4F3EF] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="space-y-3 border-b border-white/[0.08] px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#FF3B1F]/40 bg-[#FF3B1F]/15 text-[#FF6B54]">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-base font-semibold text-[#F4F3EF]">
                    Admin AI &amp; Voice Operator
                  </h2>
                  <span
                    className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold ${
                      geminiReady
                        ? "bg-[#10B981]/15 text-[#34D399]"
                        : "bg-[#F59E0B]/20 text-[#FBBF24]"
                    }`}
                  >
                    {geminiReady
                      ? systemHealth?.geminiModel || "gemini-3.8-flash"
                      : "KEY MISSING"}
                  </span>
                </div>
                <p className="text-[11px] text-[#8B8B94]">
                  {ttsEngineLabel} ·{" "}
                  {micMode === "studio" ? "Gemini Studio Mic" : "Browser Live Dictation"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleNewChat}
                title="Start new conversation"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/[0.1] bg-[#18181D] text-[#A1A1AA] hover:text-[#F4F3EF]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label="Close AI Operator"
                onClick={handleClose}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/[0.1] bg-[#18181D] text-[#A1A1AA] hover:text-[#F4F3EF]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Voice Control Strip */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="AI Voice"
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value)}
              className="h-8 rounded-full border border-white/[0.1] bg-[#18181D] px-3 text-xs text-[#D4D4D8] focus:border-[#FF3B1F] focus:outline-none"
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
                unlockAudioContext();
                if (autoSpeak) stopSpeaking();
                setAutoSpeak((v) => !v);
              }}
              title={autoSpeak ? "Auto-speak responses ON" : "Auto-speak responses OFF"}
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
              <span>Auto-Speak</span>
            </button>

            <button
              type="button"
              onClick={() => {
                unlockAudioContext();
                setHandsFree((v) => {
                  const next = !v;
                  if (next) setAutoSpeak(true);
                  return next;
                });
              }}
              title="Automatically re-open mic after AI finishes speaking"
              className={`inline-flex h-8 cursor-pointer items-center gap-1 rounded-full border px-3 text-xs font-medium ${
                handsFree
                  ? "border-[#FF3B1F]/50 bg-[#FF3B1F]/18 text-[#FF8A7A]"
                  : "border-white/[0.1] bg-[#18181D] text-[#A1A1AA]"
              }`}
            >
              <Headphones className="h-3.5 w-3.5" />
              <span>Hands-Free</span>
            </button>

            <div
              role="group"
              aria-label="Speech input engine"
              className="ml-auto inline-flex rounded-full border border-white/[0.1] bg-[#141418] p-0.5 text-[11px]"
            >
              <button
                type="button"
                onClick={() => setMicMode("studio")}
                className={`cursor-pointer rounded-full px-2.5 py-1 font-medium transition-colors ${
                  micMode === "studio"
                    ? "bg-[#F4F3EF] text-[#08080A]"
                    : "text-[#A1A1AA] hover:text-[#F4F3EF]"
                }`}
              >
                Studio AI
              </button>
              <button
                type="button"
                onClick={() => setMicMode("browser")}
                className={`cursor-pointer rounded-full px-2.5 py-1 font-medium transition-colors ${
                  micMode === "browser"
                    ? "bg-[#F4F3EF] text-[#08080A]"
                    : "text-[#A1A1AA] hover:text-[#F4F3EF]"
                }`}
              >
                Live
              </button>
            </div>
          </div>

          {!geminiReady && (
            <div className="flex items-start gap-2 rounded-xl border border-[#F59E0B]/35 bg-[#F59E0B]/12 px-3 py-2 text-xs text-[#FCD34D]">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                <code>GEMINI_API_KEY</code> is not configured on the server. Add it in
                environment variables to enable AI tool execution, Studio TTS, and Gemini
                Transcribe.
              </span>
            </div>
          )}
        </div>

        {/* Quick Suggestions */}
        <div className="flex gap-2 overflow-x-auto border-b border-white/[0.06] px-5 py-2.5">
          {QUICK_COMMANDS.map((cmd, idx) => (
            <button
              key={idx}
              type="button"
              disabled={loading}
              onClick={() => void sendMessage(cmd)}
              className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-full border border-white/[0.08] bg-[#141418] px-3 py-1 text-xs text-[#D4D4D8] hover:border-[#FF3B1F]/40 hover:text-[#F4F3EF] disabled:opacity-50"
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
                className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-[#FF3B1F] font-medium text-[#08080A]"
                    : m.isError
                    ? "border border-[#FF3B1F]/40 bg-[#FF3B1F]/12 text-[#FF8A7A]"
                    : "border border-white/[0.08] bg-[#141418] text-[#E4E4E7]"
                }`}
              >
                <div className="whitespace-pre-wrap break-words">{m.content}</div>

                {m.toolCalls && m.toolCalls.length > 0 && (
                  <div className="mt-3 space-y-1.5 border-t border-white/[0.08] pt-2.5">
                    {m.toolCalls.map((tc, idx) => {
                      const traceKey = `${m.id}-${idx}`;
                      const isExpanded = Boolean(expandedTools[traceKey]);
                      const hasArgs = tc.args && Object.keys(tc.args).length > 0;
                      return (
                        <div
                          key={traceKey}
                          className={`rounded-lg font-mono text-[11px] ${
                            tc.ok
                              ? "bg-[#10B981]/10 text-[#34D399]"
                              : "bg-[#FF3B1F]/12 text-[#FF8A7A]"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              hasArgs &&
                              setExpandedTools((prev) => ({
                                ...prev,
                                [traceKey]: !prev[traceKey],
                              }))
                            }
                            className={`flex w-full items-center gap-2 px-2.5 py-1.5 text-left ${
                              hasArgs ? "cursor-pointer" : "cursor-default"
                            }`}
                          >
                            {tc.ok ? (
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                            ) : (
                              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            )}
                            <span className="font-semibold">{tc.name}</span>
                            <span className="min-w-0 flex-1 truncate opacity-85">
                              · {tc.summary}
                            </span>
                            {hasArgs &&
                              (isExpanded ? (
                                <ChevronDown className="h-3 w-3 shrink-0 opacity-70" />
                              ) : (
                                <ChevronRight className="h-3 w-3 shrink-0 opacity-70" />
                              ))}
                          </button>
                          {isExpanded && hasArgs && (
                            <pre className="overflow-x-auto border-t border-white/[0.08] px-2.5 py-2 text-[10px] text-[#D4D4D8]">
                              {JSON.stringify(tc.args, null, 2)}
                            </pre>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {m.role === "assistant" && !m.isError && (
                  <div className="mt-2.5 flex items-center justify-between gap-2 text-[11px] text-[#8B8B94]">
                    <span className="truncate font-mono">
                      {m.modelUsed || "AI Operator"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (speakingId === m.id || synthesizingId === m.id) {
                          stopSpeaking();
                        } else {
                          void speakText(m.id, m.voiceSummary || m.content, {
                            fromGesture: true,
                          });
                        }
                      }}
                      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] transition-colors ${
                        blockedAudioEntryId === m.id
                          ? "border-[#FF3B1F]/60 bg-[#FF3B1F]/20 font-semibold text-[#FF8A7A]"
                          : "border-white/[0.08] bg-[#18181D] text-[#D4D4D8] hover:text-[#F4F3EF]"
                      }`}
                    >
                      {synthesizingId === m.id ? (
                        <>
                          <Loader2 className="h-2.5 w-2.5 animate-spin text-[#FF6B54]" />
                          <span>Synthesizing...</span>
                        </>
                      ) : speakingId === m.id ? (
                        <>
                          <Square className="h-2.5 w-2.5 text-[#FF6B54]" />
                          <span>Stop</span>
                        </>
                      ) : blockedAudioEntryId === m.id ? (
                        <>
                          <Play className="h-2.5 w-2.5 text-[#FF6B54]" />
                          <span>Tap to play</span>
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
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-[#141418] px-4 py-3 text-xs text-[#A1A1AA]">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-[#FF6B54]" />
                <span>
                  {transcribing
                    ? "Transcribing voice clip with Gemini..."
                    : "Executing tools & synthesizing response..."}
                </span>
              </div>
              {loading && (
                <button
                  type="button"
                  onClick={stopGeneration}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-white/[0.12] bg-[#18181D] px-2.5 py-1 text-[11px] font-medium text-[#F4F3EF] hover:border-[#FF3B1F]/50"
                >
                  <Square className="h-2.5 w-2.5 text-[#FF6B54]" />
                  <span>Stop</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-white/[0.08] bg-[#0B0B0E] p-4">
          {voiceBanner && (
            <div
              className={`mb-2.5 flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs ${
                voiceBanner.tone === "error"
                  ? "border-[#FF3B1F]/35 bg-[#FF3B1F]/12 text-[#FF8A7A]"
                  : voiceBanner.tone === "warn"
                  ? "border-[#F59E0B]/35 bg-[#F59E0B]/12 text-[#FCD34D]"
                  : "border-white/[0.12] bg-[#141418] text-[#D4D4D8]"
              }`}
            >
              <span>{voiceBanner.text}</span>
              <button
                type="button"
                onClick={() => setVoiceBanner(null)}
                className="shrink-0 opacity-70 hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Active Recording Telemetry Bar */}
          {listening && (
            <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-[#FF3B1F]/45 bg-[#FF3B1F]/10 px-3.5 py-2.5">
              <div className="flex items-center gap-2.5">
                <Radio className="h-4 w-4 animate-pulse text-[#FF6B54]" />
                <span className="font-mono text-xs font-semibold text-[#F4F3EF]">
                  {formatDuration(recordingSeconds)}
                </span>
                <div className="flex h-5 items-end gap-0.5" aria-hidden="true">
                  {audioLevels.map((lvl, idx) => (
                    <span
                      key={idx}
                      className="w-1 rounded-full bg-[#FF6B54] transition-all duration-75"
                      style={{ height: `${Math.round(lvl * 20)}px` }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => cleanupRecording(true)}
                  className="cursor-pointer rounded-full border border-white/[0.14] bg-[#18181D] px-2.5 py-1 text-[11px] font-medium text-[#A1A1AA] hover:text-[#F4F3EF]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => cleanupRecording(false)}
                  className="cursor-pointer rounded-full bg-[#FF3B1F] px-3 py-1 text-[11px] font-semibold text-[#08080A] hover:bg-[#FF5238]"
                >
                  Send Voice
                </button>
              </div>
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
              disabled={transcribing || loading}
              onClick={() => void startVoiceCapture()}
              title={
                listening
                  ? "Stop recording & send"
                  : micMode === "studio"
                  ? "Record voice command (Gemini Studio AI)"
                  : "Start live browser dictation"
              }
              className={`flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                listening
                  ? "border-[#FF3B1F] bg-[#FF3B1F] text-[#08080A]"
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
                  ? micMode === "studio"
                    ? "Recording with Gemini Studio Mic... click Send Voice when done"
                    : "Listening live... speak naturally, click Send Voice when done"
                  : "Ask the AI to research, design a post with visuals/colors, approve, or run any admin task..."
              }
              className="flex-1 resize-none rounded-2xl border border-white/[0.12] bg-[#141418] px-4 py-2.5 text-sm text-[#F4F3EF] placeholder:text-[#71717A] focus:border-[#FF3B1F] focus:outline-none"
            />

            <button
              type="submit"
              disabled={loading || transcribing || !input.trim()}
              aria-label="Send message"
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

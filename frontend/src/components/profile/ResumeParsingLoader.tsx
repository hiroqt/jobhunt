"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface ResumeParsingLoaderProps {
  fileName?: string;
  fileSize?: number;
  uploadMode?: "file" | "paste";
  rawText?: string;
  provider?: string;
}

const PROVIDER_LABELS: Record<string, string> = {
  openrouter: "OpenRouter",
  gemini: "Google Gemini",
  nvidia: "NVIDIA NIM",
  glm: "Zhipu GLM",
  groq: "Groq",
  openai: "OpenAI",
  fallback: "Local Heuristic",
};

export const ResumeParsingLoader: React.FC<ResumeParsingLoaderProps> = ({
  fileName = "Resume_Document.pdf",
  fileSize,
  uploadMode = "file",
  rawText,
  provider = "openrouter",
}) => {
  const providerName = PROVIDER_LABELS[provider] || provider;

  const messages = [
    "Analyzing your resume...",
    uploadMode === "file"
      ? `Extracting text layers from ${fileName}...`
      : "Parsing career history & timeline...",
    "Extracting technical skills & taxonomy...",
    "Calibrating target roles & compensation fit...",
    "Synthesizing master candidate profile...",
    "Finalizing profile updates...",
  ];

  const [messageIndex, setMessageIndex] = useState(0);
  const [fadeState, setFadeState] = useState<"in" | "out">("in");

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Fade out current message
      setFadeState("out");

      // 2. Switch message and fade in
      setTimeout(() => {
        setMessageIndex((prev) => (prev + 1) % messages.length);
        setFadeState("in");
      }, 400);
    }, 2200);

    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="w-full min-h-[70vh] py-20 px-4 flex flex-col items-center justify-center text-center space-y-6 select-none animate-in fade-in zoom-in-95 duration-300">
      {/* Subtle Ambient Pulse & Clean Spinner */}
      <div className="relative flex items-center justify-center">
        <div className="absolute w-24 h-24 bg-emerald-500/15 rounded-full blur-2xl animate-pulse" />
        <div className="relative w-12 h-12 rounded-full border border-border/80 flex items-center justify-center bg-card/90 shadow-xl">
          <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
        </div>
      </div>

      {/* Fading Sequential Text */}
      <div className="min-h-[48px] flex items-center justify-center px-4 max-w-lg">
        <p
          className={`text-xl sm:text-2xl font-medium text-foreground tracking-tight transition-all duration-400 ease-out transform ${
            fadeState === "in"
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 -translate-y-1.5 scale-95"
          }`}
        >
          {messages[messageIndex]}
        </p>
      </div>

      {/* Clean Metadata Info */}
      <p className="text-xs text-muted-foreground font-mono">
        {uploadMode === "file"
          ? `${fileName}${fileSize ? ` (${formatFileSize(fileSize)})` : ""} • `
          : rawText
          ? `${rawText.length} characters • `
          : ""}
        {providerName} AI Engine
      </p>
    </div>
  );
};

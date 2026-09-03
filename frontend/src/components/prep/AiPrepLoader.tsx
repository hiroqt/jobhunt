"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface AiPrepLoaderProps {
  jobTitle?: string;
  company?: string;
  provider?: string;
}

const PROVIDER_LABELS: Record<string, string> = {
  openrouter: "OpenRouter",
  gemini: "Google Gemini",
  nvidia: "NVIDIA NIM",
  glm: "Zhipu GLM",
  groq: "Groq",
  openai: "OpenAI",
  ollama: "Local Ollama",
  fallback: "Local Heuristic",
};

export const AiPrepLoader: React.FC<AiPrepLoaderProps> = ({
  jobTitle,
  company,
  provider = "openrouter",
}) => {
  const providerName = PROVIDER_LABELS[provider] || provider;

  const messages = [
    "Analyzing job description & role requirements...",
    jobTitle ? `Deconstructing architecture patterns for ${jobTitle}...` : "Identifying required technical concepts & stack...",
    "Generating scenario-based technical questions...",
    "Formulating STAR behavioral interview frameworks...",
    "Crafting high-signal reverse questions for the interviewer...",
    "Finalizing your AI interview preparation kit...",
  ];

  const [messageIndex, setMessageIndex] = useState(0);
  const [fadeState, setFadeState] = useState<"in" | "out">("in");

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
    <div className="w-full py-16 px-4 flex flex-col items-center justify-center text-center space-y-6 select-none min-h-[300px] animate-in fade-in duration-300">
      {/* Subtle Ambient Pulse & Clean Spinner */}
      <div className="relative flex items-center justify-center">
        <div className="absolute w-20 h-20 bg-emerald-500/15 rounded-full blur-xl animate-pulse" />
        <div className="relative w-12 h-12 rounded-full border border-border/80 flex items-center justify-center bg-card/90 shadow-xl">
          <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
        </div>
      </div>

      {/* Fading Sequential Text */}
      <div className="min-h-[48px] flex items-center justify-center px-4 max-w-xl">
        <p
          className={`text-xl sm:text-2xl font-medium text-zinc-100 tracking-tight transition-all duration-400 ease-out transform ${
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
        {jobTitle ? `${jobTitle}${company ? ` @ ${company}` : ""} • ` : ""}
        {providerName} AI Engine
      </p>
    </div>
  );
};

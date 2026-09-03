"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface JobQualifyingLoaderProps {
  url?: string;
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
  ollama: "Local Ollama",
  fallback: "Local Heuristic",
};

function getUrlDomain(urlString?: string): string {
  if (!urlString) return "";
  try {
    const parsed = new URL(urlString);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return urlString.length > 25 ? `${urlString.substring(0, 25)}...` : urlString;
  }
}

export const JobQualifyingLoader: React.FC<JobQualifyingLoaderProps> = ({
  url,
  rawText,
  provider = "openrouter",
}) => {
  const providerName = PROVIDER_LABELS[provider] || provider;
  const domain = getUrlDomain(url);

  const messages = [
    "Analyzing the job...",
    domain
      ? `Extracting requirements from ${domain}...`
      : "Extracting core duties & seniority level...",
    "Parsing required tech stack & qualifications...",
    "Comparing requirements against your skill profile...",
    "Calculating fit score & interview recommendations...",
    "Finalizing qualification report...",
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
    <div className="w-full py-14 px-4 flex flex-col items-center justify-center text-center space-y-6 select-none min-h-[220px]">
      {/* Subtle Ambient Pulse & Clean Spinner */}
      <div className="relative flex items-center justify-center">
        <div className="absolute w-20 h-20 bg-emerald-500/15 rounded-full blur-xl animate-pulse" />
        <div className="relative w-11 h-11 rounded-full border border-border/80 flex items-center justify-center bg-card/90 shadow-lg">
          <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
        </div>
      </div>

      {/* Fading Sequential Text */}
      <div className="min-h-[44px] flex items-center justify-center px-4">
        <p
          className={`text-lg sm:text-xl font-medium text-foreground tracking-tight transition-all duration-400 ease-out transform ${
            fadeState === "in"
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 -translate-y-1.5 scale-95"
          }`}
        >
          {messages[messageIndex]}
        </p>
      </div>

      {/* Clean Subtitle Info */}
      <p className="text-xs text-muted-foreground font-mono">
        {domain ? `${domain} • ` : rawText ? "Raw Text • " : ""}
        {providerName} AI Engine
      </p>
    </div>
  );
};

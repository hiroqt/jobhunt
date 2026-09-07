"use client";

import React, { useEffect, useState } from "react";
import {
  useOnboarding,
  ONBOARDING_STEPS,
} from "@/context/OnboardingContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppLogo } from "@/components/layout/AppLogo";
import {
  ArrowRight01Icon as ArrowRight,
  ArrowLeft01Icon as ArrowLeft,
  CheckmarkCircle02Icon as CheckCircle2,
  LinkSquare01Icon as ExternalLink,
  Cancel01Icon as X,
  SourceCodeIcon as Code2,
  Compass01Icon as Compass,
  Tick02Icon as Check,
  CursorPointer01Icon as MousePointerClick,
  ArrowDown01Icon as ChevronDown,
  ArrowUp01Icon as ChevronUp
} from "hugeicons-react";
import { GoodLuckModal } from "@/components/layout/GoodLuckModal";
import { TikTokIcon, GitHubIcon } from "@/components/layout/SocialIcons";
import { cn } from "@/lib/utils";

export const TourGuide: React.FC = () => {
  const {
    isOpen,
    isGoodLuckOpen,
    closeGoodLuckModal,
    currentStepIndex,
    currentStep,
    startTour,
    nextStep,
    prevStep,
    skipStep,
    jumpToStep,
    closeTour,
    completeTour,
  } = useOnboarding();

  const [isMinimized, setIsMinimized] = useState(false);

  const isWelcome = currentStepIndex === 0;

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        nextStep();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevStep();
      } else if (e.key === "Escape") {
        closeTour();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, nextStep, prevStep, closeTour]);

  if (!isOpen && !isGoodLuckOpen) return null;

  return (
    <>
      {/* ────────────────────────────────────────────────────────── */}
      {/* GOOD LUCK SUCCESS CELEBRATION MODAL */}
      {/* ────────────────────────────────────────────────────────── */}
      <GoodLuckModal
        isOpen={isGoodLuckOpen}
        onClose={closeGoodLuckModal}
      />

      {/* ────────────────────────────────────────────────────────── */}
      {/* STEP 0: WELCOME & DEVELOPER INTRO MODAL */}
      {/* ────────────────────────────────────────────────────────── */}
      {isOpen && isWelcome && (
        <Dialog open={isOpen && isWelcome} onOpenChange={(open) => !open && closeTour()}>
          <DialogContent
            className="max-w-xl sm:max-w-2xl w-[calc(100vw-1.5rem)] max-h-[90vh] flex flex-col p-4 sm:p-6 overflow-hidden rounded-2xl border border-border shadow-2xl bg-card"
            aria-label="Welcome to sakto ka"
          >
            <DialogHeader className="border-b border-border/70 pb-3 shrink-0">
              <div className="flex items-center gap-3">
                <AppLogo size="md" />
                <div>
                  <div className="flex items-center gap-2">
                    <DialogTitle className="text-base sm:text-lg font-bold text-foreground capitalize">
                      Welcome to sakto ka
                    </DialogTitle>
                    <Badge variant="secondary" className="text-[10px] font-mono py-0 h-4">
                      v1.0
                    </Badge>
                  </div>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Career Application & Interview Intelligence System
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="py-3 text-xs overflow-y-auto flex-1 min-h-0 space-y-3.5 pr-0.5">
              {/* Introduction Text */}
              <p className="text-xs text-foreground/90 leading-relaxed">
                <strong>sakto ka</strong> connects candidate profiling, multi-source background crawling, real-time qualification scoring (0–100%), structured STAR interview prep, and ATS-tailored resume generation.
              </p>

              {/* Developer Attribution Card with Social Media */}
              <div className="p-3.5 rounded-xl border border-border bg-muted/30 space-y-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                    <Code2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-semibold text-foreground truncate">
                        Developed by Arnel Baylon
                      </span>
                      <Badge variant="outline" className="text-[10px] font-mono py-0 h-4">
                        @hiroqt
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Lead Architect & Full-Stack AI Engineer
                    </p>
                  </div>
                </div>

                {/* Social Media Links */}
                <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-border/50">
                  <a
                    href="https://www.tiktok.com/@yheelllls"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-foreground hover:text-primary px-2.5 py-1 rounded-md border border-border bg-background hover:bg-muted transition-colors shadow-xs"
                  >
                    <TikTokIcon className="w-3.5 h-3.5 shrink-0" />
                    <span>TikTok: @yheelllls</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </a>

                  <a
                    href="https://github.com/hiroqt"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-foreground hover:text-primary px-2.5 py-1 rounded-md border border-border bg-background hover:bg-muted transition-colors shadow-xs"
                  >
                    <GitHubIcon className="w-3.5 h-3.5 text-foreground shrink-0" />
                    <span>GitHub: @hiroqt</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </a>
                </div>
              </div>

              {/* What It Does Cards */}
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Core Capabilities
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {currentStep.highlights.map((h, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl border border-border bg-card space-y-1 flex flex-col justify-start"
                    >
                      <span className="font-semibold text-foreground text-xs">{h.title}</span>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {h.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-border/70 flex items-center justify-end gap-2 text-xs shrink-0 mt-auto">
              <Button
                type="button"
                variant="default"
                size="default"
                onClick={startTour}
                className="w-full sm:w-auto text-xs font-semibold h-9 px-5 gap-2 shadow-sm bg-primary text-primary-foreground"
              >
                <span>Start Guided Walkthrough</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* STEPS 1–5: MOBILE-RESPONSIVE INTERACTIVE FLOATING BAR */}
      {/* ────────────────────────────────────────────────────────── */}
      {isOpen && !isWelcome && (
        <aside
          role="region"
          aria-label="Interactive Tour Guide"
          className="fixed bottom-3 sm:bottom-5 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-xl z-50 animate-in slide-in-from-bottom-5 duration-200"
        >
          <div className="bg-card/95 dark:bg-zinc-900/95 backdrop-blur-md border border-border/90 shadow-2xl rounded-2xl p-3.5 sm:p-4 space-y-3">
            {/* Header: Step info, Quick Nav Pills, Minimize Arrow & Close */}
            <div
              className={cn(
                "flex items-center justify-between gap-2 transition-all",
                !isMinimized && "border-b border-border/60 pb-2.5"
              )}
            >
              <div
                className="flex items-center gap-2 min-w-0 cursor-pointer select-none"
                onClick={() => isMinimized && setIsMinimized(false)}
                title={isMinimized ? "Click to expand walkthrough" : undefined}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shrink-0">
                  {currentStep.stepNumber}
                </span>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-bold text-xs sm:text-sm text-foreground truncate">
                    {currentStep.title}
                  </span>
                  {isMinimized && (
                    <span className="text-[10px] text-muted-foreground hidden sm:inline-block">
                      (Click to expand)
                    </span>
                  )}
                </div>
              </div>

              {/* Step Jump Dots (1-5) & Window Controls */}
              <div className="flex items-center gap-1 shrink-0">
                {ONBOARDING_STEPS.slice(1).map((s, idx) => {
                  const stepNum = idx + 1;
                  const isCurrent = stepNum === currentStepIndex;
                  const isDone = stepNum < currentStepIndex;

                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => jumpToStep(stepNum)}
                      className={cn(
                        "h-5 px-1.5 rounded text-[10px] font-bold font-mono transition-colors flex items-center justify-center",
                        isCurrent
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : isDone
                          ? "bg-muted text-foreground hover:bg-muted/80"
                          : "bg-transparent text-muted-foreground hover:bg-muted/50"
                      )}
                      title={`Jump to Step ${stepNum}: ${s.title}`}
                    >
                      {isDone ? <Check className="w-2.5 h-2.5 text-emerald-500" /> : stepNum}
                    </button>
                  );
                })}

                {/* Minimize Arrow Down / Expand Arrow Up Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMinimized((prev) => !prev)}
                  className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground rounded-md shrink-0"
                  title={isMinimized ? "Expand Walkthrough" : "Minimize Walkthrough"}
                >
                  {isMinimized ? (
                    <ChevronUp className="w-4 h-4 text-primary" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>

                {/* Close Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeTour}
                  className="h-6 w-6 text-muted-foreground hover:text-foreground rounded-md shrink-0"
                  title="Close Walkthrough"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Collapsible Body (Hidden when minimized) */}
            {!isMinimized && (
              <>
                {/* Active Action Callout */}
            <div className="p-2.5 sm:p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-start gap-2.5 text-xs space-y-1">
              <div className="relative flex h-2.5 w-2.5 shrink-0 mt-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
              </div>
              <div className="min-w-0 space-y-1.5 flex-1">
                <p className="font-bold text-foreground text-xs leading-snug">
                  {currentStep.actionInstruction}
                </p>
                {currentStepIndex === 1 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 font-semibold text-[10px]">
                      📁 Upload Dropzone (Left)
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-600 dark:text-purple-400 font-semibold text-[10px]">
                      ⚙️ Extraction Model (Right)
                    </span>
                  </div>
                )}
                {currentStepIndex === 2 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-600 dark:text-purple-400 font-semibold text-[10px]">
                      ➕ 1. Click '+ New Search'
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 font-semibold text-[10px]">
                      📝 2. Configure Role & Portals
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">
                      💾 3. Save Configuration
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-semibold text-[10px]">
                      ⚡ 4. Click 'Discover Now'
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 font-semibold text-[10px]">
                      👀 5. 'View Discovered Jobs' ➔ Step 3
                    </span>
                  </div>
                )}
                {currentStepIndex === 3 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">
                      🎯 1. 0–100% Fit Scores
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 font-semibold text-[10px]">
                      📋 2. Pipeline Tracking
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-600 dark:text-purple-400 font-semibold text-[10px]">
                      🔍 3. Inspect Discovered Jobs
                    </span>
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground leading-normal">
                  {currentStep.subtitle}
                </p>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={skipStep}
                className="text-xs text-muted-foreground hover:text-foreground h-8 px-2.5"
              >
                Skip Step
              </Button>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={prevStep}
                  className="text-xs font-semibold h-8 px-2.5 sm:px-3 gap-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Back</span>
                </Button>

                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={nextStep}
                  className="text-xs font-semibold h-8 px-3 sm:px-4 gap-1.5 shadow-sm bg-primary text-primary-foreground"
                >
                  {currentStepIndex === ONBOARDING_STEPS.length - 1 ? (
                    <>
                      <span>Finish</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </>
                  ) : (
                    <>
                      <span>Next Step</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </aside>
    )}
    </>
  );
};

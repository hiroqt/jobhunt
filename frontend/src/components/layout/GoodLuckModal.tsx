"use client";

import React from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PartyIcon as PartyPopper,
  CheckmarkCircle02Icon as CheckCircle2,
  ArrowRight01Icon as ArrowRight,
  ChartRadarIcon as Radar,
  File01Icon as FileText,
  AiChat01Icon as Bot,
  Compass01Icon as Compass,
  DashboardSquare01Icon as LayoutDashboard,
  Target01Icon as Target,
  FlashIcon as Zap
} from "hugeicons-react";

interface GoodLuckModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoodLuckModal: React.FC<GoodLuckModalProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-lg sm:max-w-xl w-[calc(100vw-1.5rem)] max-h-[90dvh] flex flex-col p-4 sm:p-6 overflow-hidden rounded-2xl border border-border shadow-2xl bg-card text-foreground"
        aria-label="Good Luck on Your Job Hunt"
      >
        {/* Header with celebratory icon & badges */}
        <DialogHeader className="border-b border-border/70 pb-3 sm:pb-4 shrink-0">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-br from-amber-500/20 via-primary/20 to-emerald-500/20 border border-primary/30 flex items-center justify-center text-primary shadow-sm shrink-0">
              <PartyPopper className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
            </div>
            <div className="min-w-0 flex-1 pr-6 sm:pr-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-1">
                <Badge
                  variant="secondary"
                  className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1 text-[10px] sm:text-xs font-semibold py-0.5 px-2"
                >
                  <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>Onboarding Completed</span>
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono border-primary/30 text-primary py-0"
                >
                  sakto ka Ready
                </Badge>
              </div>
              <DialogTitle className="text-base sm:text-xl font-bold tracking-tight text-foreground">
                Good Luck on Your Job Hunt! 🚀
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5 leading-relaxed">
                You&apos;ve completed the full walkthrough! Your career copilot is primed to discover roles, optimize your ATS resume, and prepare structured interview answers.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Body: Unlocked Pipeline Overview */}
        <div className="py-2.5 sm:py-3 text-xs overflow-y-auto flex-1 min-h-0 space-y-3 sm:space-y-3.5 pr-0.5 overscroll-contain">
          <p className="text-xs font-medium text-foreground">
            Here is your active career intelligence toolkit:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
            <div className="p-3 rounded-xl border border-border/80 bg-muted/30 space-y-1">
              <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                <Radar className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                <span>1. Discover a Job</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Multi-portal scraping across LinkedIn, Indeed, JobStreet PH, Kalibrr &amp; RemoteOK.
              </p>
            </div>

            <div className="p-3 rounded-xl border border-border/80 bg-muted/30 space-y-1">
              <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                <Compass className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>2. 0–100% Fit Scoring</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Instant candidate skill alignment, gap analysis, and expired posting verification.
              </p>
            </div>

            <div className="p-3 rounded-xl border border-border/80 bg-muted/30 space-y-1">
              <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                <FileText className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>3. ATS Resume Studio</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Single-column standard layout with XYZ metric bullets engineered for Workday &amp; Greenhouse.
              </p>
            </div>

            <div className="p-3 rounded-xl border border-border/80 bg-muted/30 space-y-1">
              <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                <Bot className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>4. STAR AI Prep Coach</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Simulated role-specific technical scenarios and structured behavioral answers.
              </p>
            </div>
          </div>

          {/* Pro Strategy Callout */}
          <div className="p-3 sm:p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
              <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Winning Strategy</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Trigger <strong>Discover a Job</strong> daily, tailor 2–3 keyword gaps for each target application, and review your STAR notes before calls. Consistency always wins!
            </p>
          </div>
        </div>

        {/* Action Buttons (Mobile: stacked full width; Desktop: horizontal) */}
        <div className="pt-3 border-t border-border/70 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            asChild
            onClick={onClose}
            className="w-full sm:w-auto text-xs font-semibold h-9 sm:h-10 order-2 sm:order-1"
          >
            <Link href="/">
              <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" />
              <span>Go to Dashboard</span>
            </Link>
          </Button>

          <Button
            type="button"
            variant="default"
            size="sm"
            asChild
            onClick={onClose}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold h-9 sm:h-10 shadow-sm gap-1.5 order-1 sm:order-2"
          >
            <Link href="/searches">
              <Radar className="w-3.5 h-3.5" />
              <span>Discover a Job Now</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

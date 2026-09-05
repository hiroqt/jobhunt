"use client";

import React, { useState } from "react";
import {
  HelpCircle,
  BookOpen,
  Compass,
  Sparkles,
  KanbanSquare,
  GraduationCap,
  UserCheck,
  CheckCircle2,
  Clock,
  Search,
  ExternalLink,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface GuidelinesModalProps {
  customTrigger?: React.ReactNode;
  defaultOpen?: boolean;
}

export const GuidelinesModal: React.FC<GuidelinesModalProps> = ({
  customTrigger,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [activeTab, setActiveTab] = useState<
    "discovery" | "matching" | "pipeline" | "aiprep" | "profile"
  >("discovery");

  const tabs = [
    { id: "discovery", label: "Discovery", icon: Compass },
    { id: "matching", label: "Matching (0-100%)", icon: Sparkles },
    { id: "pipeline", label: "Pipeline", icon: KanbanSquare },
    { id: "aiprep", label: "AI Prep (STAR)", icon: GraduationCap },
    { id: "profile", label: "Profile", icon: UserCheck },
  ] as const;

  return (
    <>
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            {customTrigger ? (
              <div onClick={() => setIsOpen(true)}>{customTrigger}</div>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(true)}
                className="h-10 w-10 text-muted-foreground hover:text-foreground relative rounded-lg"
                aria-label="Guidelines & Best Practices"
              >
                <HelpCircle className="w-4 h-4" />
              </Button>
            )}
          </TooltipTrigger>
          <TooltipContent side="bottom" align="center" className="max-w-xs text-center font-normal">
            <p className="font-semibold text-foreground">Guidelines & Best Practices</p>
            <p className="text-[11px] text-muted-foreground">Click to open user guide.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl sm:max-w-3xl w-[calc(100vw-1.5rem)] sm:w-full p-4 sm:p-6 overflow-hidden rounded-2xl border border-border shadow-2xl bg-card">
          <DialogHeader className="border-b border-border/70 pb-3 space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-base sm:text-lg font-bold text-foreground capitalize leading-none">
                    sakto ka Guidelines
                  </DialogTitle>
                  <Badge variant="secondary" className="text-[10px] font-mono py-0 h-4">
                    User Playbook
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Best practices for high-signal discovery, qualification, and interview preparation.
                </DialogDescription>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 scrollbar-none">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </DialogHeader>

          {/* Tab Contents - Compact and Non-Scrollable */}
          <div className="py-2.5 text-xs min-h-[220px] flex flex-col justify-center">
            {activeTab === "discovery" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 animate-in fade-in duration-150">
                <div className="p-3 rounded-xl border border-border bg-muted/30 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Targeted Keyword Queries</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Use exact titles like <em>"Senior Full Stack Engineer"</em> or <em>"React Architect"</em> under Automated Searches for higher accuracy.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-border bg-muted/30 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground text-xs">
                    <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>1-Week Freshness Span</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Postings from the last 7 days receive priority matching to ensure listings are actively hiring.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-border bg-muted/30 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground text-xs">
                    <Search className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>Live ATS Link Verification</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Click <strong>Verify Link</strong> in Job Explorer to ping company career endpoints and detect expired openings.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-border bg-muted/30 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground text-xs">
                    <ExternalLink className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Direct Job Capture</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Click <strong>Add Job URL</strong> to automatically parse requirements and score compensation fit from any link.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "matching" && (
              <div className="space-y-2 animate-in fade-in duration-150">
                <div className="p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-start gap-2.5">
                  <Badge variant="success" className="font-mono text-[10px] shrink-0 mt-0.5">
                    APPLY (80–100%)
                  </Badge>
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-foreground">High Fit — Immediate Application Priority</p>
                    <p className="text-[11px] text-muted-foreground">You meet all mandatory skill requirements and compensation matches your target criteria.</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-start gap-2.5">
                  <Badge variant="outline" className="font-mono text-[10px] shrink-0 mt-0.5 text-amber-600 dark:text-amber-400 border-amber-500/40">
                    REVIEW (60–79%)
                  </Badge>
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-foreground">Borderline — Inspect Skill Gaps</p>
                    <p className="text-[11px] text-muted-foreground">You match core technologies but may lack 1-2 secondary qualifications or tenure.</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 flex items-start gap-2.5">
                  <Badge variant="destructive" className="font-mono text-[10px] shrink-0 mt-0.5">
                    SKIP (&lt;60%)
                  </Badge>
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-foreground">Low Fit — Heavy Requirements Gap</p>
                    <p className="text-[11px] text-muted-foreground">Critical competencies or required frameworks are missing from your candidate profile.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "pipeline" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 animate-in fade-in duration-150">
                <div className="p-2.5 rounded-lg border border-border bg-card">
                  <p className="font-semibold text-foreground text-xs">1. Wishlist</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Bookmarked roles under evaluation.</p>
                </div>
                <div className="p-2.5 rounded-lg border border-border bg-card">
                  <p className="font-semibold text-foreground text-xs">2. Applied</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Submitted with 5-day follow-up reminder.</p>
                </div>
                <div className="p-2.5 rounded-lg border border-border bg-card">
                  <p className="font-semibold text-foreground text-xs">3. Screening</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Recruiter phone screen or quick assessment.</p>
                </div>
                <div className="p-2.5 rounded-lg border border-border bg-card">
                  <p className="font-semibold text-foreground text-xs">4. Interviewing</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Live technical rounds and architecture loops.</p>
                </div>
                <div className="p-2.5 rounded-lg border border-border bg-card">
                  <p className="font-semibold text-foreground text-xs">5. Offer</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Compensation review and negotiation.</p>
                </div>
                <div className="p-2.5 rounded-lg border border-border bg-card">
                  <p className="font-semibold text-foreground text-xs">6. Archived</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Recorded for analytics insights.</p>
                </div>
              </div>
            )}

            {activeTab === "aiprep" && (
              <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 space-y-2 animate-in fade-in duration-150">
                <p className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-primary" />
                  <span>STAR Interview Framework Formula</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                  <div className="p-2 rounded-md bg-background/80 border border-border/50">
                    <strong className="text-foreground">S - Situation:</strong> Context and technical challenge.
                  </div>
                  <div className="p-2 rounded-md bg-background/80 border border-border/50">
                    <strong className="text-foreground">T - Task:</strong> Your direct responsibility in the project.
                  </div>
                  <div className="p-2 rounded-md bg-background/80 border border-border/50">
                    <strong className="text-foreground">A - Action:</strong> Tools, architecture, and code you executed.
                  </div>
                  <div className="p-2 rounded-md bg-background/80 border border-border/50">
                    <strong className="text-foreground">R - Result:</strong> Concrete metric, latency win, or ROI.
                  </div>
                </div>
              </div>
            )}

            {activeTab === "profile" && (
              <div className="space-y-2 animate-in fade-in duration-150">
                <div className="flex items-start gap-2.5 p-2 rounded-lg border border-border bg-card text-xs">
                  <span className="font-bold text-primary text-xs">1.</span>
                  <p className="text-[11px] text-muted-foreground"><strong className="text-foreground">Verified Skills:</strong> Add specific libraries and cloud tools (e.g. Next.js, Docker, PostgreSQL) for high match scores.</p>
                </div>
                <div className="flex items-start gap-2.5 p-2 rounded-lg border border-border bg-card text-xs">
                  <span className="font-bold text-primary text-xs">2.</span>
                  <p className="text-[11px] text-muted-foreground"><strong className="text-foreground">Target Salary:</strong> Define your minimum compensation threshold to filter out low-paying roles.</p>
                </div>
                <div className="flex items-start gap-2.5 p-2 rounded-lg border border-border bg-card text-xs">
                  <span className="font-bold text-primary text-xs">3.</span>
                  <p className="text-[11px] text-muted-foreground"><strong className="text-foreground">Workplace Fit:</strong> Select Remote, Hybrid, or Onsite preferences to calibrate job qualification.</p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2.5 border-t border-border/70 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Press <kbd className="font-mono bg-muted px-1 py-0.5 rounded border border-border text-[10px]">Esc</kbd> to close</span>
            <Button onClick={() => setIsOpen(false)} variant="default" size="sm" className="font-semibold text-xs h-7 px-3.5">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

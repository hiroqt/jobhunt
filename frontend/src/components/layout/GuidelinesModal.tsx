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
  AlertCircle,
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
    { id: "discovery", label: "Discovery & Scraping", icon: Compass },
    { id: "matching", label: "Match Engine (0-100%)", icon: Sparkles },
    { id: "pipeline", label: "Pipeline & Kanban", icon: KanbanSquare },
    { id: "aiprep", label: "AI Prep & STAR Method", icon: GraduationCap },
    { id: "profile", label: "Profile Optimization", icon: UserCheck },
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
            <p className="text-[11px] text-muted-foreground">Click to open the comprehensive user workflow and matching manual.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto p-6 sm:p-7">
          <DialogHeader className="border-b border-border/70 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-lg sm:text-xl font-bold text-foreground capitalize">
                    sakto ka Guidelines
                  </DialogTitle>
                  <Badge variant="secondary" className="text-[10px] font-mono">
                    User Playbook
                  </Badge>
                </div>
                <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Best practices for high-signal automated discovery, precise qualification, and technical interview mastery.
                </DialogDescription>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-4 pb-0.5 scrollbar-none">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0",
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

          {/* Tab Contents */}
          <div className="py-3 text-sm space-y-4">
            {activeTab === "discovery" && (
              <div className="space-y-3.5 animate-in fade-in duration-150">
                <div className="p-4 rounded-xl bg-muted/40 border border-border/80 space-y-2">
                  <h4 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                    <Compass className="w-4 h-4 text-primary" />
                    Automated Discovery Strategies
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Set up keyword queries under <strong>Automated Searches</strong>. Our crawler checks LinkedIn, Indeed, JobStreet, RemoteOK, and company career portals.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl border border-border bg-card space-y-1.5">
                    <div className="flex items-center gap-2 font-semibold text-xs text-foreground">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Specific Role Keywords
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Use precise titles like <em>"Senior Full Stack Engineer"</em> or <em>"React TypeScript Architect"</em> rather than generic terms.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-border bg-card space-y-1.5">
                    <div className="flex items-center gap-2 font-semibold text-xs text-foreground">
                      <Clock className="w-4 h-4 text-primary" />
                      1-Week Freshness Span
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Jobs posted within 7 days receive priority matching. Automated freshness indicators warn you if a posting may have expired.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-border bg-card space-y-1.5">
                    <div className="flex items-center gap-2 font-semibold text-xs text-foreground">
                      <Search className="w-4 h-4 text-indigo-500" />
                      Live Posting Verification
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Click <strong>Verify Link</strong> in Job Explorer to ping the ATS source endpoint and confirm the opening is still accepting candidates.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-border bg-card space-y-1.5">
                    <div className="flex items-center gap-2 font-semibold text-xs text-foreground">
                      <ExternalLink className="w-4 h-4 text-amber-500" />
                      Direct URL Capture
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Found a job elsewhere? Click <strong>Add Job URL</strong> to instantly extract requirements, salary bounds, and match against your resume.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "matching" && (
              <div className="space-y-3.5 animate-in fade-in duration-150">
                <div className="p-4 rounded-xl bg-muted/40 border border-border/80 space-y-2">
                  <h4 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                    <Sparkles className="w-4 h-4 text-primary" />
                    How Match Scores Are Calculated
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    The qualifying engine cross-references job requirements against your candidate profile across skills, experience seniority, and salary brackets.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-start gap-3">
                    <Badge variant="success" className="font-mono text-xs shrink-0 mt-0.5">
                      APPLY (80–100%)
                    </Badge>
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-foreground">High Fit — Immediate Application Priority</p>
                      <p className="text-xs text-muted-foreground">You meet all mandatory skills and the compensation/location matches your target criteria.</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-start gap-3">
                    <Badge variant="outline" className="font-mono text-xs shrink-0 mt-0.5 text-amber-600 dark:text-amber-400 border-amber-500/40">
                      REVIEW (60–79%)
                    </Badge>
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-foreground">Borderline — Inspect Missing Requirements</p>
                      <p className="text-xs text-muted-foreground">You match core technologies but may lack 1-2 secondary qualifications or years of tenure.</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/5 flex items-start gap-3">
                    <Badge variant="destructive" className="font-mono text-xs shrink-0 mt-0.5">
                      SKIP (&lt;60%)
                    </Badge>
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-foreground">Low Fit — Heavy Skill Gap</p>
                      <p className="text-xs text-muted-foreground">Critical required competencies are absent from your current profile or tech stack.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "pipeline" && (
              <div className="space-y-3.5 animate-in fade-in duration-150">
                <div className="p-4 rounded-xl bg-muted/40 border border-border/80 space-y-2">
                  <h4 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                    <KanbanSquare className="w-4 h-4 text-primary" />
                    Managing the 6 Pipeline Stages
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Track every opportunity from initial bookmark to signed offer with automatic follow-up reminders.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-3 rounded-lg border border-border bg-card">
                    <p className="font-semibold text-foreground">1. Wishlist / Saved</p>
                    <p className="text-muted-foreground mt-1">Bookmarked positions under review before applying.</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border bg-card">
                    <p className="font-semibold text-foreground">2. Applied</p>
                    <p className="text-muted-foreground mt-1">Application submitted. Automatic 5-day follow-up scheduled.</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border bg-card">
                    <p className="font-semibold text-foreground">3. Screening</p>
                    <p className="text-muted-foreground mt-1">Initial recruiter call or asynchronous assessment.</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border bg-card">
                    <p className="font-semibold text-foreground">4. Interviewing</p>
                    <p className="text-muted-foreground mt-1">Technical rounds, live coding, and hiring manager loops.</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border bg-card">
                    <p className="font-semibold text-foreground">5. Offer Received</p>
                    <p className="text-muted-foreground mt-1">Compensation negotiation and decision phase.</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border bg-card">
                    <p className="font-semibold text-foreground">6. Archived / Rejected</p>
                    <p className="text-muted-foreground mt-1">Logged for conversion rate and analytics intelligence.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "aiprep" && (
              <div className="space-y-3.5 animate-in fade-in duration-150">
                <div className="p-4 rounded-xl bg-muted/40 border border-border/80 space-y-2">
                  <h4 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    AI Interview Prep & STAR Framework
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Generate customized interview battle plans and practice behavioral questions tailored specifically to each role's requirements.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 space-y-2 text-xs">
                  <p className="font-semibold text-foreground">The STAR Response Formula:</p>
                  <ul className="space-y-1 text-muted-foreground pl-3 list-disc">
                    <li><strong className="text-foreground">S - Situation:</strong> Set the scene and provide necessary context for the challenge.</li>
                    <li><strong className="text-foreground">T - Task:</strong> Describe your specific responsibility in that scenario.</li>
                    <li><strong className="text-foreground">A - Action:</strong> Explain the exact technical steps, trade-offs, and tools you executed.</li>
                    <li><strong className="text-foreground">R - Result:</strong> Conclude with measurable impact, performance gains, or latency reductions.</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === "profile" && (
              <div className="space-y-3.5 animate-in fade-in duration-150">
                <div className="p-4 rounded-xl bg-muted/40 border border-border/80 space-y-2">
                  <h4 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                    <UserCheck className="w-4 h-4 text-primary" />
                    Candidate Profile Best Practices
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Keep your profile updated under the <strong>Candidate Profile</strong> section to maximize match score accuracy across all crawlers.
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2 p-2.5 rounded-lg border border-border bg-card">
                    <span className="font-bold text-primary">1.</span>
                    <p className="text-muted-foreground"><strong className="text-foreground">Skills List:</strong> Include specific libraries, cloud providers, and databases (e.g. Next.js, PostgreSQL, Docker, AWS).</p>
                  </div>
                  <div className="flex items-start gap-2 p-2.5 rounded-lg border border-border bg-card">
                    <span className="font-bold text-primary">2.</span>
                    <p className="text-muted-foreground"><strong className="text-foreground">Target Salary:</strong> Define your minimum acceptable threshold to filter out low-compensating roles automatically.</p>
                  </div>
                  <div className="flex items-start gap-2 p-2.5 rounded-lg border border-border bg-card">
                    <span className="font-bold text-primary">3.</span>
                    <p className="text-muted-foreground"><strong className="text-foreground">Workplace Preference:</strong> Specify Remote, Hybrid, or Onsite to calibrate the fit recommendation engine.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-border/70 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              Tip: Press <kbd className="font-mono bg-muted px-1.5 py-0.5 rounded border border-border text-[10px]">Esc</kbd> anytime to close this guide.
            </span>
            <Button onClick={() => setIsOpen(false)} variant="default" size="sm" className="font-semibold text-xs px-4">
              Close Guide
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

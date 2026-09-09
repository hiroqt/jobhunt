"use client";

import React, { useState, useEffect } from "react";
import {
  File01Icon as FileText,
  LinkSquare01Icon as ExternalLink,
  Briefcase01Icon as Briefcase,
  Loading03Icon as Loader2,
  Tick02Icon as Check,
  Alert02Icon as AlertTriangle,
  Building02Icon as Building2,
  MapPinIcon as MapPin,
  Globe02Icon as Globe,
  FlashIcon as Zap,
  AiChat01Icon as Bot,
  BookmarkCheck01Icon as BookmarkCheck,
  Cancel01Icon as X,
  ArrowRight01Icon as ArrowRight,
  SlidersHorizontalIcon as Sliders,
  CheckmarkCircle02Icon as CheckCircle2,
  RefreshIcon as RefreshCw
} from "hugeicons-react";
import { Job } from "@/types";
import { extractAndAnalyzeJob, getJobs, saveJob, createApplication } from "@/lib/api";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MatchScoreBadge } from "@/components/jobs/MatchScoreBadge";
import { CoverLetterGenerator } from "@/components/jobs/CoverLetterGenerator";
import { cn } from "@/lib/utils";

interface CoverLetterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  initialJob?: Job | null;
  initialUrl?: string;
  onJobExtracted?: (job: Job) => void;
}

export const CoverLetterSidebar: React.FC<CoverLetterSidebarProps> = ({
  isOpen,
  onClose,
  initialJob,
  initialUrl = "",
  onJobExtracted,
}) => {
  // Tabs: "link" (curate from provided link) or "job" (curate from selected pipeline job)
  const [activeTab, setActiveTab] = useState<"link" | "job">("link");

  // Link Curate State
  const [url, setUrl] = useState(initialUrl);
  const [rawText, setRawText] = useState("");
  const [showRawText, setShowRawText] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("openrouter");
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractedJob, setExtractedJob] = useState<Job | null>(null);
  const [savedToPipeline, setSavedToPipeline] = useState(false);
  const [savingPipeline, setSavingPipeline] = useState(false);

  // Active Job State
  const [pipelineJobs, setPipelineJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(initialJob || null);
  const [loadingPipeline, setLoadingPipeline] = useState(false);

  // Sync initial props whenever sidebar opens or props change
  useEffect(() => {
    if (isOpen) {
      if (initialJob) {
        setSelectedJob(initialJob);
        setActiveTab("job");
      } else if (initialUrl) {
        setUrl(initialUrl);
        setActiveTab("link");
      }
    }
  }, [isOpen, initialJob, initialUrl]);

  // Load pipeline jobs when sidebar opens for quick selection
  useEffect(() => {
    if (isOpen) {
      setLoadingPipeline(true);
      getJobs({ limit: 50 } as any)
        .then((jobs) => {
          setPipelineJobs(jobs);
          if (!selectedJob && jobs.length > 0) {
            setSelectedJob(jobs[0]);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingPipeline(false));
    }
  }, [isOpen]);

  const handleExtractAndCurate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = url.trim();
    const cleanText = rawText.trim();

    if (!cleanUrl && !cleanText) {
      setExtractError("Please provide a valid job URL or paste the job description text.");
      return;
    }

    setExtracting(true);
    setExtractError(null);
    setSavedToPipeline(false);

    try {
      const res = await extractAndAnalyzeJob(
        cleanUrl || undefined,
        cleanText || undefined,
        selectedProvider
      );
      setExtractedJob(res);
      if (onJobExtracted) {
        onJobExtracted(res);
      }
    } catch (err: any) {
      const msg = err.message || "Failed to analyze job link";
      setExtractError(msg);
      if (
        msg.toLowerCase().includes("login wall") ||
        msg.toLowerCase().includes("paste the job description") ||
        msg.toLowerCase().includes("bot challenge")
      ) {
        setShowRawText(true);
      }
    } finally {
      setExtracting(false);
    }
  };

  const handleSaveExtractedToPipeline = async () => {
    if (!extractedJob) return;
    setSavingPipeline(true);
    try {
      await createApplication({
        job_id: extractedJob.id,
        status: "WISHLIST",
        notes: `Extracted via Curated Cover Letter Studio from link. Match: ${extractedJob.match_score}%.`,
      });
      setSavedToPipeline(true);
    } catch (err: any) {
      alert(err.message || "Failed to save job to pipeline");
    } finally {
      setSavingPipeline(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl p-0 flex flex-col h-full bg-card"
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-border bg-card/95 backdrop-blur-xs shrink-0 space-y-3">
          <div className="flex items-center justify-between pr-8">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary text-primary-foreground shadow-xs">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <SheetTitle className="text-base sm:text-lg font-bold">
                  Curated Cover Letter Studio
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground">
                  ATS-optimized cover letters tailored to job requirements and your resume.
                </SheetDescription>
              </div>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/60">
            <button
              type="button"
              onClick={() => setActiveTab("link")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all",
                activeTab === "link"
                  ? "bg-card text-foreground shadow-xs border border-border/80"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ExternalLink className="w-3.5 h-3.5 text-primary" />
              <span>Curate with Link</span>
              {extractedJob && (
                <Badge variant="secondary" className="text-[10px] py-0 px-1 font-mono">
                  Loaded
                </Badge>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("job")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all",
                activeTab === "job"
                  ? "bg-card text-foreground shadow-xs border border-border/80"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Briefcase className="w-3.5 h-3.5 text-primary" />
              <span>Active Pipeline Job</span>
              {selectedJob && (
                <span className="text-[10px] text-muted-foreground truncate max-w-[100px] hidden sm:inline">
                  ({selectedJob.company})
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {activeTab === "link" ? (
            /* TAB 1: CURATE WITH PROVIDED LINK */
            <div className="space-y-5">
              {/* URL Input Form */}
              <form
                onSubmit={handleExtractAndCurate}
                className="p-4 rounded-xl border border-border bg-muted/20 space-y-3.5"
              >
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-primary" />
                    <span>Job Posting Link</span>
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    LinkedIn, Indeed, Google Jobs, Company Careers
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://www.linkedin.com/jobs/view/... or any job URL"
                      className="h-10 text-xs sm:text-sm pl-3 pr-8 rounded-xl bg-background border-border focus-visible:ring-primary"
                    />
                    {url && (
                      <button
                        type="button"
                        onClick={() => setUrl("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={extracting || (!url.trim() && !rawText.trim())}
                    className="h-10 px-4 font-semibold text-xs sm:text-sm gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 rounded-xl shadow-xs"
                  >
                    {extracting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Extracting...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>Extract &amp; Curate</span>
                      </>
                    )}
                  </Button>
                </div>

                {/* Optional Raw Description Toggle */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowRawText((prev) => !prev)}
                    className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    <span>{showRawText ? "Hide text paste" : "+ Or paste Job Description text directly"}</span>
                  </button>

                  {showRawText && (
                    <div className="mt-2 space-y-1.5 animate-in fade-in duration-150">
                      <Textarea
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                        placeholder="Paste the raw job description, role overview, or qualification requirements here..."
                        rows={4}
                        className="text-xs rounded-xl bg-background border-border resize-y"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Useful if the job link is behind a login wall, private portal, or anti-bot challenge.
                      </p>
                    </div>
                  )}
                </div>

                {/* Engine Selector */}
                <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Bot className="w-3.5 h-3.5 text-primary" />
                    <span>Extraction Engine:</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setSelectedProvider("openrouter")}
                      className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-medium transition-colors",
                        selectedProvider === "openrouter"
                          ? "bg-primary/15 text-primary font-semibold"
                          : "hover:bg-muted text-muted-foreground"
                      )}
                    >
                      Cloud AI
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setSelectedProvider("fallback")}
                      className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-medium transition-colors",
                        selectedProvider === "fallback"
                          ? "bg-primary/15 text-primary font-semibold"
                          : "hover:bg-muted text-muted-foreground"
                      )}
                    >
                      Zero-Key Fallback
                    </button>
                  </div>
                </div>

                {/* Error Banner */}
                {extractError && (
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2 animate-in fade-in">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-semibold">Extraction Notice</p>
                      <p className="text-[11px] text-destructive/90">{extractError}</p>
                    </div>
                  </div>
                )}
              </form>

              {/* Extracted Job Card & Cover Letter Generator */}
              {extractedJob ? (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Extracted Role Summary Header */}
                  <div className="p-4 rounded-xl border border-primary/25 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-foreground">
                            {extractedJob.title}
                          </h3>
                          <Badge variant="outline" className="text-[10px] text-primary border-primary/30 font-medium">
                            Extracted from Link
                          </Badge>
                          {savedToPipeline ? (
                            <Badge variant="secondary" className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1">
                              <Check className="w-3 h-3" />
                              Added to Pipeline
                            </Badge>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={savingPipeline}
                              onClick={handleSaveExtractedToPipeline}
                              className="h-6 px-2 text-[10px] font-semibold gap-1 text-primary border-primary/30 hover:bg-primary/10"
                            >
                              {savingPipeline ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <BookmarkCheck className="w-3 h-3" />
                              )}
                              <span>Save Job to Pipeline</span>
                            </Button>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span className="font-semibold text-foreground flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                            {extractedJob.company}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                            {extractedJob.location || "Remote"} ({extractedJob.workplace_type})
                          </span>
                        </div>
                      </div>

                      <MatchScoreBadge
                        score={extractedJob.match_score}
                        recommendation={extractedJob.recommendation}
                        size="sm"
                      />
                    </div>

                    {/* Matched Skills Chips */}
                    {extractedJob.matched_skills && extractedJob.matched_skills.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-border/40">
                        <span className="text-[11px] font-medium text-muted-foreground mr-1">
                          Key Overlaps:
                        </span>
                        {extractedJob.matched_skills.slice(0, 6).map((skill, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          >
                            <Check className="w-2.5 h-2.5" />
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Curation Module */}
                  <CoverLetterGenerator
                    job={extractedJob}
                    isModal={true}
                    onClose={onClose}
                  />
                </div>
              ) : (
                /* Empty Prompt State */
                <div className="p-8 text-center rounded-2xl border border-dashed border-border/80 bg-muted/10 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-xs">
                    <ExternalLink className="w-6 h-6" />
                  </div>
                  <div className="max-w-md mx-auto space-y-1">
                    <h4 className="text-sm font-bold text-foreground">
                      Curate from Any External Job Link
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Paste a URL from LinkedIn, Indeed, JobStreet, or any company career page.
                      Our engine extracts the requirements and crafts an ATS-aligned cover letter highlighting your matched skills.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* TAB 2: CURATE ACTIVE PIPELINE JOB */
            <div className="space-y-4">
              {/* Job Selector Dropdown */}
              <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-primary" />
                    <span>Select Pipeline Job</span>
                  </label>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {pipelineJobs.length} Available
                  </span>
                </div>

                <div className="relative">
                  <select
                    value={selectedJob?.id || ""}
                    onChange={(e) => {
                      const found = pipelineJobs.find((j) => j.id === e.target.value);
                      if (found) setSelectedJob(found);
                    }}
                    className="w-full h-10 px-3 text-xs sm:text-sm rounded-xl bg-background border border-border text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                  >
                    {pipelineJobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.company} — {j.title} ({j.match_score}% Match)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedJob ? (
                <CoverLetterGenerator
                  job={selectedJob}
                  isModal={true}
                  onClose={onClose}
                />
              ) : (
                <div className="p-8 text-center rounded-2xl border border-dashed border-border text-xs text-muted-foreground">
                  No active job selected. Pick a job from above or switch to "Curate with Link".
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

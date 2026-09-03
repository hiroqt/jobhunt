"use client";

import React, { useState } from "react";
import {
  Link as LinkIcon,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Loader2,
  BookmarkPlus,
  Check,
} from "lucide-react";
import { extractAndAnalyzeJob, createApplication } from "@/lib/api";
import { Job, ApplicationStage } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MatchScoreBadge } from "@/components/jobs/MatchScoreBadge";
import { JobQualifyingLoader } from "@/components/jobs/JobQualifyingLoader";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface JobCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobCreated?: (job: Job) => void;
}

export const JobCaptureModal: React.FC<JobCaptureModalProps> = ({
  isOpen,
  onClose,
  onJobCreated,
}) => {
  const [tab, setTab] = useState<"url" | "text">("url");
  const [url, setUrl] = useState("");
  const [rawText, setRawText] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("openrouter");
  const [loading, setLoading] = useState(false);
  const [extractedJob, setExtractedJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addedToPipeline, setAddedToPipeline] = useState(false);
  const [savingStatus, setSavingStatus] = useState<ApplicationStage | null>(null);
  const [savedStage, setSavedStage] = useState<ApplicationStage | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setExtractedJob(null);
    setAddedToPipeline(false);

    try {
      const targetUrl = tab === "url" ? url : undefined;
      const targetText = tab === "text" ? rawText : undefined;

      if (tab === "url" && !url) throw new Error("Please enter a valid job URL");
      if (tab === "text" && !rawText) throw new Error("Please paste the job description text");

      const res = await extractAndAnalyzeJob(targetUrl, targetText, selectedProvider);
      setExtractedJob(res);
      if (onJobCreated) onJobCreated(res);
    } catch (err: any) {
      setError(err.message || "Failed to analyze job posting");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToPipeline = async (status: ApplicationStage) => {
    if (!extractedJob) return;
    setSavingStatus(status);
    try {
      await createApplication({
        job_id: extractedJob.id,
        status,
        notes: `Application captured via AI Modal. Match score: ${extractedJob.match_score}%.`,
      });
      setAddedToPipeline(true);
      setSavedStage(status);
    } catch (err: any) {
      alert(err.message || "Failed to add application to pipeline");
    } finally {
      setSavingStatus(null);
    }
  };

  const resetAndClose = () => {
    setUrl("");
    setRawText("");
    setExtractedJob(null);
    setError(null);
    setAddedToPipeline(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && resetAndClose()}>
      <DialogContent className="max-w-2xl w-full p-0 gap-0 border-border bg-card shadow-2xl overflow-hidden rounded-2xl">
        {/* Header */}
        <DialogHeader className="p-6 border-b border-border bg-card">
          <DialogTitle className="text-xl font-bold text-foreground">
            {loading ? "Qualifying Job Posting" : "Capture & Qualify Job Posting"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            {loading
              ? "Running multi-stage AI qualification and candidate skill fit analysis"
              : "Extract requirements and evaluate fit against your skill profile"}
          </DialogDescription>
        </DialogHeader>

        {/* Content Body */}
        <div className="p-6">
          {loading ? (
            <JobQualifyingLoader
              url={tab === "url" ? url : undefined}
              rawText={tab === "text" ? rawText : undefined}
              provider={selectedProvider}
            />
          ) : !extractedJob ? (
            <form onSubmit={handleAnalyze} className="space-y-5">
              <Tabs
                value={tab}
                onValueChange={(v) => setTab(v as "url" | "text")}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="url" className="flex items-center gap-2 text-sm">
                    <LinkIcon className="w-4 h-4" />
                    Paste Job URL
                  </TabsTrigger>
                  <TabsTrigger value="text" className="flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4" />
                    Paste Raw Text
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="url" className="space-y-2 mt-4">
                  <label htmlFor="job-url-input" className="block text-sm font-medium text-foreground">
                    Job Posting URL
                  </label>
                  <Input
                    id="job-url-input"
                    type="url"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.linkedin.com/jobs/view/..."
                    className="h-10 text-sm bg-background border-border"
                  />
                  <p className="text-xs text-muted-foreground">
                    Tracking parameters will automatically be stripped.
                  </p>
                </TabsContent>

                <TabsContent value="text" className="space-y-2 mt-4">
                  <label htmlFor="job-raw-input" className="block text-sm font-medium text-foreground">
                    Job Description & Requirements Text
                  </label>
                  <Textarea
                    id="job-raw-input"
                    required
                    rows={5}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Paste the full job posting text including responsibilities and qualifications..."
                    className="text-sm font-mono bg-background border-border"
                  />
                </TabsContent>
              </Tabs>

              {/* AI Model Engine Selector */}
              <div className="bg-muted/40 border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">AI Provider</p>
                  <p className="text-xs text-muted-foreground">
                    Select model engine for qualification scoring
                  </p>
                </div>
                <select
                  aria-label="Select AI provider"
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring font-medium h-10"
                >
                  <option value="openrouter">OpenRouter (Nemotron 3 Ultra)</option>
                  <option value="fallback">Local Heuristic (Offline)</option>
                  <option value="nvidia">NVIDIA NIM (Llama 3.3)</option>
                  <option value="glm">Zhipu GLM (GLM-4-Flash)</option>
                  <option value="groq">Groq (Llama 3.3)</option>
                  <option value="gemini">Google Gemini (Gemini 2.5 Flash)</option>
                  <option value="openai">OpenAI (GPT-4o-mini)</option>
                  <option value="ollama">Local Ollama</option>
                </select>
              </div>

              {/* Error Message */}
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertTitle>Extraction Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                variant="default"
                className="w-full h-11 text-sm font-semibold gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Extracting & Scoring Qualifications...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Analyze & Qualify Job Fit
                  </>
                )}
              </Button>
            </form>
          ) : (
            /* Result View */
            <div className="space-y-5">
              {/* Job Header Card */}
              <div className="bg-muted/30 border border-border rounded-xl p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl font-bold text-foreground tracking-tight">
                      {extractedJob.title}
                    </h3>
                    <p className="text-sm text-muted-foreground font-medium mt-1">
                      {extractedJob.company} • {extractedJob.location || "Remote"} • {extractedJob.workplace_type}
                    </p>
                  </div>
                  <MatchScoreBadge
                    score={extractedJob.match_score}
                    recommendation={extractedJob.recommendation}
                    size="md"
                    className="shrink-0 self-start sm:self-center"
                  />
                </div>

                <div className="text-sm text-muted-foreground leading-relaxed bg-background/80 p-3.5 rounded-lg border border-border/70">
                  {extractedJob.match_summary}
                </div>
              </div>

              {/* Matched vs Missing Skills breakdown - Equal Height Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      Matching Skills ({extractedJob.matched_skills.length})
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {extractedJob.matched_skills.length > 0 ? (
                        extractedJob.matched_skills.map((s) => (
                          <Badge
                            key={s}
                            variant="success"
                            className="font-mono text-xs px-2.5 py-1"
                          >
                            ✓ {s}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          No direct match found
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                      Missing Critical Skills ({extractedJob.missing_critical_skills.length})
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {extractedJob.missing_critical_skills.length > 0 ? (
                        extractedJob.missing_critical_skills.map((s) => (
                          <Badge
                            key={s}
                            variant="destructive"
                            className="font-mono text-xs px-2.5 py-1"
                          >
                            ✗ {s}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                          ✓ All critical skills satisfied!
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Bar */}
              <div className="pt-2 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                {!addedToPipeline ? (
                  <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto flex-1">
                    <Button
                      onClick={() => handleAddToPipeline("APPLIED")}
                      disabled={savingStatus !== null}
                      variant="default"
                      className="flex-1 sm:flex-none font-semibold gap-2 text-sm h-10 px-5"
                    >
                      {savingStatus === "APPLIED" ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Adding...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Add to Pipeline (Applied)</span>
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleAddToPipeline("SAVED")}
                      disabled={savingStatus !== null}
                      variant="secondary"
                      className="flex-1 sm:flex-none font-semibold gap-2 text-sm h-10 px-5"
                    >
                      {savingStatus === "SAVED" ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <BookmarkPlus className="w-4 h-4" />
                          <span>Save to Wishlist</span>
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-sm font-semibold bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-lg flex-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {savedStage === "SAVED"
                        ? "Saved to Wishlist Pipeline"
                        : "Registered in Applied Pipeline"}
                    </span>
                  </div>
                )}

                <Button
                  onClick={() => setExtractedJob(null)}
                  variant="outline"
                  className="w-full sm:w-auto h-10 text-sm px-4 gap-1.5 shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Analyze Another</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

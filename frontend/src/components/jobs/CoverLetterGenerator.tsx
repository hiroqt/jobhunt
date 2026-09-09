"use client";

import React, { useState, useEffect } from "react";
import {
  File01Icon as FileText,
  Tick02Icon as Check,
  Copy01Icon as Copy,
  Download01Icon as Download,
  RefreshIcon as RefreshCw,
  AiChat01Icon as Bot,
  SlidersHorizontalIcon as Sliders,
  FlashIcon as Zap,
  CheckmarkCircle02Icon as CheckCircle2,
  Building02Icon as Building2,
  BookmarkCheck01Icon as BookmarkCheck,
  Loading03Icon as Loader2,
  ViewIcon as Eye,
  Cancel01Icon as X,
  Globe02Icon as Globe,
  Clock01Icon as Clock,
  Briefcase01Icon as Briefcase,
  ChartIncreaseIcon as TrendingUp,
  SourceCodeIcon as Code2,
  Rocket01Icon as Rocket,
  LinkSquare01Icon as ExternalLink,
  ArrowUp01Icon as ArrowUp
} from "hugeicons-react";
import { Job, CoverLetterGenResponse, CoverLetterTone, CoverLetterLength } from "@/types";
import { generateCoverLetter, saveCoverLetterForJob, getApplications } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CoverLetterGeneratorProps {
  job: Job;
  isModal?: boolean;
  onClose?: () => void;
  onFullscreen?: () => void;
  onSaved?: () => void;
}

const TONE_OPTIONS: {
  id: CoverLetterTone;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "professional", label: "Professional", desc: "Balanced, executive & polished", icon: Briefcase },
  { id: "impactful", label: "High-Impact", desc: "Metrics-driven, ROI & velocity", icon: TrendingUp },
  { id: "technical", label: "Technical", desc: "Deep architectural rigor & stack", icon: Code2 },
  { id: "startup", label: "Startup", desc: "Agile, high autonomy & ownership", icon: Rocket },
];

const LENGTH_OPTIONS: { id: CoverLetterLength; label: string; desc: string }[] = [
  { id: "concise", label: "Concise", desc: "~200-250w (Quick skim)" },
  { id: "standard", label: "Standard", desc: "~350w (3-4 paragraphs)" },
  { id: "detailed", label: "Detailed", desc: "~480w (With bullet wins)" },
];

/**
 * Strictly strips all emojis, emoticons, and decorative pictographs from text.
 */
export function stripEmojis(text: string): string {
  if (!text) return "";
  return text
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2702}-\u{27B0}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{FE00}-\u{FE0F}\u{2300}-\u{23FF}\u{2B50}-\u{2B55}]/gu, "")
    .replace(/[ \t]+/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/ ([,\.!\?:;])/g, "$1")
    .trim();
}

export function CoverLetterGenerator({ job, isModal = false, onClose, onFullscreen, onSaved }: CoverLetterGeneratorProps) {
  const [tone, setTone] = useState<CoverLetterTone>("professional");
  const [length, setLength] = useState<CoverLetterLength>("standard");
  const [provider, setProvider] = useState<string>("openrouter");
  const [hiringManager, setHiringManager] = useState<string>("");
  const [customInstructions, setCustomInstructions] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [result, setResult] = useState<CoverLetterGenResponse | null>(null);
  const [editableLetter, setEditableLetter] = useState<string>("");
  const [viewMode, setViewMode] = useState<"formatted" | "edit">("formatted");

  const [copiedSubject, setCopiedSubject] = useState<boolean>(false);
  const [copiedBody, setCopiedBody] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [existingCoverLetter, setExistingCoverLetter] = useState<string | null>(null);

  // Check if job already has a saved cover letter in an Application
  useEffect(() => {
    let isMounted = true;
    async function checkExisting() {
      try {
        const apps = await getApplications({ jobId: job.id });
        if (isMounted && apps && apps.length > 0 && apps[0].custom_cover_letter) {
          const cleaned = stripEmojis(apps[0].custom_cover_letter);
          setExistingCoverLetter(cleaned);
          if (!result) {
            setEditableLetter(cleaned);
          }
        } else if (isMounted) {
          setExistingCoverLetter(null);
        }
      } catch (err) {
        console.error("Error checking existing cover letter:", err);
      }
    }
    checkExisting();
    return () => {
      isMounted = false;
    };
  }, [job.id]);

  const handleGenerate = async () => {
    setLoading(true);
    setSaveSuccess(false);
    try {
      const data = await generateCoverLetter({
        job_id: job.id,
        job_title: job.title,
        company: job.company,
        job_description: job.raw_description || job.summary || "",
        tone,
        length,
        custom_instructions: customInstructions.trim() ? stripEmojis(customInstructions.trim()) : undefined,
        hiring_manager_name: hiringManager.trim() ? stripEmojis(hiringManager.trim()) : undefined,
        provider,
      });

      // Strict zero-emoji guarantee on frontend
      const cleanedData: CoverLetterGenResponse = {
        ...data,
        cover_letter: stripEmojis(data.cover_letter),
        subject_line: stripEmojis(data.subject_line),
        salutation: stripEmojis(data.salutation),
        sign_off: stripEmojis(data.sign_off),
        body_paragraphs: data.body_paragraphs.map(stripEmojis),
        matched_skills_highlighted: data.matched_skills_highlighted.map(stripEmojis),
        key_strengths_featured: data.key_strengths_featured.map(stripEmojis),
        word_count: stripEmojis(data.cover_letter).split(/\s+/).length,
      };

      setResult(cleanedData);
      setEditableLetter(cleanedData.cover_letter);
      setViewMode("formatted");
    } catch (err: any) {
      alert(err.message || "Failed to generate cover letter. Please try again or switch provider.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyBody = () => {
    const textToCopy = stripEmojis(editableLetter || result?.cover_letter || "");
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopiedBody(true);
    setTimeout(() => setCopiedBody(false), 2000);
  };

  const handleCopySubject = () => {
    const rawSubject = result?.subject_line || `Application for ${job.title} - Candidate`;
    const subject = stripEmojis(rawSubject);
    navigator.clipboard.writeText(subject);
    setCopiedSubject(true);
    setTimeout(() => setCopiedSubject(false), 2000);
  };

  const handleSaveToApplication = async () => {
    const textToSave = stripEmojis(editableLetter || result?.cover_letter || "");
    if (!textToSave) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      await saveCoverLetterForJob(job.id, textToSave);
      setSaveSuccess(true);
      setExistingCoverLetter(textToSave);
      if (onSaved) onSaved();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to save cover letter to application.");
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = (format: "txt" | "md") => {
    const text = stripEmojis(editableLetter || result?.cover_letter || "");
    if (!text) return;
    const filename = `Cover_Letter_${job.company.replace(/\s+/g, "_")}_${job.title.replace(/\s+/g, "_")}.${format}`;
    const element = document.createElement("a");
    const file = new Blob([text], { type: "text/plain;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const wordCount = (editableLetter || result?.cover_letter || "").trim()
    ? (editableLetter || result?.cover_letter || "").trim().split(/\s+/).length
    : 0;

  return (
    <div className={cn("space-y-4", isModal ? "p-1" : "")}>
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary text-primary-foreground shadow-xs shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-foreground">
                Curated Custom Cover Letter
              </h3>
              <Badge variant="outline" className="text-[10px] text-primary border-primary/30 font-medium">
                Role &amp; Resume Tailored
              </Badge>
              {existingCoverLetter && !result && (
                <Badge variant="secondary" className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1">
                  <BookmarkCheck className="w-3 h-3" />
                  Saved In Pipeline
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Synthesizes <span className="font-semibold text-foreground">{job.title}</span> requirements at{" "}
              <span className="font-semibold text-foreground">{job.company}</span> with your resume highlights.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
          {onFullscreen && !isModal && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onFullscreen}
              className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1 border-border/80"
              title="Open in fullscreen dialog"
            >
              <ExternalLink className="w-3.5 h-3.5 text-primary" />
              <span>Fullscreen</span>
            </Button>
          )}
          {onClose && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1"
              title={isModal ? "Close dialog" : "Collapse studio"}
            >
              {isModal ? (
                <>
                  <X className="w-4 h-4" />
                  <span>Close</span>
                </>
              ) : (
                <>
                  <ArrowUp className="w-3.5 h-3.5" />
                  <span>Collapse</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Curation Controls Grid */}
      <Card className="border-border bg-card/80 p-4 space-y-4 shadow-xs">
        {/* Full-Width Tone & Style Selector */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">Curation Tone &amp; Style</span>
            <span className="text-[10px] text-muted-foreground">Select professional voice</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TONE_OPTIONS.map((t) => {
              const IconComponent = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTone(t.id)}
                  className={cn(
                    "flex flex-col items-start p-2.5 rounded-lg border text-left transition-all text-xs",
                    tone === t.id
                      ? "bg-primary/10 border-primary text-foreground font-semibold shadow-xs"
                      : "bg-background/60 border-border text-muted-foreground hover:bg-muted/60"
                  )}
                >
                  <span className="flex items-center gap-1.5 text-xs font-medium">
                    <IconComponent className={cn("w-3.5 h-3.5", tone === t.id ? "text-primary" : "text-muted-foreground")} />
                    <span>{t.label}</span>
                  </span>
                  <span className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                    {t.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2-Column: Length & Model Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Target Length */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">Target Length</span>
              <span className="text-[10px] text-muted-foreground">Recruiter preference</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {LENGTH_OPTIONS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLength(l.id)}
                  className={cn(
                    "py-2 px-2 rounded-lg border text-center transition-all text-xs",
                    length === l.id
                      ? "bg-primary/10 border-primary text-primary font-semibold shadow-xs"
                      : "bg-background/60 border-border text-muted-foreground hover:bg-muted/60"
                  )}
                >
                  <div className="font-medium text-xs text-foreground">{l.label}</div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">{l.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* AI Model */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="select-provider-cl" className="text-xs font-semibold text-foreground">
                AI Engine
              </label>
              <span className="text-[10px] text-muted-foreground">Free Cloud &amp; Offline</span>
            </div>
            <select
              id="select-provider-cl"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full bg-background border border-border rounded-md px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring font-medium h-8"
            >
              <option value="openrouter">OpenRouter (Nemotron 3 Ultra - Free Cloud)</option>
              <option value="nemotron-light">OpenRouter (Nemotron 3.5 Lightning - Fast)</option>
              <option value="gemini">Google Gemini 2.5 Flash</option>
              <option value="nvidia">NVIDIA NIM (Llama 3.3 70B)</option>
              <option value="groq">Groq (Llama 3.3 70B Versatile)</option>
              <option value="fallback">Local Heuristic Engine (Offline / Zero Keys)</option>
            </select>
          </div>
        </div>

        {/* Optional Custom Instructions / Advanced Accordion */}
        <div className="pt-2 border-t border-border/50">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1"
          >
            <Sliders className="w-3 h-3" />
            <span>{showAdvanced ? "Hide custom highlights & recipient" : "+ Add custom highlight story or recipient name"}</span>
          </button>

          {showAdvanced && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 animate-in fade-in duration-150">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">
                  Hiring Manager / Recruiter Name (Optional)
                </label>
                <Input
                  value={hiringManager}
                  onChange={(e) => setHiringManager(e.target.value)}
                  placeholder="e.g. Sarah Jenkins or Engineering Team"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">
                  Specific Project or Metric to Feature (Optional)
                </label>
                <Input
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="e.g. Highlight AWS migration with 35% latency drop"
                  className="h-8 text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Generation Trigger Button */}
        <div className="pt-1 flex items-center justify-between gap-3">
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="w-full sm:w-auto h-9 px-5 text-xs font-semibold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Curating Tailored Cover Letter...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>{result ? "Regenerate Cover Letter" : "Generate Curated Cover Letter"}</span>
              </>
            )}
          </Button>

          {result && (
            <span className="text-[11px] text-muted-foreground font-mono">
              Curated with {result.ai_provider_used}
            </span>
          )}
        </div>
      </Card>

      {/* Output Studio Section */}
      {(result || existingCoverLetter) && (
        <Card className="border-border bg-card p-4 sm:p-5 space-y-4 shadow-sm animate-in fade-in duration-200">
          {/* Output Meta Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-foreground">
                  Email Subject Line:
                </span>
                <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded border border-border text-foreground">
                  {result?.subject_line || `Application for ${job.title} - Candidate`}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopySubject}
                  className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-foreground gap-1"
                >
                  {copiedSubject ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span className="text-emerald-500 font-medium">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Subject</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Matched Skills Emphasized */}
              {result?.matched_skills_highlighted && result.matched_skills_highlighted.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[11px] text-muted-foreground">Targeted skills emphasized:</span>
                  {result.matched_skills_highlighted.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="text-[10px] py-0 px-1.5 bg-primary/10 text-primary border-primary/20 flex items-center gap-1"
                    >
                      <Check className="w-2.5 h-2.5 text-primary" />
                      <span>{skill}</span>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Mode Switcher & Stats */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <span className="text-[11px] text-muted-foreground font-mono">
                {wordCount} words (~{Math.max(1, Math.round(wordCount / 200))} min read)
              </span>
              <div className="flex items-center bg-muted p-0.5 rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setViewMode("formatted")}
                  className={cn(
                    "px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors",
                    viewMode === "formatted"
                      ? "bg-card text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Formatted
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("edit")}
                  className={cn(
                    "px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors",
                    viewMode === "edit"
                      ? "bg-card text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Edit Text
                </button>
              </div>
            </div>
          </div>

          {/* Letter Body Display */}
          {viewMode === "formatted" ? (
            <div className="bg-background/80 rounded-xl border border-border/80 p-5 sm:p-6 text-sm text-foreground leading-relaxed font-sans space-y-4 whitespace-pre-line shadow-inner max-h-[460px] overflow-y-auto">
              {editableLetter || result?.cover_letter}
            </div>
          ) : (
            <div className="space-y-1.5">
              <Textarea
                value={editableLetter}
                onChange={(e) => setEditableLetter(stripEmojis(e.target.value))}
                rows={16}
                className="font-mono text-xs leading-relaxed resize-y bg-background/90"
                placeholder="Curated cover letter text..."
              />
              <span className="text-[10px] text-muted-foreground block text-right">
                Direct editing is automatically captured and guaranteed emoji-free when saving or downloading.
              </span>
            </div>
          )}

          {/* Action Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border">
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              {/* Copy Letter */}
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleCopyBody}
                className="h-8 px-3.5 text-xs font-semibold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
              >
                {copiedBody ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-primary-foreground" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Letter</span>
                  </>
                )}
              </Button>

              {/* Save to Application */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSaveToApplication}
                disabled={saving}
                className={cn(
                  "h-8 px-3 text-xs font-semibold gap-1.5 border-border",
                  saveSuccess ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" : ""
                )}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : saveSuccess ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Saved to Pipeline!</span>
                  </>
                ) : (
                  <>
                    <BookmarkCheck className="w-3.5 h-3.5 text-primary" />
                    <span>Save to Job Application</span>
                  </>
                )}
              </Button>
            </div>

            {/* Export & Download options */}
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleDownload("txt")}
                className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1"
                title="Download plain text"
              >
                <Download className="w-3.5 h-3.5" />
                <span>.txt</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleDownload("md")}
                className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1"
                title="Download markdown"
              >
                <Download className="w-3.5 h-3.5" />
                <span>.md</span>
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

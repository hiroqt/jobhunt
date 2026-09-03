"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Compass,
  Search,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Building2,
  MapPin,
  ExternalLink,
  Trash2,
  Bookmark,
  BookmarkCheck,
  BookmarkPlus,
  Check,
  Loader2,
  Radar,
  SlidersHorizontal,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  SearchCheck,
  RefreshCw,
  Globe,
  Clock,
} from "lucide-react";
import { getJobs, deleteJob, createApplication, saveJob, unsaveJob, verifyJobLink } from "@/lib/api";
import { Job, LinkVerificationResponse } from "@/types";
import { MatchScoreBadge } from "@/components/jobs/MatchScoreBadge";
import { JobCaptureModal } from "@/components/jobs/JobCaptureModal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return "Within 1w";
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    if (diffMs < 0) return "Just now";
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays <= 7) return `${diffDays}d ago`;
    return `${diffDays}d ago`;
  } catch {
    return "Within 1w";
  }
}

function JobsContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("search") || "";

  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<"all" | "saved" | "high_match">("all");
  const [recommendationFilter, setRecommendationFilter] = useState("");
  const [workplaceFilter, setWorkplaceFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const [addedJobs, setAddedJobs] = useState<Record<string, boolean>>({});
  const [savingJobs, setSavingJobs] = useState<Record<string, "SAVED" | "APPLIED" | null>>({});
  const [savedStages, setSavedStages] = useState<Record<string, "SAVED" | "APPLIED">>({});
  const [verifyingLinkId, setVerifyingLinkId] = useState<string | null>(null);
  const [linkCheckResult, setLinkCheckResult] = useState<LinkVerificationResponse | null>(null);

  useEffect(() => {
    const q = searchParams.get("search") || "";
    setSearch(q);
  }, [searchParams]);

  const loadJobs = async (customSearch?: string) => {
    setLoading(true);
    try {
      const minScore = activeTab === "high_match" ? 80 : undefined;
      const savedOnly = activeTab === "saved" ? true : undefined;

      const data = await getJobs({
        search: customSearch !== undefined ? customSearch : search,
        recommendation: recommendationFilter || undefined,
        workplace_type: workplaceFilter || undefined,
        source: sourceFilter || undefined,
        min_score: minScore,
        saved_only: savedOnly,
      });

      setJobs(data);
      if (data.length > 0) {
        setSelectedJob(data[0]);
      } else {
        setSelectedJob(null);
      }
    } catch (err) {
      console.error("Error fetching jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [searchParams, recommendationFilter, workplaceFilter, sourceFilter, activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadJobs(search);
  };

  const handleToggleBookmark = async (e: React.MouseEvent, job: Job) => {
    e.stopPropagation();
    const newSavedStatus = !job.is_saved;

    // Optimistic update
    setJobs((prev) =>
      prev.map((j) => (j.id === job.id ? { ...j, is_saved: newSavedStatus } : j))
    );
    if (selectedJob?.id === job.id) {
      setSelectedJob((prev) => (prev ? { ...prev, is_saved: newSavedStatus } : null));
    }

    try {
      if (newSavedStatus) {
        await saveJob(job.id);
      } else {
        await unsaveJob(job.id);
      }
    } catch (err) {
      console.error("Failed to toggle bookmark", err);
      // Revert on error
      setJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, is_saved: !newSavedStatus } : j))
      );
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job posting?")) return;
    try {
      await deleteJob(jobId);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      if (selectedJob?.id === jobId) {
        setSelectedJob(jobs.find((j) => j.id !== jobId) || null);
      }
    } catch (err) {
      console.error("Error deleting job:", err);
    }
  };

  const handleAddToPipeline = async (job: Job, stage: "SAVED" | "APPLIED" = "APPLIED") => {
    setSavingJobs((prev) => ({ ...prev, [job.id]: stage }));
    try {
      await createApplication({
        job_id: job.id,
        status: stage,
        notes: `Direct application added from Job Explorer with match score ${job.match_score || 0}%.`,
      });
      setAddedJobs((prev) => ({ ...prev, [job.id]: true }));
      setSavedStages((prev) => ({ ...prev, [job.id]: stage }));
    } catch (err: any) {
      alert(err.message || "Could not add to pipeline");
    } finally {
      setSavingJobs((prev) => ({ ...prev, [job.id]: null }));
    }
  };

  const handleVerifyLink = async (job: Job) => {
    setVerifyingLinkId(job.id);
    setLinkCheckResult(null);
    try {
      const res: LinkVerificationResponse = await verifyJobLink(job.id);
      setLinkCheckResult(res);

      // Update in job list and selectedJob
      setJobs((prev) =>
        prev.map((j) =>
          j.id === job.id
            ? {
                ...j,
                is_active: res.is_active,
                link_status: res.link_status,
                link_type: res.link_type,
                search_url: res.search_url,
              }
            : j
        )
      );
      if (selectedJob?.id === job.id) {
        setSelectedJob((prev) =>
          prev
            ? {
                ...prev,
                is_active: res.is_active,
                link_status: res.link_status,
                link_type: res.link_type,
                search_url: res.search_url,
              }
            : null
        );
      }
    } catch (err: any) {
      alert(`Link check error: ${err.message}`);
    } finally {
      setVerifyingLinkId(null);
    }
  };

  const getSourceDisplayName = (src: string) => {
    const s = src.toLowerCase();
    if (s === "linkedin") return "LinkedIn";
    if (s === "indeed") return "Indeed";
    if (s === "jobstreet") return "JobStreet";
    if (s === "remoteok") return "RemoteOK";
    if (s === "public") return "Company Careers";
    return src;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Job Explorer
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Discover, bookmark, and evaluate jobs across all connected platforms against your profile.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm" className="gap-2 h-10 px-3.5 text-xs font-semibold">
            <Link href="/searches">
              <Radar className="w-4 h-4 text-primary" />
              Automated Discovery
            </Link>
          </Button>
          <Button
            onClick={() => setIsCaptureModalOpen(true)}
            variant="default"
            className="gap-2 font-semibold text-sm h-10 px-4 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Capture Job</span>
          </Button>
        </div>
      </div>

      {/* Main Filter and Search Bar */}
      <Card className="border-border bg-card p-4 space-y-3">
        {/* Tab Filters */}
        <div className="flex items-center gap-2 border-b border-border/60 pb-3">
          <button
            onClick={() => setActiveTab("all")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5",
              activeTab === "all"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Compass className="w-3.5 h-3.5" />
            All Jobs
          </button>
          <button
            onClick={() => setActiveTab("saved")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5",
              activeTab === "saved"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Bookmark className="w-3.5 h-3.5" />
            Saved Bookmarks
          </button>
          <button
            onClick={() => setActiveTab("high_match")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5",
              activeTab === "high_match"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            High Match (80%+)
          </button>
        </div>

        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-col sm:flex-row flex-wrap items-center gap-3"
        >
          <div className="flex-1 min-w-[240px] w-full relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, company, or tech keywords..."
              className="pl-10 h-10 text-sm bg-background border-border"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap sm:flex-nowrap">
            <select
              aria-label="Filter by source"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="bg-background border border-border rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring font-medium h-10"
            >
              <option value="">All Sources</option>
              <option value="linkedin">LinkedIn</option>
              <option value="indeed">Indeed</option>
              <option value="jobstreet">JobStreet</option>
              <option value="remoteok">RemoteOK</option>
              <option value="public">Public ATS</option>
              <option value="Manual">Manual</option>
            </select>

            <select
              aria-label="Filter by recommendation"
              value={recommendationFilter}
              onChange={(e) => setRecommendationFilter(e.target.value)}
              className="bg-background border border-border rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring font-medium h-10"
            >
              <option value="">All Scores</option>
              <option value="APPLY">APPLY (High Match)</option>
              <option value="REVIEW">REVIEW (Borderline)</option>
              <option value="SKIP">SKIP (Low Match)</option>
            </select>

            <select
              aria-label="Filter by workplace type"
              value={workplaceFilter}
              onChange={(e) => setWorkplaceFilter(e.target.value)}
              className="bg-background border border-border rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring font-medium h-10"
            >
              <option value="">All Workplaces</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Onsite">Onsite</option>
            </select>

            <Button type="submit" variant="secondary" size="default" className="h-10 px-4 text-xs font-semibold shrink-0">
              Filter
            </Button>
          </div>
        </form>
      </Card>

      {/* Main Grid: Job List (Left) & Selected Job Deep-Dive (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Job Card Stream (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Loading opportunities...
            </div>
          ) : jobs.length === 0 ? (
            <Card className="border-border bg-card text-center p-8 space-y-3">
              <Compass className="w-8 h-8 text-muted-foreground mx-auto" />
              <h3 className="text-base font-semibold text-foreground">No matching jobs found</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Trigger an automated discovery search or paste a new job URL to qualify opportunities.
              </p>
              <div className="flex justify-center gap-2 pt-2">
                <Button asChild size="sm" variant="outline">
                  <Link href="/searches">Run Search</Link>
                </Button>
                <Button
                  onClick={() => setIsCaptureModalOpen(true)}
                  variant="default"
                  size="sm"
                  className="font-semibold text-sm"
                >
                  Capture Job URL
                </Button>
              </div>
            </Card>
          ) : (
            jobs.map((job) => {
              const isSelected = selectedJob?.id === job.id;
              const linkIsActive = job.is_active !== false && job.link_status !== "EXPIRED";

              return (
                <div
                  key={job.id}
                  onClick={() => {
                    setSelectedJob(job);
                    setLinkCheckResult(null);
                  }}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setSelectedJob(job);
                      setLinkCheckResult(null);
                    }
                  }}
                  className={cn(
                    "p-4 rounded-xl border transition-all cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-ring relative group",
                    isSelected
                      ? "bg-secondary border-primary/30 shadow-xs"
                      : "bg-card border-border hover:bg-accent/40"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-sm font-semibold text-foreground truncate">
                          {job.title}
                        </h3>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 capitalize font-mono shrink-0">
                          {job.source}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-medium truncate mt-0.5">
                        {job.company}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={(e) => handleToggleBookmark(e, job)}
                        className={`p-1.5 rounded-md hover:bg-muted transition-colors ${
                          job.is_saved ? "text-primary" : "text-muted-foreground"
                        }`}
                        title={job.is_saved ? "Saved" : "Save Job"}
                      >
                        {job.is_saved ? (
                          <BookmarkCheck className="w-4 h-4 fill-current" />
                        ) : (
                          <Bookmark className="w-4 h-4" />
                        )}
                      </button>

                      <MatchScoreBadge
                        score={job.match_score}
                        recommendation={job.recommendation}
                        size="sm"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 text-[11px] text-muted-foreground font-mono">
                    <div className="flex items-center gap-2 truncate">
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-sans font-medium">
                        <Clock className="w-2.5 h-2.5" />
                        {formatRelativeTime(job.posted_at)}
                      </span>
                      <span>•</span>
                      <span>{job.workplace_type}</span>
                      <span>•</span>
                      <span>{job.location || "Remote"}</span>
                      {job.salary_min && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            ${job.salary_min.toLocaleString()}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Quick Link Pill */}
                    {job.url && (
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title={`Open on ${getSourceDisplayName(job.source)}`}
                        className="inline-flex items-center gap-1 text-[10px] font-sans font-medium text-primary hover:underline ml-2 shrink-0 bg-primary/5 px-2 py-0.5 rounded border border-primary/20"
                      >
                        <span>{getSourceDisplayName(job.source)}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Selected Job Deep-Dive (7 Cols) */}
        <div className="lg:col-span-7">
          {selectedJob ? (
            <Card className="border-border bg-card p-6 space-y-6 sticky top-20 shadow-lg">
              {/* Job Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border pb-5">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold text-foreground">
                      {selectedJob.title}
                    </h2>
                    <Badge variant="secondary" className="text-xs uppercase font-mono tracking-wider">
                      {selectedJob.source}
                    </Badge>
                    <Badge variant="outline" className="text-xs text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 gap-1 font-medium">
                      <Clock className="w-3 h-3" />
                      Posted {formatRelativeTime(selectedJob.posted_at)} (1w span)
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5 text-sm text-muted-foreground mt-1.5">
                    <span className="text-foreground font-semibold flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      {selectedJob.company}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      {selectedJob.location || "Remote"} ({selectedJob.workplace_type})
                    </span>
                    {selectedJob.salary_min && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                          ${selectedJob.salary_min.toLocaleString()} - ${selectedJob.salary_max?.toLocaleString()}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => handleToggleBookmark(e, selectedJob)}
                    className={`p-2 rounded-lg border transition-colors ${
                      selectedJob.is_saved
                        ? "bg-primary/10 border-primary text-primary"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                    title={selectedJob.is_saved ? "Remove bookmark" : "Bookmark job"}
                  >
                    {selectedJob.is_saved ? (
                      <BookmarkCheck className="w-5 h-5 fill-current" />
                    ) : (
                      <Bookmark className="w-5 h-5" />
                    )}
                  </button>
                  <MatchScoreBadge
                    score={selectedJob.match_score}
                    recommendation={selectedJob.recommendation}
                    size="lg"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(selectedJob.id)}
                    className="text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"
                    aria-label="Delete job"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Direct Job Link & Live Verification Banner */}
              <div className="p-3.5 rounded-xl border border-border/80 bg-muted/30 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-xs font-semibold text-foreground">
                      Source Link & Posting Status:
                    </span>
                    {selectedJob.link_status === "EXPIRED" ? (
                      <Badge variant="destructive" className="text-[10px] gap-1 py-0 px-1.5">
                        <ShieldAlert className="w-3 h-3" />
                        Expired Link
                      </Badge>
                    ) : selectedJob.link_type === "SEARCH_QUERY" ? (
                      <Badge variant="outline" className="text-[10px] gap-1 py-0 px-1.5 text-primary border-primary/30">
                        <SearchCheck className="w-3 h-3" />
                        Live Search Query
                      </Badge>
                    ) : (
                      <Badge variant="success" className="text-[10px] gap-1 py-0 px-1.5">
                        <ShieldCheck className="w-3 h-3" />
                        Live Posting
                      </Badge>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVerifyLink(selectedJob)}
                    disabled={verifyingLinkId === selectedJob.id}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <RefreshCw className={`w-3 h-3 mr-1 ${verifyingLinkId === selectedJob.id ? "animate-spin" : ""}`} />
                    {verifyingLinkId === selectedJob.id ? "Checking..." : "Verify Link"}
                  </Button>
                </div>

                {linkCheckResult && (
                  <div className={`text-[11px] p-2 rounded border ${
                    linkCheckResult.is_active
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                      : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
                  }`}>
                    {linkCheckResult.message}
                  </div>
                )}

                {/* Direct Action Redirection Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {selectedJob.url && (
                    <Button
                      asChild
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-8 shadow-xs"
                    >
                      <a
                        href={selectedJob.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open on {getSourceDisplayName(selectedJob.source)}</span>
                      </a>
                    </Button>
                  )}

                  {selectedJob.search_url && (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 font-medium border-border/80"
                    >
                      <a
                        href={selectedJob.search_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                      >
                        <Search className="w-3.5 h-3.5 text-primary" />
                        <span>Search Live {selectedJob.title} Roles</span>
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              {/* Match Summary Assessment */}
              <div className="bg-muted/40 border border-border rounded-lg p-4 space-y-1.5">
                <h4 className="text-sm font-semibold text-foreground">
                  Match Assessment
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedJob.match_summary || "Match assessment generated based on requirements."}
                </p>
              </div>

              {/* Skills Breakdown Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 space-y-2">
                  <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Matching Skills ({selectedJob.matched_skills.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedJob.matched_skills.length > 0 ? (
                      selectedJob.matched_skills.map((s) => (
                        <Badge
                          key={s}
                          variant="success"
                          className="font-mono text-xs"
                        >
                          ✓ {s}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        No direct matching skills recorded
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-4 space-y-2">
                  <h4 className="text-sm font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    Missing Critical Skills ({selectedJob.missing_critical_skills.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedJob.missing_critical_skills.length > 0 ? (
                      selectedJob.missing_critical_skills.map((s) => (
                        <Badge
                          key={s}
                          variant="destructive"
                          className="font-mono text-xs"
                        >
                          ✗ {s}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
                        ✓ All mandatory requirements met!
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Key Responsibilities */}
              {selectedJob.responsibilities && selectedJob.responsibilities.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                    Core Responsibilities
                  </h4>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    {selectedJob.responsibilities.map((r, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-muted-foreground mt-0.5">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-border flex flex-col sm:flex-row items-center gap-2.5">
                {!addedJobs[selectedJob.id] ? (
                  <>
                    <Button
                      onClick={() => handleAddToPipeline(selectedJob, "APPLIED")}
                      disabled={savingJobs[selectedJob.id] !== null && savingJobs[selectedJob.id] !== undefined}
                      variant="default"
                      className="w-full sm:flex-1 h-10 font-semibold gap-2 text-sm"
                    >
                      {savingJobs[selectedJob.id] === "APPLIED" ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Adding to Pipeline...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Add to Pipeline (Applied)</span>
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleAddToPipeline(selectedJob, "SAVED")}
                      disabled={savingJobs[selectedJob.id] !== null && savingJobs[selectedJob.id] !== undefined}
                      variant="secondary"
                      className="w-full sm:flex-1 h-10 font-semibold gap-2 text-sm"
                    >
                      {savingJobs[selectedJob.id] === "SAVED" ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Saving to Wishlist...</span>
                        </>
                      ) : (
                        <>
                          <BookmarkPlus className="w-4 h-4" />
                          <span>Save to Wishlist</span>
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <Alert variant="success" className="w-full">
                    <CheckCircle2 className="w-4 h-4" />
                    <AlertTitle>
                      {savedStages[selectedJob.id] === "SAVED" ? "Saved to Wishlist" : "Application Registered"}
                    </AlertTitle>
                    <AlertDescription>
                      {savedStages[selectedJob.id] === "SAVED"
                        ? "Job saved to your pipeline in the Saved / Wishlist stage."
                        : "Role tracked in your Applied stage with 5-day follow-up scheduled."}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </Card>
          ) : (
            <Card className="border-border bg-card p-12 text-center text-muted-foreground text-sm">
              Select a job from the list to inspect qualification details and match analysis.
            </Card>
          )}
        </div>
      </div>

      <JobCaptureModal
        isOpen={isCaptureModalOpen}
        onClose={() => setIsCaptureModalOpen(false)}
        onJobCreated={(newJob) => {
          setJobs((prev) => [newJob, ...prev]);
          setSelectedJob(newJob);
        }}
      />
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading Job Explorer...</div>}>
      <JobsContent />
    </Suspense>
  );
}

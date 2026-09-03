"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
  BookmarkPlus,
  Check,
  Loader2,
} from "lucide-react";
import { getJobs, deleteJob, createApplication } from "@/lib/api";
import { Job } from "@/types";
import { MatchScoreBadge } from "@/components/jobs/MatchScoreBadge";
import { JobCaptureModal } from "@/components/jobs/JobCaptureModal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

function JobsContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("search") || "";

  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState(initialQuery);
  const [recommendationFilter, setRecommendationFilter] = useState("");
  const [workplaceFilter, setWorkplaceFilter] = useState("");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const [addedJobs, setAddedJobs] = useState<Record<string, boolean>>({});
  const [savingJobs, setSavingJobs] = useState<Record<string, "SAVED" | "APPLIED" | null>>({});
  const [savedStages, setSavedStages] = useState<Record<string, "SAVED" | "APPLIED">>({});

  useEffect(() => {
    const q = searchParams.get("search") || "";
    setSearch(q);
  }, [searchParams]);

  const loadJobs = async (customSearch?: string) => {
    setLoading(true);
    try {
      const data = await getJobs(
        customSearch !== undefined ? customSearch : search,
        recommendationFilter,
        workplaceFilter
      );
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
  }, [searchParams, recommendationFilter, workplaceFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadJobs(search);
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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Job Explorer
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Evaluate job postings against your skill profile to decide APPLY, REVIEW, or SKIP.
          </p>
        </div>
        <Button
          onClick={() => setIsCaptureModalOpen(true)}
          variant="default"
          className="gap-2 font-semibold text-sm h-10 px-4 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Capture Job</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-border bg-card p-4">
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

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <select
              aria-label="Filter by recommendation"
              value={recommendationFilter}
              onChange={(e) => setRecommendationFilter(e.target.value)}
              className="bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring font-medium w-full sm:w-auto h-10"
            >
              <option value="">All Recommendations</option>
              <option value="APPLY">APPLY (High Match)</option>
              <option value="REVIEW">REVIEW (Borderline)</option>
              <option value="SKIP">SKIP (Low Match)</option>
            </select>

            <select
              aria-label="Filter by workplace type"
              value={workplaceFilter}
              onChange={(e) => setWorkplaceFilter(e.target.value)}
              className="bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring font-medium w-full sm:w-auto h-10"
            >
              <option value="">All Workplaces</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Onsite">Onsite</option>
            </select>

            <Button type="submit" variant="secondary" size="default" className="h-10 px-4 text-sm font-semibold shrink-0">
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
              <h3 className="text-base font-semibold text-foreground">No jobs saved yet</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Paste any job posting URL to extract requirements and see your automated match score.
              </p>
              <Button
                onClick={() => setIsCaptureModalOpen(true)}
                variant="default"
                size="sm"
                className="font-semibold text-sm"
              >
                Capture First Job
              </Button>
            </Card>
          ) : (
            jobs.map((job) => {
              const isSelected = selectedJob?.id === job.id;
              return (
                <div
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setSelectedJob(job);
                    }
                  }}
                  className={cn(
                    "p-4 rounded-xl border transition-colors cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isSelected
                      ? "bg-secondary border-primary/30 shadow-sm"
                      : "bg-card border-border hover:bg-accent/40"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-semibold text-foreground line-clamp-1">
                        {job.title}
                      </h3>
                      <p className="text-sm text-muted-foreground font-medium">
                        {job.company}
                      </p>
                    </div>
                    <MatchScoreBadge
                      score={job.match_score}
                      recommendation={job.recommendation}
                      size="sm"
                    />
                  </div>

                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground mt-3 font-mono">
                    <span>{job.workplace_type}</span>
                    <span>•</span>
                    <span>{job.experience_level || "Junior"}</span>
                    {job.salary_min && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          ${job.salary_min.toLocaleString()}
                        </span>
                      </>
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
                  <h2 className="text-xl font-bold text-foreground">
                    {selectedJob.title}
                  </h2>
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
                {selectedJob.url && (
                  <Button asChild variant="outline" size="icon" className="h-10 w-10 shrink-0">
                    <a
                      href={selectedJob.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open Original Posting"
                      aria-label="Open original job posting"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
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

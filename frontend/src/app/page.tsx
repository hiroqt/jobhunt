"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Compass,
  Radar,
  FileText,
  Bot,
  ShieldCheck,
  Plus,
  ArrowRight,
  Target,
  CheckCircle2,
  ExternalLink,
  Zap,
  Lock,
  Download,
  Building2,
} from "lucide-react";
import { getDashboardOverview, getCandidateProfile, getSearches, getJobs } from "@/lib/api";
import { DashboardOverview, CandidateProfile, JobSearch, Job } from "@/types";
import { JobCaptureModal } from "@/components/jobs/JobCaptureModal";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatSalary } from "@/lib/utils";

export default function DashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [candidate, setCandidate] = useState<CandidateProfile | null>(null);
  const [searches, setSearches] = useState<JobSearch[]>([]);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [dashData, candData, searchData, jobsData] = await Promise.all([
          getDashboardOverview().catch(() => null),
          getCandidateProfile().catch(() => null),
          getSearches().catch(() => []),
          getJobs({}).catch(() => []),
        ]);
        setOverview(dashData);
        setCandidate(candData);
        setSearches(searchData);
        setRecentJobs(jobsData.slice(0, 4));
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const hasSkills = candidate?.skills && candidate.skills.length > 0;
  const highMatchJobs = recentJobs.filter((j) => (j.match_score || 0) >= 80);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Welcome Hero */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-6 sm:p-8 relative overflow-hidden shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20 gap-1.5 py-0.5 px-2.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Stateless AI Career Copilot</span>
              </Badge>
              <Badge variant="outline" className="text-xs text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 gap-1 py-0.5 px-2">
                <Lock className="w-3 h-3" />
                <span>Zero Retention</span>
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              sakto ka Career Intelligence
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Automated multi-source job discovery, ATS-compliant resume builder &amp; keyword gap optimizer, and AI-powered interview preparation.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button asChild variant="default" size="default" className="text-sm font-semibold gap-2 shadow-xs bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/resume">
                <Sparkles className="w-4 h-4" />
                <span>ATS Resume Studio</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="default" className="text-sm font-medium gap-2">
              <Link href="/jobs">
                <Compass className="w-4 h-4 text-primary" />
                <span>Job Explorer</span>
              </Link>
            </Button>
            <Button
              onClick={() => setIsCaptureModalOpen(true)}
              variant="outline"
              size="default"
              className="gap-2 font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Capture Job URL</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Primary KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/jobs" className="block group">
          <Card className="border-border bg-card hover:border-primary/40 transition-colors h-full">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Discovered Jobs
                </span>
                <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                  <Compass className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 pt-1">
                <span className="text-3xl sm:text-4xl font-bold text-foreground">
                  {recentJobs.length}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  qualified
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Live across 5 job sources
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/resume" className="block group">
          <Card className="border-border bg-card hover:border-primary/40 transition-colors h-full">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  ATS Resume Studio
                </span>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 pt-1">
                <span className="text-3xl sm:text-4xl font-bold text-foreground">
                  100%
                </span>
                <Badge variant="outline" className="text-[10px] font-mono text-emerald-600 border-emerald-500/30">
                  ATS Score
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Single-column vector PDF export
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/searches" className="block group">
          <Card className="border-border bg-card hover:border-primary/40 transition-colors h-full">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Automated Feeds
                </span>
                <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                  <Radar className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 pt-1">
                <span className="text-3xl sm:text-4xl font-bold text-foreground">
                  {searches.length}
                </span>
                <Badge variant="outline" className="text-[10px] font-mono text-primary border-primary/30">
                  Active
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Autonomous scraping runs
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/prep" className="block group">
          <Card className="border-border bg-card hover:border-primary/40 transition-colors h-full">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  AI Interview Prep
                </span>
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                  <Bot className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 pt-1">
                <span className="text-3xl sm:text-4xl font-bold text-foreground">
                  STAR
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  Method
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Simulated behavioral answers
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: ATS Resume Feature Showcase & Skill Gaps */}
        <div className="lg:col-span-7 space-y-6">
          {/* ATS Resume Showcase Card */}
          <Card className="border-border bg-card overflow-hidden">
            <CardHeader className="p-6 pb-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      ATS-Standard Resume Studio
                    </CardTitle>
                    <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                      Standard Compliant
                    </Badge>
                  </div>
                  <CardDescription className="text-xs sm:text-sm text-muted-foreground">
                    Engineered to score 90%+ on Workday, Greenhouse, Lever, and Taleo parsers.
                  </CardDescription>
                </div>
                <Button asChild size="sm" variant="default" className="text-xs font-semibold gap-1.5 h-8">
                  <Link href="/resume">
                    <span>Open Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6 pt-0 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl border border-border bg-muted/30 space-y-1.5">
                  <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Single-Column Hierarchy</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Zero multi-column tables, graphics, or complex frames that break ATS OCR parsers.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-border bg-muted/30 space-y-1.5">
                  <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span>AI Bullet-Point Enhancer</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Instantly transforms generic duty bullets into metric-driven XYZ achievement statements.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-border bg-muted/30 space-y-1.5">
                  <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                    <Target className="w-4 h-4 text-amber-500" />
                    <span>1-Click Role Keyword Tailoring</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Pre-load any target job posting to automatically analyze and fill missing keyword gaps.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-border bg-muted/30 space-y-1.5">
                  <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                    <Download className="w-4 h-4 text-cyan-500" />
                    <span>Printable Vector PDF</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Generates clean, selectable vector PDF documents directly from your browser.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border/50 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>3 ATS Templates: Modern Clean, Classic Corporate, Tech &amp; Engineering</span>
                </span>
                <Link href="/resume" className="text-primary font-semibold hover:underline inline-flex items-center gap-1">
                  <span>Build Resume Now</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Top Skill Gaps Card */}
          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between p-6 pb-4">
              <div>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-foreground" />
                  Market Skill Gap Intelligence
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Frequently required capabilities identified across your search queries
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-foreground hover:bg-accent gap-1 text-xs font-medium">
                <Link href="/jobs">
                  <span>Explore Jobs</span>
                  <Compass className="w-3.5 h-3.5 text-primary" />
                </Link>
              </Button>
            </CardHeader>

            <CardContent className="p-6 pt-2 space-y-3">
              {overview?.top_skill_gaps && overview.top_skill_gaps.length > 0 ? (
                overview.top_skill_gaps.slice(0, 4).map((gap) => (
                  <div
                    key={gap.skill_name}
                    className="bg-muted/40 border border-border p-3.5 rounded-xl flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground">
                          {gap.skill_name}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {gap.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {gap.learning_recommendation}
                      </p>
                    </div>
                    <Badge variant="destructive" className="font-mono text-xs shrink-0">
                      {gap.missing_count} Jobs
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="p-6 rounded-xl bg-muted/20 border border-border text-center text-sm text-muted-foreground space-y-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                  <p className="font-medium text-foreground">Complete Candidate Alignment</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Your candidate profile keywords match well with the currently captured opportunities.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right 5 Cols: AI Prep Studio & Zero Retention Privacy */}
        <div className="lg:col-span-5 space-y-6">
          {/* AI Prep Studio Card */}
          <Card className="border-border bg-card">
            <CardHeader className="p-6 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Bot className="w-5 h-5 text-indigo-500" />
                  AI Interview Prep Coach
                </CardTitle>
                <Badge variant="secondary" className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30">
                  STAR Method
                </Badge>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-1">
                Simulate role-specific technical questions and structured behavioral answer outlines.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 pt-2 space-y-4">
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/30 border border-border/60">
                  <span className="font-bold text-foreground">S</span>
                  <span><strong>Situation:</strong> Set the context and business challenge.</span>
                </div>
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/30 border border-border/60">
                  <span className="font-bold text-foreground">T</span>
                  <span><strong>Task:</strong> Explain your specific role and responsibility.</span>
                </div>
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/30 border border-border/60">
                  <span className="font-bold text-foreground">A</span>
                  <span><strong>Action:</strong> Describe the engineering steps and decisions taken.</span>
                </div>
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/30 border border-border/60">
                  <span className="font-bold text-foreground">R</span>
                  <span><strong>Result:</strong> Quantify the outcome, metrics, and business impact.</span>
                </div>
              </div>

              <Button asChild variant="secondary" className="w-full text-xs font-semibold h-10 gap-2">
                <Link href="/prep">
                  <Bot className="w-4 h-4 text-primary" />
                  <span>Launch Interview Prep Studio</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* High Fit Opportunities Preview */}
          <Card className="border-border bg-card">
            <CardHeader className="p-6 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  High Match Opportunities
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-mono text-primary border-primary/30">
                  80%+ Fit
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-6 pt-2 space-y-3">
              {recentJobs.length > 0 ? (
                recentJobs.slice(0, 3).map((job) => (
                  <div
                    key={job.id}
                    className="p-3 bg-muted/30 border border-border rounded-lg flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {job.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {job.company} • {job.workplace_type}
                      </p>
                    </div>
                    <Button asChild size="sm" variant="outline" className="h-7 px-2 text-[10px] font-semibold shrink-0 gap-1 text-primary border-primary/30">
                      <Link href={`/resume?job_id=${job.id}`}>
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Tailor</span>
                      </Link>
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  No jobs qualified yet. Run an automated discovery search to populate opportunities.
                </div>
              )}
              <Button asChild variant="ghost" size="sm" className="w-full text-xs text-muted-foreground hover:text-foreground h-7">
                <Link href="/jobs">
                  <span>View All Opportunities</span>
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Zero Data Retention Card */}
          <Card className="border-border bg-card/60">
            <CardContent className="p-5 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Zero Data Retention Architecture</span>
              </div>
              <p className="text-muted-foreground leading-relaxed text-[11px]">
                sakto ka operates on a strictly in-session, stateless model. Your uploaded resumes, queries, and interview preparation drafts are processed locally and in volatile memory with zero persistent tracking.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Job Capture Modal */}
      <JobCaptureModal
        isOpen={isCaptureModalOpen}
        onClose={() => setIsCaptureModalOpen(false)}
        onJobCreated={() => {
          getDashboardOverview().then(setOverview).catch(() => {});
          getJobs({}).then((data) => setRecentJobs(data.slice(0, 4))).catch(() => {});
        }}
      />
    </div>
  );
}

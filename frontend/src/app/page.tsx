"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  KanbanSquare,
  CalendarCheck2,
  AlertCircle,
  Trophy,
  ArrowUpRight,
  CheckCircle2,
  TrendingUp,
  Send,
  Plus,
  ArrowRight,
  Target,
  Radar,
  Compass,
} from "lucide-react";
import { getDashboardOverview, getFollowUps, getCandidateProfile, getSearches } from "@/lib/api";
import { DashboardOverview, FollowUp, CandidateProfile, JobSearch } from "@/types";
import { JobCaptureModal } from "@/components/jobs/JobCaptureModal";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatSalary } from "@/lib/utils";

export default function DashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [candidate, setCandidate] = useState<CandidateProfile | null>(null);
  const [searches, setSearches] = useState<JobSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [dashData, fuData, candData, searchData] = await Promise.all([
          getDashboardOverview(),
          getFollowUps(false),
          getCandidateProfile(),
          getSearches().catch(() => []),
        ]);
        setOverview(dashData);
        setFollowUps(fuData);
        setCandidate(candData);
        setSearches(searchData);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const hasSkills = candidate?.skills && candidate.skills.length > 0;
  const funnel = overview?.funnel || [];
  const maxFunnelCount = Math.max(...funnel.map((f) => f.count), 1);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Welcome Hero */}
      <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              Job Hunt Pipeline & Intelligence
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Automated multi-source job discovery, qualification scoring against your candidate profile, application tracking CRM, and AI interview preparation.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button asChild variant="outline" size="default" className="text-sm font-medium gap-2">
              <Link href="/searches">
                <Radar className="w-4 h-4 text-primary" />
                <span>Automated Searches</span>
              </Link>
            </Button>
            {!hasSkills && (
              <Button asChild variant="outline" size="default" className="text-sm font-medium">
                <Link href="/profile">
                  Upload Resume
                </Link>
              </Button>
            )}
            <Button
              onClick={() => setIsCaptureModalOpen(true)}
              variant="default"
              size="default"
              className="gap-2 font-semibold text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Job URL</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Primary KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border bg-card">
          <CardContent className="p-5 sm:p-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Active Pipeline
              </span>
              <div className="p-2 rounded-lg bg-muted text-foreground">
                <KanbanSquare className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-3xl sm:text-4xl font-bold text-foreground">
                {overview?.active_applications ?? 0}
              </span>
              <span className="text-sm text-muted-foreground font-mono">
                / {overview?.total_applications ?? 0} total
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              In active stage review
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-5 sm:p-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Saved Searches
              </span>
              <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
                <Radar className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-3xl sm:text-4xl font-bold text-foreground">
                {searches.length}
              </span>
              <Badge variant="outline" className="text-xs font-mono text-primary border-primary/30">
                Active
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Scanning 5 job sources
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-5 sm:p-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Interviews
              </span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CalendarCheck2 className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-3xl sm:text-4xl font-bold text-foreground">
                {overview?.interviews_scheduled ?? 0}
              </span>
              <Badge variant="success" className="text-xs font-mono">
                Scheduled
              </Badge>
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              Multi-round ready
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-5 sm:p-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Job Offers
              </span>
              <div className="p-2 rounded-lg bg-muted text-foreground">
                <Trophy className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-3xl sm:text-4xl font-bold text-foreground">
                {overview?.offers_received ?? 0}
              </span>
              <span className="text-sm text-muted-foreground font-mono">
                Extended
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {candidate?.target_salary && candidate.target_salary > 0
                ? `Goal: ${formatSalary(candidate.target_salary, candidate.currency, true)}`
                : "Target salary unconfigured"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Pipeline Funnel & Skill Gaps */}
        <div className="lg:col-span-2 space-y-6">
          {/* Funnel Card */}
          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between p-6 pb-4">
              <div>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-foreground" />
                  Application Conversion Funnel
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground mt-0.5">
                  Retention through application milestones
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-foreground hover:bg-accent gap-1 text-sm font-medium">
                <Link href="/applications">
                  <span>View Pipeline</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </Button>
            </CardHeader>

            <CardContent className="p-6 pt-2 space-y-4">
              {funnel.length > 0 ? (
                funnel.map((item) => {
                  const pct = item.count > 0 ? Math.round((item.count / maxFunnelCount) * 100) : 0;
                  return (
                    <div key={item.stage} className="space-y-1.5">
                      <div className="flex justify-between text-sm font-medium">
                        <span className="text-foreground">{item.stage}</span>
                        <span className="font-mono text-foreground font-semibold">
                          {item.count}{" "}
                          <span className="text-muted-foreground text-xs font-normal">
                            ({item.conversion_rate_pct}%)
                          </span>
                        </span>
                      </div>
                      <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Loading application funnel progression...
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Skill Gaps Card */}
          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between p-6 pb-4">
              <div>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-foreground" />
                  Skill Gap Intelligence
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground mt-0.5">
                  Frequent requirements missing from your target applications
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-foreground hover:bg-accent gap-1 text-sm font-medium">
                <Link href="/analytics">
                  <span>Analytics</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </Button>
            </CardHeader>

            <CardContent className="p-6 pt-2 space-y-3">
              {overview?.top_skill_gaps && overview.top_skill_gaps.length > 0 ? (
                overview.top_skill_gaps.map((gap) => (
                  <div
                    key={gap.skill_name}
                    className="bg-muted/40 border border-border p-4 rounded-lg flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground">
                          {gap.skill_name}
                        </span>
                        <Badge variant="outline" className="text-xs font-mono">
                          {gap.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {gap.learning_recommendation}
                      </p>
                    </div>
                    <Badge variant="destructive" className="font-mono text-xs shrink-0">
                      {gap.missing_count} Jobs
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="p-6 rounded-lg bg-muted/20 border border-border text-center text-sm text-muted-foreground">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
                  Your skill profile aligns with all currently tracked job postings!
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Urgent Action Queue & AI Prep Studio */}
        <div className="space-y-6">
          {/* Urgent Follow-ups Card */}
          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between p-6 pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Follow-ups Queue
              </CardTitle>
              <Badge variant="warning" className="font-mono text-xs">
                {followUps.length} Due
              </Badge>
            </CardHeader>

            <CardContent className="p-6 pt-2 space-y-3">
              {followUps.length > 0 ? (
                followUps.slice(0, 3).map((fu) => (
                  <div
                    key={fu.id}
                    className="p-4 bg-muted/30 border border-border rounded-lg space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {fu.job_title || "Application"}
                        </p>
                        {fu.company_name && (
                          <p className="text-xs text-muted-foreground font-medium">
                            {fu.company_name}
                          </p>
                        )}
                      </div>
                      <Badge variant="warning" className="text-xs font-mono shrink-0">
                        {fu.follow_up_type}
                      </Badge>
                    </div>
                    {fu.notes && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {fu.notes}
                      </p>
                    )}
                    <Button asChild variant="ghost" size="sm" className="h-7 px-0 text-xs text-foreground font-semibold gap-1.5 hover:bg-transparent hover:underline">
                      <Link href="/applications">
                        <Send className="w-3.5 h-3.5" />
                        <span>Open Follow-Up & Email Draft</span>
                      </Link>
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No pending follow-ups due today.
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Prep Studio Card */}
          <Card className="border-border bg-card">
            <CardContent className="p-6 space-y-3">
              <h3 className="text-base font-semibold text-foreground">
                Interview Prep Studio
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Generate technical questions and structured STAR answer blueprints for your upcoming interviews.
              </p>
              <Button asChild variant="secondary" className="w-full text-sm font-semibold h-10 gap-2">
                <Link href="/prep">
                  <span>Open Prep Studio</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Job Capture Modal */}
      <JobCaptureModal
        isOpen={isCaptureModalOpen}
        onClose={() => setIsCaptureModalOpen(false)}
        onJobCreated={() => {
          getDashboardOverview().then(setOverview);
        }}
      />
    </div>
  );
}

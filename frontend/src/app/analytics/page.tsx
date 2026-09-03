"use client";

import React, { useEffect, useState } from "react";
import {
  LineChart,
  TrendingUp,
  Target,
  BarChart3,
  CheckCircle2,
} from "lucide-react";
import { getDashboardOverview } from "@/lib/api";
import { DashboardOverview } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getDashboardOverview();
        setOverview(data);
      } catch (err) {
        console.error("Error loading analytics data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalApps = overview?.total_applications ?? 0;
  const activeApps = overview?.active_applications ?? 0;
  const responseRate = overview?.response_rate_pct ?? 0;
  const conversionRate = overview?.interview_conversion_rate_pct ?? 0;
  const avgMatch = overview?.average_match_score ?? 0;

  const funnel = overview?.funnel || [];
  const maxFunnelCount = Math.max(...funnel.map((f) => f.count), 1);
  const skillGaps = overview?.top_skill_gaps || [];
  const sources = overview?.source_breakdown || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header: Clean typography, no gradient, no eyebrow */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight flex items-center gap-3">
          <LineChart className="w-7 h-7 text-zinc-100" />
          Career Analytics
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Quantitative conversion rates, pipeline yields, and skill gap root cause analysis.
        </p>
      </div>

      {/* Top Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border bg-card">
          <CardContent className="p-5 sm:p-6 space-y-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Applications
            </span>
            <div className="text-3xl sm:text-4xl font-bold text-zinc-100 pt-1">
              {totalApps}
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              {activeApps} currently active
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-5 sm:p-6 space-y-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Response Rate
            </span>
            <div className="text-3xl sm:text-4xl font-bold text-zinc-100 pt-1">
              {responseRate}%
            </div>
            <p className="text-xs text-muted-foreground">App to recruiter contact</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-5 sm:p-6 space-y-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Interview Conversion
            </span>
            <div className="text-3xl sm:text-4xl font-bold text-zinc-100 pt-1">
              {conversionRate}%
            </div>
            <p className="text-xs text-muted-foreground">Interview to offer progress</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-5 sm:p-6 space-y-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Average Match Fit
            </span>
            <div className="text-3xl sm:text-4xl font-bold text-zinc-100 pt-1">
              {avgMatch}%
            </div>
            <p className="text-xs text-muted-foreground">Across saved opportunities</p>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel & Skill Gap Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Funnel */}
        <Card className="border-border bg-card">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-zinc-100" />
              Application Progression Funnel
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Candidate drop-off and conversion rates per stage
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-2 space-y-4">
            {funnel.length > 0 ? (
              funnel.map((item) => {
                const pct = item.count > 0 ? Math.round((item.count / maxFunnelCount) * 100) : 0;
                return (
                  <div key={item.stage} className="space-y-1.5">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-foreground">{item.stage}</span>
                      <span className="font-mono text-zinc-100 font-semibold">
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
                No application data logged yet.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Channel Yield */}
        <Card className="border-border bg-card">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-zinc-100" />
              Source & Channel Yield
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Effectiveness by job board and application source
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-2 space-y-3">
            {sources.length > 0 ? (
              sources.map((src) => (
                <div
                  key={src.source}
                  className="bg-muted/40 border border-border p-4 rounded-lg flex items-center justify-between gap-3"
                >
                  <div>
                    <span className="text-sm font-semibold text-zinc-100">{src.source}</span>
                    <p className="text-xs text-muted-foreground font-mono">
                      {src.applications_count} applied • {src.interviews_count} interviews
                    </p>
                  </div>
                  <Badge variant="success" className="font-mono text-xs">
                    {src.interview_rate_pct}% Yield
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Tracking source attribution as you apply to jobs.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Skill Gap Analysis Deep-Dive */}
      <Card className="border-border bg-card">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-zinc-100" />
            Skill Gap Root Cause Analysis
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Technologies and frameworks frequently requested across your tracked jobs but absent in your profile
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 pt-2">
          {skillGaps.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {skillGaps.map((gap) => (
                <div
                  key={gap.skill_name}
                  className="bg-muted/30 border border-border p-4 rounded-lg space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-zinc-100">{gap.skill_name}</span>
                    <Badge variant="destructive" className="font-mono text-xs">
                      {gap.missing_count} Jobs
                    </Badge>
                  </div>
                  <Badge variant="outline" className="text-xs font-mono">
                    {gap.category}
                  </Badge>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {gap.learning_recommendation}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 bg-muted/20 border border-border rounded-lg text-center text-sm text-muted-foreground space-y-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
              <p className="font-semibold text-zinc-100">Zero Skill Deficits Detected</p>
              <p className="text-xs text-muted-foreground">
                All critical skills demanded across your saved jobs exist in your verified profile!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

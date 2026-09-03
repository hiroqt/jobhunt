"use client";

import React, { useEffect, useState } from "react";
import {
  LayoutGrid,
  List,
  Plus,
  Clock,
} from "lucide-react";
import { getApplications, updateApplicationStatus } from "@/lib/api";
import { Application, ApplicationStage } from "@/types";
import { MatchScoreBadge } from "@/components/jobs/MatchScoreBadge";
import { ApplicationModal } from "@/components/kanban/ApplicationModal";
import { JobCaptureModal } from "@/components/jobs/JobCaptureModal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const COLUMNS: { id: ApplicationStage; title: string }[] = [
  { id: "SAVED", title: "Saved & Wishlist" },
  { id: "APPLIED", title: "Applied" },
  { id: "HR_SCREENING", title: "Screening" },
  { id: "TECHNICAL_INTERVIEW", title: "Interview" },
  { id: "OFFER", title: "Offer Extended" },
];

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const loadApps = async () => {
    setLoading(true);
    try {
      const data = await getApplications();
      setApplications(data);
    } catch (err) {
      console.error("Error fetching applications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApps();
  }, []);

  const handleDragStart = (e: React.DragEvent, appId: string) => {
    e.dataTransfer.setData("application/json", JSON.stringify({ appId }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: ApplicationStage) => {
    e.preventDefault();
    try {
      const data = e.dataTransfer.getData("application/json");
      if (!data) return;
      const { appId } = JSON.parse(data);

      const targetApp = applications.find((a) => a.id === appId);
      if (!targetApp || targetApp.status === targetStatus) return;

      // Optimistic update
      setApplications((prev) =>
        prev.map((app) => (app.id === appId ? { ...app, status: targetStatus } : app))
      );

      // Persist to backend
      await updateApplicationStatus(appId, targetStatus);
    } catch (err) {
      console.error("Error moving application:", err);
      loadApps();
    }
  };

  const openAppDetail = (app: Application) => {
    setSelectedApp(app);
    setIsModalOpen(true);
  };

  const getDaysAgo = (dateStr?: string) => {
    if (!dateStr) return "Saved";
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
    return days === 0 ? "Today" : `${days}d ago`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Application Pipeline
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Track applications from Saved to Offer. Drag & drop between stages or manage interview logs.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-muted p-1 rounded-lg border border-border">
            <Button
              variant={viewMode === "kanban" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("kanban")}
              className="h-8 px-3 text-xs font-semibold gap-1.5"
              aria-label="Kanban board view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Board</span>
            </Button>
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="h-8 px-3 text-xs font-semibold gap-1.5"
              aria-label="Table list view"
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </Button>
          </div>

          <Button
            variant="outline"
            size="default"
            onClick={() => setShowArchived(!showArchived)}
            className={cn(
              "text-sm font-medium h-10 px-4",
              showArchived && "bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300"
            )}
          >
            {showArchived ? "Hide Closed" : "Show Closed"}
          </Button>

          <Button
            onClick={() => setIsCaptureModalOpen(true)}
            variant="default"
            size="default"
            className="gap-2 font-semibold text-sm h-10 px-4"
          >
            <Plus className="w-4 h-4" />
            <span>Add Job</span>
          </Button>
        </div>
      </div>

      {viewMode === "kanban" ? (
        /* Kanban Horizontal Board */
        <div className="flex gap-4 overflow-x-auto pb-6 min-h-[70vh]">
          {COLUMNS.map((col) => {
            const colApps = applications.filter((app) => app.status === col.id);

            return (
              <div
                key={col.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
                className="w-80 shrink-0 bg-card border border-border rounded-xl flex flex-col max-h-[80vh] overflow-hidden shadow-sm"
              >
                {/* Column Header */}
                <div className="p-4 border-b border-border bg-muted/40 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
                  <Badge variant="outline" className="font-mono text-xs">
                    {colApps.length}
                  </Badge>
                </div>

                {/* Card List in Column */}
                <div className="p-3 overflow-y-auto flex-1 space-y-3">
                  {colApps.length > 0 ? (
                    colApps.map((app) => (
                      <div
                        key={app.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, app.id)}
                        onClick={() => openAppDetail(app)}
                        tabIndex={0}
                        role="button"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") openAppDetail(app);
                        }}
                        className="bg-background hover:bg-accent/40 border border-border p-4 rounded-lg cursor-grab active:cursor-grabbing transition-colors shadow-xs group relative space-y-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-semibold text-foreground line-clamp-1">
                              {app.job?.title || "Software Engineer"}
                            </h4>
                            <p className="text-xs text-muted-foreground font-medium mt-0.5">
                              {app.job?.company || "Company"}
                            </p>
                          </div>
                          {app.job && (
                            <MatchScoreBadge
                              score={app.job.match_score}
                              recommendation={app.job.recommendation}
                              size="sm"
                            />
                          )}
                        </div>

                        {/* Location & Meta info */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground font-mono pt-2 border-t border-border">
                          <span>{app.job?.workplace_type || "Remote"}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                            {getDaysAgo(app.applied_date || app.created_at)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-32 border border-dashed border-border rounded-lg flex items-center justify-center text-xs text-muted-foreground font-medium select-none">
                      Drop applications here
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Optional Rejected/Archived Column */}
          {showArchived && (
            <div
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, "REJECTED")}
              className="w-80 shrink-0 bg-card border border-rose-500/20 rounded-xl flex flex-col max-h-[80vh] overflow-hidden shadow-sm"
            >
              <div className="p-4 border-b border-border bg-rose-500/10 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-rose-700 dark:text-rose-300">Rejected / Closed</h3>
                <Badge variant="destructive" className="font-mono text-xs">
                  {applications.filter((a) => a.status === "REJECTED" || a.status === "WITHDRAWN").length}
                </Badge>
              </div>
              <div className="p-3 overflow-y-auto flex-1 space-y-3">
                {applications
                  .filter((a) => a.status === "REJECTED" || a.status === "WITHDRAWN")
                  .map((app) => (
                    <div
                      key={app.id}
                      onClick={() => openAppDetail(app)}
                      className="bg-background border border-border p-4 rounded-lg cursor-pointer hover:border-rose-500/50 space-y-2"
                    >
                      <h4 className="text-sm font-semibold text-foreground">{app.job?.title}</h4>
                      <p className="text-xs text-muted-foreground">{app.job?.company}</p>
                      <Badge variant="destructive" className="text-xs font-mono">
                        {app.status}
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Table List View */
        <Card className="border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left" aria-label="Applications table">
              <thead className="bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Role & Company</th>
                  <th className="px-6 py-4">Stage</th>
                  <th className="px-6 py-4">Match Score</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Last Activity</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {applications.map((app) => (
                  <tr
                    key={app.id}
                    onClick={() => openAppDetail(app)}
                    className="hover:bg-accent/40 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground text-sm">{app.job?.title || "Role"}</div>
                      <div className="text-xs text-muted-foreground">{app.job?.company}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="font-mono text-xs">
                        {app.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {app.job && (
                        <MatchScoreBadge
                          score={app.job.match_score}
                          recommendation={app.job.recommendation}
                          size="sm"
                        />
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-sm">
                      {app.job?.location || "Remote"} ({app.job?.workplace_type})
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-mono text-xs">
                      {getDaysAgo(app.applied_date || app.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" className="text-foreground text-xs font-semibold">
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Application Detail Modal */}
      <ApplicationModal
        application={selectedApp}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdated={(updated) => {
          setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
          setSelectedApp(updated);
        }}
      />

      <JobCaptureModal
        isOpen={isCaptureModalOpen}
        onClose={() => setIsCaptureModalOpen(false)}
        onJobCreated={() => {
          loadApps();
        }}
      />
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarCheck2,
  Clock,
  Video,
  User,
  ExternalLink,
  Plus,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { getInterviews, updateInterview, createInterview, getApplications } from "@/lib/api";
import { Interview, Application } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [selectedAppId, setSelectedAppId] = useState("");
  const [roundName, setRoundName] = useState("Technical Interview");
  const [scheduledAt, setScheduledAt] = useState("");
  const [interviewers, setInterviewers] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [prepNotes, setPrepNotes] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [ivs, apps] = await Promise.all([getInterviews(), getApplications()]);
      setInterviews(ivs);
      setApplications(apps);
      if (apps.length > 0) {
        setSelectedAppId(apps[0].id);
      }
    } catch (err) {
      console.error("Error fetching interview data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateOutcome = async (
    interviewId: string,
    outcome: "PASSED" | "FAILED" | "PENDING"
  ) => {
    try {
      const updated = await updateInterview(interviewId, { outcome });
      setInterviews((prev) =>
        prev.map((iv) => (iv.id === interviewId ? { ...iv, outcome: updated.outcome } : iv))
      );
    } catch (err) {
      console.error("Error updating interview outcome:", err);
    }
  };

  const handleCreateInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppId) return;

    try {
      const newIv = await createInterview({
        application_id: selectedAppId,
        round_name: roundName,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        interviewers: interviewers || undefined,
        meeting_link: meetingLink || undefined,
        prep_notes: prepNotes || undefined,
      });
      setInterviews((prev) => [newIv, ...prev]);
      setShowAddModal(false);
      // Reset
      setMeetingLink("");
      setInterviewers("");
      setPrepNotes("");
    } catch (err) {
      console.error("Error scheduling interview:", err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Interviews
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Log scheduled technical, screening, and final rounds with debrief notes.
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          variant="default"
          className="gap-2 font-semibold text-sm h-10 px-4 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Round</span>
        </Button>
      </div>

      {/* Interviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            Loading scheduled interview rounds...
          </div>
        ) : interviews.length === 0 ? (
          <Card className="border-border bg-card p-12 text-center space-y-3">
            <CalendarCheck2 className="w-10 h-10 text-muted-foreground mx-auto" />
            <h3 className="text-base font-semibold text-foreground">No interview rounds logged yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              When a company schedules a screening or technical assessment, log it here to prepare answer points.
            </p>
            <Button
              onClick={() => setShowAddModal(true)}
              variant="default"
              size="sm"
              className="font-semibold text-sm"
            >
              Log First Interview
            </Button>
          </Card>
        ) : (
          interviews.map((iv) => (
            <Card
              key={iv.id}
              className="border-border bg-card hover:border-primary/30 transition-colors shadow-sm"
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-lg font-semibold text-foreground">{iv.round_name}</h3>
                      <Badge
                        variant={
                          iv.outcome === "PASSED"
                            ? "success"
                            : iv.outcome === "FAILED"
                            ? "destructive"
                            : "outline"
                        }
                        className="font-mono text-xs"
                      >
                        {iv.outcome}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground font-medium mt-0.5">
                      {iv.job_title || "Software Engineer"} @ {iv.company_name || "Company"}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button asChild variant="outline" size="sm" className="h-8 text-xs font-semibold">
                      <Link href="/prep">
                        Prep Guide
                      </Link>
                    </Button>
                    <Button
                      onClick={() => handleUpdateOutcome(iv.id, "PASSED")}
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs font-semibold gap-1 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-500/10"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Passed</span>
                    </Button>
                    <Button
                      onClick={() => handleUpdateOutcome(iv.id, "FAILED")}
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs font-semibold gap-1 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 hover:bg-rose-500/10"
                    >
                      <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      <span>Failed</span>
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  {iv.scheduled_at && (
                    <div className="bg-muted/40 p-3 rounded-lg border border-border flex items-center gap-2.5 text-foreground">
                      <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="font-mono">{new Date(iv.scheduled_at).toLocaleString()}</span>
                    </div>
                  )}
                  {iv.interviewers && (
                    <div className="bg-muted/40 p-3 rounded-lg border border-border flex items-center gap-2.5 text-foreground">
                      <User className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="truncate">{iv.interviewers}</span>
                    </div>
                  )}
                  {iv.meeting_link && (
                    <div className="bg-muted/40 p-3 rounded-lg border border-border flex items-center gap-2.5 text-foreground min-w-0">
                      <Video className="w-4 h-4 text-muted-foreground shrink-0" />
                      <a
                        href={iv.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-foreground hover:underline truncate flex items-center gap-1 font-medium"
                      >
                        <span>Join Link</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    </div>
                  )}
                </div>

                {iv.prep_notes && (
                  <div className="bg-muted/30 p-4 rounded-lg border border-border text-sm text-muted-foreground leading-relaxed">
                    <span className="text-xs text-foreground uppercase font-semibold tracking-wider block mb-1">
                      Preparation Notes:
                    </span>
                    {iv.prep_notes}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Schedule Interview Dialog Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-lg p-6 space-y-4 border-border bg-card shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-foreground">
              Schedule Interview Round
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Add upcoming meeting details, interviewers, and study points
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateInterview} className="space-y-4 text-sm">
            <div className="space-y-1.5">
              <label htmlFor="target-app-select" className="block text-foreground font-medium">
                Target Application
              </label>
              <select
                id="target-app-select"
                required
                value={selectedAppId}
                onChange={(e) => setSelectedAppId(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring font-medium h-10"
              >
                {applications.map((app) => (
                  <option key={app.id} value={app.id} className="bg-background text-foreground">
                    {app.job?.title} @ {app.job?.company}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="round-type-select" className="block text-foreground font-medium">
                Round Type
              </label>
              <select
                id="round-type-select"
                value={roundName}
                onChange={(e) => setRoundName(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring font-medium h-10"
              >
                <option value="Recruiter Screening">Recruiter Screening</option>
                <option value="Technical Interview">Technical Interview</option>
                <option value="Take-Home Coding Assessment">Take-Home Coding Assessment</option>
                <option value="System Design">System Design</option>
                <option value="Behavioral / Leadership">Behavioral / Leadership</option>
                <option value="Final Executive Round">Final Executive Round</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="scheduled-date-input" className="block text-foreground font-medium">
                Date & Time
              </label>
              <Input
                id="scheduled-date-input"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="h-10 text-sm bg-background border-border"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="interviewers-input" className="block text-foreground font-medium">
                Interviewer(s) Name & Role
              </label>
              <Input
                id="interviewers-input"
                type="text"
                placeholder="e.g. Dave Miller (Engineering Lead)"
                value={interviewers}
                onChange={(e) => setInterviewers(e.target.value)}
                className="h-10 text-sm bg-background border-border"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="meeting-link-input" className="block text-foreground font-medium">
                Meeting Link
              </label>
              <Input
                id="meeting-link-input"
                type="url"
                placeholder="https://meet.google.com/..."
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                className="h-10 text-sm bg-background border-border"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="prep-notes-input" className="block text-foreground font-medium">
                Preparation Notes
              </label>
              <Textarea
                id="prep-notes-input"
                rows={3}
                placeholder="Key architecture concepts or questions to review beforehand..."
                value={prepNotes}
                onChange={(e) => setPrepNotes(e.target.value)}
                className="text-sm bg-background border-border"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddModal(false)}
                className="text-sm"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                className="text-sm font-semibold"
              >
                Schedule Round
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

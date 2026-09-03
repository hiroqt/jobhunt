"use client";

import React, { useState, useEffect } from "react";
import {
  Building,
  MapPin,
  Calendar,
  Send,
  History,
  CheckCircle2,
  Clock,
  Loader2,
  AlertTriangle,
  FileText,
  User,
  Copy,
  Check,
} from "lucide-react";
import { Application, ApplicationStage } from "@/types";
import { updateApplicationStatus, updateApplication, generateFollowUpEmail } from "@/lib/api";
import { MatchScoreBadge } from "@/components/jobs/MatchScoreBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface ApplicationModalProps {
  application: Application | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updatedApp: Application) => void;
}

const STAGES: { value: ApplicationStage; label: string }[] = [
  { value: "SAVED", label: "Saved / Wishlist" },
  { value: "QUALIFIED", label: "Qualified" },
  { value: "APPLIED", label: "Applied" },
  { value: "APPLICATION_VIEWED", label: "Viewed" },
  { value: "HR_SCREENING", label: "HR / Recruiter Screen" },
  { value: "TECHNICAL_INTERVIEW", label: "Technical Interview" },
  { value: "FINAL_INTERVIEW", label: "Final Round" },
  { value: "OFFER", label: "Offer Extended" },
  { value: "REJECTED", label: "Rejected" },
  { value: "WITHDRAWN", label: "Withdrawn" },
];

export const ApplicationModal: React.FC<ApplicationModalProps> = ({
  application,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "email">("overview");
  const [status, setStatus] = useState<ApplicationStage>(application?.status || "SAVED");
  const [transitionNotes, setTransitionNotes] = useState("");
  const [recruiterName, setRecruiterName] = useState(application?.recruiter_name || "");
  const [recruiterEmail, setRecruiterEmail] = useState(application?.recruiter_email || "");
  const [notes, setNotes] = useState(application?.notes || "");
  const [loading, setLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState<{ subject: string; body: string } | null>(null);

  useEffect(() => {
    if (application) {
      setStatus(application.status);
      setRecruiterName(application.recruiter_name || "");
      setRecruiterEmail(application.recruiter_email || "");
      setNotes(application.notes || "");
    }
  }, [application]);

  if (!application) return null;

  const handleStatusChange = async (newStatus: ApplicationStage) => {
    setStatus(newStatus);
    setLoading(true);
    try {
      const updated = await updateApplicationStatus(application.id, newStatus, transitionNotes || undefined);
      onUpdated(updated);
      setTransitionNotes("");
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    setLoading(true);
    try {
      const updated = await updateApplication(application.id, {
        recruiter_name: recruiterName,
        recruiter_email: recruiterEmail,
        notes: notes,
      });
      onUpdated(updated);
    } catch (err: any) {
      alert(err.message || "Failed to save changes");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateEmail = async (emailType: string = "STATUS_CHECK") => {
    setEmailLoading(true);
    try {
      const res = await generateFollowUpEmail({
        application_id: application.id,
        email_type: emailType,
        interviewer_name: recruiterName || undefined,
        topics_discussed: notes || undefined,
      });
      setGeneratedEmail({ subject: res.subject, body: res.body });
    } catch (err: any) {
      alert(err.message || "Failed to generate email");
    } finally {
      setEmailLoading(false);
    }
  };

  const copyEmail = () => {
    if (!generatedEmail) return;
    navigator.clipboard.writeText(`${generatedEmail.subject}\n\n${generatedEmail.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0 border-border bg-card shadow-xl">
        {/* Header */}
        <DialogHeader className="p-6 border-b border-border bg-card">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-3">
                <DialogTitle className="text-xl font-semibold text-zinc-100">
                  {application.job?.title || "Application"}
                </DialogTitle>
                {application.job && (
                  <MatchScoreBadge
                    score={application.job.match_score}
                    recommendation={application.job.recommendation}
                    size="sm"
                  />
                )}
              </div>
              <DialogDescription className="text-sm text-zinc-300 font-medium mt-1">
                {application.job?.company} • {application.job?.location || "Remote"} ({application.job?.workplace_type || "Full-time"})
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Stage Selector Bar */}
        <div className="px-6 py-3 bg-muted/40 border-b border-border flex items-center gap-3 overflow-x-auto">
          <label htmlFor="stage-selector" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0">
            Pipeline Stage:
          </label>
          <select
            id="stage-selector"
            value={status}
            onChange={(e) => handleStatusChange(e.target.value as ApplicationStage)}
            disabled={loading}
            className="bg-background border border-border text-foreground font-semibold text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {STAGES.map((s) => (
              <option key={s.value} value={s.value} className="text-foreground bg-background">
                {s.label}
              </option>
            ))}
          </select>
          {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        </div>

        {/* Tabs & Content */}
        <div className="p-6 space-y-4">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "overview" | "timeline" | "email")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview" className="flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4" /> Details & Notes
              </TabsTrigger>
              <TabsTrigger value="timeline" className="flex items-center gap-2 text-sm">
                <History className="w-4 h-4" /> Stage History ({application.timeline.length})
              </TabsTrigger>
              <TabsTrigger value="email" className="flex items-center gap-2 text-sm">
                <Send className="w-4 h-4" /> Follow-Up Drafts
              </TabsTrigger>
            </TabsList>

            {/* Tab: Overview / Notes */}
            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="recruiter-name-input" className="block text-sm font-medium text-foreground">
                    Recruiter / Contact Name
                  </label>
                  <Input
                    id="recruiter-name-input"
                    type="text"
                    value={recruiterName}
                    onChange={(e) => setRecruiterName(e.target.value)}
                    placeholder="e.g. Sarah Jenkins (Hiring Manager)"
                    className="h-10 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="recruiter-email-input" className="block text-sm font-medium text-foreground">
                    Recruiter Email / LinkedIn
                  </label>
                  <Input
                    id="recruiter-email-input"
                    type="text"
                    value={recruiterEmail}
                    onChange={(e) => setRecruiterEmail(e.target.value)}
                    placeholder="sarah@company.com"
                    className="h-10 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="application-notes-input" className="block text-sm font-medium text-foreground">
                  Application Notes & Interview Points
                </label>
                <Textarea
                  id="application-notes-input"
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record custom details, conversation talking points, and specific salary figures..."
                  className="text-sm font-normal"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleSaveNotes}
                  disabled={loading}
                  variant="default"
                  className="text-sm font-semibold"
                >
                  Save Notes
                </Button>
              </div>
            </TabsContent>

            {/* Tab: Timeline */}
            <TabsContent value="timeline" className="space-y-3 mt-4">
              <p className="text-sm text-muted-foreground">
                Audit trail of stage transitions recorded in your pipeline:
              </p>
              <div className="border-l-2 border-border ml-3 pl-4 space-y-4">
                {application.timeline.map((entry, idx) => (
                  <div key={entry.id || idx} className="relative">
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-400 absolute -left-[21px] top-1" />
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-100">
                        {entry.new_status}
                      </span>
                      {entry.previous_status && (
                        <span className="text-xs text-muted-foreground font-mono">
                          (from {entry.previous_status})
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground font-mono ml-auto">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {entry.notes && (
                      <p className="text-sm text-muted-foreground mt-1 bg-muted/40 p-3 rounded-lg border border-border">
                        {entry.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Tab: Follow-up Email Generator */}
            <TabsContent value="email" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <Button
                  onClick={() => handleGenerateEmail("STATUS_CHECK")}
                  disabled={emailLoading}
                  variant="outline"
                  className="h-11 justify-start gap-2 text-sm font-medium"
                >
                  <Clock className="w-4 h-4 text-amber-400" />
                  Day 5 Status Check Email
                </Button>
                <Button
                  onClick={() => handleGenerateEmail("POST_INTERVIEW_THANK_YOU")}
                  disabled={emailLoading}
                  variant="outline"
                  className="h-11 justify-start gap-2 text-sm font-medium"
                >
                  <Send className="w-4 h-4 text-zinc-100" />
                  Post-Interview Thank You
                </Button>
              </div>

              {emailLoading && (
                <div className="text-center py-6 text-muted-foreground text-sm flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Drafting customized follow-up email...
                </div>
              )}

              {generatedEmail && (
                <Card className="border-border bg-card">
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                        Subject Line:
                      </span>
                      <p className="text-sm font-semibold text-zinc-100 mt-0.5">
                        {generatedEmail.subject}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                        Draft Body:
                      </span>
                      <pre className="text-sm text-foreground font-sans whitespace-pre-wrap leading-relaxed mt-1 bg-background p-4 rounded-lg border border-border">
                        {generatedEmail.body}
                      </pre>
                    </div>
                    <Button
                      onClick={copyEmail}
                      variant="success"
                      size="sm"
                      className="gap-1.5 font-semibold text-xs"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Copied to Clipboard
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy Email Text
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

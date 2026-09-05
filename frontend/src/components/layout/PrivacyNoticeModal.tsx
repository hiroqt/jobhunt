"use client";

import React from "react";
import {
  Shield,
  ShieldCheck,
  Lock,
  Trash2,
  Cpu,
  EyeOff,
  Server,
  FileCheck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PrivacyNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyNoticeModal: React.FC<PrivacyNoticeModalProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-4 sm:p-7">
        <DialogHeader className="space-y-2 border-b border-border/70 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-lg sm:text-xl font-bold text-foreground">
                  Privacy Notice & Data Security
                </DialogTitle>
                <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5 font-mono">
                  Zero-Retention
                </Badge>
              </div>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                How sakto ka safeguards your candidate profile, resume data, and job search intelligence.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-sm">
          {/* Key Principle Highlight */}
          <div className="p-4 rounded-xl bg-secondary/60 border border-border/80 flex items-start gap-3.5">
            <Lock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-semibold text-foreground text-sm">
                Strict Ephemeral Session Isolation
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your data is stored in a private, isolated sandbox database tied exclusively to your active browser session. No cross-visitor sharing or permanent cloud aggregation occurs.
              </p>
            </div>
          </div>

          {/* Detailed Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-3.5 rounded-xl border border-border bg-card space-y-1.5">
              <div className="flex items-center gap-2 text-foreground font-semibold text-xs sm:text-sm">
                <EyeOff className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Zero Tracking & Ad Pixels</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We do not use marketing trackers, behavior cookies, or data brokers. Your searches and target compensation remain 100% confidential.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-card space-y-1.5">
              <div className="flex items-center gap-2 text-foreground font-semibold text-xs sm:text-sm">
                <Cpu className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>Stateless AI Processing</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                AI match evaluations and interview simulations use stateless inference models with zero data retention for training.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-card space-y-1.5">
              <div className="flex items-center gap-2 text-foreground font-semibold text-xs sm:text-sm">
                <Server className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Job Redirection & Platform Auth</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Direct job links redirect you straight to employer/ATS websites. We do not bypass login gates or store your external platform credentials; destination portals enforce their own authentication when you view or apply.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-card space-y-1.5">
              <div className="flex items-center gap-2 text-foreground font-semibold text-xs sm:text-sm">
                <Trash2 className="w-4 h-4 text-rose-500 shrink-0" />
                <span>1-Click Instant Data Purge</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Use the <span className="font-semibold text-foreground">Reset Session</span> button in the top header at any time to instantly delete all your applications, interview notes, and profile records.
              </p>
            </div>
          </div>

          {/* Compliance & Standards */}
          <div className="p-3.5 rounded-xl border border-border/60 bg-muted/30 text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <FileCheck className="w-3.5 h-3.5 text-primary" />
              <span>Candidate Rights & Control</span>
            </div>
            <p>
              You maintain 100% ownership of your resume content, application status logs, salary benchmarks, and AI preparation transcripts. You can export or clear your pipeline data anytime.
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-border/70 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground font-mono">
            Security Standard v2.4 • Ephemeral Mode
          </span>
          <Button onClick={onClose} variant="default" size="sm" className="font-semibold text-xs px-4">
            Understood
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

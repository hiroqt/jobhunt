"use client";

import React, { useState } from "react";
import { RotateCcw, ShieldCheck, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resetGuestSession } from "@/lib/api";

export const SessionResetButton: React.FC = () => {
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleReset = async () => {
    setIsResetting(true);
    await resetGuestSession();
  };

  return (
    <div className="relative flex items-center">
      {!showConfirm ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowConfirm(true)}
          className="h-9 px-3 gap-1.5 text-xs font-medium border-border/80 bg-muted/30 hover:bg-muted/60 text-muted-foreground hover:text-foreground"
          title="This is an ephemeral demo session. All data is wiped when you close the tab or click reset."
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="hidden lg:inline">Guest Session</span>
          <RotateCcw className="w-3.5 h-3.5 ml-0.5 text-muted-foreground" />
        </Button>
      ) : (
        <div className="flex items-center gap-1.5 bg-card border border-destructive/30 rounded-lg p-1 shadow-md z-40 animate-in fade-in-0 duration-100">
          <span className="text-[11px] font-medium text-destructive px-1.5">Reset all data?</span>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleReset}
            disabled={isResetting}
            className="h-7 px-2 text-xs font-semibold"
          >
            {isResetting ? "Resetting..." : "Yes, Reset"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowConfirm(false)}
            disabled={isResetting}
            className="h-7 px-2 text-xs text-muted-foreground"
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};

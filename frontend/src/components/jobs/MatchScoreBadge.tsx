import React from "react";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MatchScoreBadgeProps {
  score?: number;
  recommendation?: "APPLY" | "REVIEW" | "SKIP" | string;
  size?: "sm" | "md" | "lg";
  showScore?: boolean;
  className?: string;
}

export const MatchScoreBadge: React.FC<MatchScoreBadgeProps> = ({
  score = 0,
  recommendation = "REVIEW",
  size = "md",
  showScore = true,
  className,
}) => {
  const rec = (recommendation || "").toUpperCase();

  let badgeStyle = "bg-amber-950/60 border-amber-800 text-amber-300";
  let Icon = AlertTriangle;
  let label = "REVIEW";

  if (rec === "APPLY" || score >= 75) {
    badgeStyle = "bg-emerald-950/60 border-emerald-800 text-emerald-300";
    Icon = CheckCircle2;
    label = "APPLY";
  } else if (rec === "SKIP" || score < 50) {
    badgeStyle = "bg-rose-950/60 border-rose-800 text-rose-300";
    Icon = XCircle;
    label = "SKIP";
  }

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-2.5 py-1 text-xs font-semibold gap-1.5",
    lg: "px-3.5 py-1.5 text-sm font-bold gap-2",
  };

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-4.5 h-4.5",
  };

  return (
    <div
      role="status"
      aria-label={`Match recommendation: ${label}${showScore && score > 0 ? `, score ${score}%` : ""}`}
      className={cn(
        "inline-flex items-center rounded-md border font-semibold select-none",
        badgeStyle,
        sizeClasses[size],
        className
      )}
    >
      <Icon className={iconSizes[size]} aria-hidden="true" />
      <span>{label}</span>
      {showScore && score > 0 && (
        <span className="font-mono text-xs ml-0.5 opacity-90 font-bold">
          ({score}%)
        </span>
      )}
    </div>
  );
};

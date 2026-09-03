"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Compass,
  KanbanSquare,
  CalendarCheck2,
  GraduationCap,
  LineChart,
  UserCheck,
  Menu,
  X,
  Briefcase,
  ChevronRight,
} from "lucide-react";
import { CandidateProfile, DashboardOverview } from "@/types";
import { getCandidateProfile, getDashboardOverview } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    // Load candidate profile
    getCandidateProfile()
      .then(setProfile)
      .catch(() => {});

    // Load actual live counts from API - no hardcoded numbers!
    getDashboardOverview()
      .then(setOverview)
      .catch(() => {});
  }, [pathname]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const activeAppsCount = overview?.active_applications ?? 0;
  const scheduledInterviewsCount = overview?.interviews_scheduled ?? 0;

  const navItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      name: "Job Explorer",
      href: "/jobs",
      icon: Compass,
      badge: null,
    },
    {
      name: "Application Pipeline",
      href: "/applications",
      icon: KanbanSquare,
      // Only show badge if count is genuinely > 0
      badge: activeAppsCount > 0 ? `${activeAppsCount}` : null,
    },
    {
      name: "Interviews",
      href: "/interviews",
      icon: CalendarCheck2,
      // Only show badge if count is genuinely > 0
      badge: scheduledInterviewsCount > 0 ? `${scheduledInterviewsCount}` : null,
    },
    {
      name: "AI Prep Studio",
      href: "/prep",
      icon: GraduationCap,
      badge: null,
    },
    {
      name: "Career Analytics",
      href: "/analytics",
      icon: LineChart,
      badge: null,
    },
    {
      name: "Candidate Profile",
      href: "/profile",
      icon: UserCheck,
      badge: null,
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-card border-r border-border select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-border flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Briefcase className="w-5 h-5 text-zinc-100 shrink-0" />
          <div>
            <h1 className="font-semibold text-base tracking-tight text-zinc-100">
              Job Hunt Pipeline
            </h1>
            <p className="text-xs text-muted-foreground">
              Career Management System
            </p>
          </div>
        </Link>
        {mobileOpen && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation menu"
            className="md:hidden text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Navigation Menu */}
      <nav
        aria-label="Main Navigation"
        className="flex-1 py-5 px-3.5 space-y-1.5 overflow-y-auto"
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-secondary text-zinc-100 font-semibold shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive ? "text-zinc-100" : "text-muted-foreground"
                  )}
                  aria-hidden="true"
                />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <Badge
                  variant={isActive ? "default" : "secondary"}
                  className="text-xs px-2 py-0 font-mono"
                >
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Profile / Quick Status Footer */}
      <div className="p-4 border-t border-border bg-card">
        <Link
          href="/profile"
          aria-label="View Candidate Profile"
          className="bg-background hover:bg-accent border border-border rounded-lg p-3.5 flex items-center justify-between gap-3 transition-colors group block"
        >
          <div className="min-w-0 space-y-0.5">
            <p className="text-sm font-semibold text-foreground truncate">
              {profile?.full_name || "Configure Profile"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {profile?.skills && profile.skills.length > 0
                ? `${profile.skills.length} skills verified`
                : "Add profile details"}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Trigger Button */}
      <div className="md:hidden fixed top-3 left-3 z-40">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={mobileOpen}
          className="h-10 w-10 border-border bg-card text-foreground shadow"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {/* Desktop Sticky Sidebar */}
      <aside className="hidden md:flex w-64 h-screen sticky top-0 shrink-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {mobileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation Menu"
          className="fixed inset-0 z-50 md:hidden flex"
        >
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

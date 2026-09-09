"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DashboardSquare01Icon as LayoutDashboard,
  Compass01Icon as Compass,
  ChartRadarIcon as Radar,
  Briefcase01Icon as Briefcase,
  Mortarboard01Icon as GraduationCap,
  File01Icon as FileText,
  UserCheck01Icon as UserCheck,
  Menu01Icon as Menu,
  Cancel01Icon as X,
  ArrowRight01Icon as ChevronRight,
  Shield01Icon as Shield,
  BookOpen01Icon as BookOpen
} from "hugeicons-react";
import { CandidateProfile, DashboardOverview, Job } from "@/types";
import { getCandidateProfile, getDashboardOverview } from "@/lib/api";
import { CoverLetterSidebar } from "@/components/jobs/CoverLetterSidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { AppLogo } from "@/components/layout/AppLogo";
import { PrivacyNoticeModal } from "@/components/layout/PrivacyNoticeModal";
import { GuidelinesModal } from "@/components/layout/GuidelinesModal";
import { useOnboarding } from "@/context/OnboardingContext";
import { TikTokIcon, GitHubIcon } from "@/components/layout/SocialIcons";
import { cn } from "@/lib/utils";

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { startTour } = useOnboarding();
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  // Curated Cover Letter Studio Drawer State
  const [coverLetterSidebarOpen, setCoverLetterSidebarOpen] = useState(false);
  const [coverLetterJob, setCoverLetterJob] = useState<Job | null>(null);
  const [coverLetterUrl, setCoverLetterUrl] = useState<string>("");

  useEffect(() => {
    const handleOpenStudio = (e: any) => {
      const detail = e.detail || {};
      if (detail.job) setCoverLetterJob(detail.job);
      if (detail.url) setCoverLetterUrl(detail.url);
      setCoverLetterSidebarOpen(true);
    };
    window.addEventListener("open-cover-letter-studio", handleOpenStudio);
    return () => window.removeEventListener("open-cover-letter-studio", handleOpenStudio);
  }, []);

  useEffect(() => {
    // Load candidate profile
    getCandidateProfile()
      .then(setProfile)
      .catch(() => {});

    // Load overview
    getDashboardOverview()
      .then(setOverview)
      .catch(() => {});
  }, [pathname]);

  // Re-fetch profile when saved from the profile page
  useEffect(() => {
    const handleProfileUpdate = () => {
      getCandidateProfile()
        .then(setProfile)
        .catch(() => {});
    };
    window.addEventListener("profile-updated", handleProfileUpdate);
    return () => window.removeEventListener("profile-updated", handleProfileUpdate);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const navItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      name: "Discover a Job",
      href: "/searches",
      icon: Radar,
      badge: null,
    },
    {
      name: "Job Explorer",
      href: "/jobs",
      icon: Briefcase,
      badge: null,
    },
    {
      name: "ATS Resume Studio",
      href: "/resume",
      icon: FileText,
      badge: null,
    },
    {
      name: "AI Prep Studio",
      href: "/prep",
      icon: GraduationCap,
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
      <div className="p-5 border-b border-border flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <AppLogo size="md" />
          <div>
            <h1 className="font-bold text-base tracking-tight text-foreground group-hover:text-primary transition-colors capitalize">
              sakto ka
            </h1>
            <p className="text-[11px] text-muted-foreground font-medium">
              Career Intelligence System
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
                  ? "bg-secondary text-foreground font-semibold shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive ? "text-foreground" : "text-muted-foreground"
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

        {/* Curated Cover Letter Studio Trigger */}
        <button
          type="button"
          onClick={() => {
            setCoverLetterSidebarOpen(true);
            setMobileOpen(false);
          }}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors group text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <span>Cover Letter Studio</span>
          </div>
          <Badge
            variant="secondary"
            className="text-xs px-2 py-0 font-mono"
          >
            NEW
          </Badge>
        </button>
      </nav>

      {/* Bottom Profile / Quick Status Footer */}
      <div className="p-4 border-t border-border bg-card space-y-2.5">
        <Link
          href="/profile"
          aria-label="View Candidate Profile"
          className="bg-background hover:bg-accent border border-border rounded-lg p-3 flex items-center justify-between gap-3 transition-colors group block"
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

        {/* Guidelines, Walkthrough & Privacy Notice Quick Links */}
        <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-border/50">
          <button
            type="button"
            onClick={startTour}
            className="w-full flex items-center justify-center gap-1 px-1.5 py-1.5 rounded-md border border-border/80 bg-background hover:bg-muted text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            title="Start Step-by-Step Walkthrough"
          >
            <Compass className="w-3 h-3 text-indigo-500 shrink-0" />
            <span className="truncate">Tour</span>
          </button>
          <GuidelinesModal
            customTrigger={
              <button
                type="button"
                className="w-full flex items-center justify-center gap-1 px-1.5 py-1.5 rounded-md border border-border/80 bg-background hover:bg-muted text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                title="Guidelines & Best Practices"
              >
                <BookOpen className="w-3 h-3 text-primary shrink-0" />
                <span className="truncate">Guide</span>
              </button>
            }
          />
          <button
            type="button"
            onClick={() => setPrivacyOpen(true)}
            className="w-full flex items-center justify-center gap-1 px-1.5 py-1.5 rounded-md border border-border/80 bg-background hover:bg-muted text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            title="Privacy Notice"
          >
            <Shield className="w-3 h-3 text-emerald-500 shrink-0" />
            <span className="truncate">Privacy</span>
          </button>
        </div>

        <div className="flex items-center justify-between px-1 pt-1 text-xs text-muted-foreground">
          <span>Theme Mode</span>
          <ThemeToggle />
        </div>

        {/* App Builders PH Embed */}
        <div className="pt-2 border-t border-border/50 flex justify-center items-center">
          <iframe
            src="https://appbuildersph.com/embed/apps/sakto-ka"
            title="Sakto Ka votes on App Builders PH"
            width="320"
            height="72"
            style={{ border: 0 }}
            className="w-full max-w-full rounded-md"
            loading="lazy"
            scrolling="no"
          />
        </div>

        {/* Creator Attribution */}
        <div className="pt-2 border-t border-border/50 text-center space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <span>Created by</span>
            <a
              href="https://github.com/hiroqt"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-foreground hover:text-primary transition-colors"
            >
              <GitHubIcon className="w-3 h-3 text-foreground shrink-0" />
              <span>hiroqt / Arnel Baylon</span>
            </a>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
            <span>TikTok:</span>
            <a
              href="https://www.tiktok.com/@yheelllls"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-foreground hover:text-primary transition-colors"
            >
              <TikTokIcon className="w-3 h-3 shrink-0" />
              <span>@yheelllls</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <PrivacyNoticeModal
        isOpen={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
      />
      {/* Mobile Menu Trigger Button */}
      <div className="md:hidden fixed top-3 left-3 z-40">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={mobileOpen}
          className="h-9 w-9 border-border bg-card text-foreground shadow-sm"
        >
          <Menu className="w-4 h-4" />
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200 overflow-y-auto">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Slide-Over Curated Cover Letter Studio Drawer */}
      <CoverLetterSidebar
        isOpen={coverLetterSidebarOpen}
        onClose={() => setCoverLetterSidebarOpen(false)}
        initialJob={coverLetterJob}
        initialUrl={coverLetterUrl}
      />
    </>
  );
};

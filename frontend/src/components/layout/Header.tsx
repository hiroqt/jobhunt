"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Add01Icon as Plus,
  Search01Icon as Search,
  CommandIcon as Command,
  Notification01Icon as Bell,
  CheckmarkCircle02Icon as CheckCircle2,
  Target01Icon as Target,
  Clock01Icon as Clock,
  Layers01Icon as Layers,
  Compass01Icon as Compass,
  Cancel01Icon as X
} from "hugeicons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { JobCaptureModal } from "@/components/jobs/JobCaptureModal";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Notification } from "@/types";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/api";
import { SessionResetButton } from "@/components/layout/SessionResetButton";
import { GuidelinesModal } from "@/components/layout/GuidelinesModal";
import { useOnboarding } from "@/context/OnboardingContext";

interface HeaderProps {
  onRefresh?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onRefresh }) => {
  const router = useRouter();
  const { startTour } = useOnboarding();
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Notifications State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifsOpen, setNotifsOpen] = useState(false);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  async function loadNotifications() {
    try {
      const data = await getNotifications(10);
      setNotifications(data.notifications);
      setUnreadCount(data.unread_count);
    } catch {
      // ignore
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleNotificationClick(notif: Notification) {
    if (!notif.read) {
      await markNotificationRead(notif.id).catch(() => {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    setNotifsOpen(false);

    if (notif.data?.job_id) {
      router.push("/jobs");
    } else if (notif.data?.search_id) {
      router.push("/searches");
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "Escape" && notifsOpen) {
        setNotifsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [notifsOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/jobs?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/jobs");
    }
  };

  return (
    <>
      <header
        role="banner"
        className="h-16 border-b border-border bg-card/95 backdrop-blur px-3 sm:px-6 pl-14 sm:pl-16 md:pl-6 flex items-center justify-between sticky top-0 z-30 shadow-sm"
      >
        {/* Search Bar with functional navigation */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 sm:gap-3 w-full max-w-md min-w-0 mr-2 sm:mr-4">
          <div className="relative w-full">
            <Search
              className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-muted-foreground absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <Input
              ref={searchInputRef}
              type="search"
              aria-label="Search jobs, skills, or companies"
              placeholder="Search jobs, skills, companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 sm:pl-10 pr-3 sm:pr-12 h-9 sm:h-10 text-xs sm:text-sm bg-background border-border"
            />
            <kbd className="hidden sm:inline-flex absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none h-5 select-none items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-xs text-muted-foreground">
              <Command className="w-3 h-3" />K
            </kbd>
          </div>
        </form>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Notifications Dropdown Trigger */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setNotifsOpen(!notifsOpen);
                if (!notifsOpen) loadNotifications();
              }}
              className="relative h-9 w-9 sm:h-10 sm:w-10 text-muted-foreground hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-2 h-2 rounded-full bg-primary ring-2 ring-background" />
              )}
            </Button>

            {/* Click-outside backdrop overlay */}
            {notifsOpen && (
              <div
                className="fixed inset-0 z-40 bg-transparent"
                onClick={() => setNotifsOpen(false)}
                aria-hidden="true"
              />
            )}

            {/* Dropdown Popup / Mobile Responsive Modal */}
            {notifsOpen && (
              <div
                role="dialog"
                aria-label="Notifications"
                className="fixed inset-x-3 top-[4.25rem] sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-96 max-w-none sm:max-w-sm rounded-2xl sm:rounded-xl border border-border bg-white dark:bg-zinc-900 text-card-foreground shadow-2xl p-3.5 sm:p-3 z-50 animate-in fade-in-0 zoom-in-95 duration-150 flex flex-col max-h-[75dvh] sm:max-h-96"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-border/60 shrink-0">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="font-semibold text-xs sm:text-sm text-foreground">Notifications</span>
                    {unreadCount > 0 ? (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-mono bg-primary/10 text-primary border-primary/20">
                        {unreadCount} new
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-muted-foreground font-mono">
                        0 unread
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-primary hover:underline font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setNotifsOpen(false)}
                      className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors -mr-1"
                      aria-label="Close notifications"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Notifications Scrollable List */}
                <div className="space-y-1.5 overflow-y-auto max-h-[58dvh] sm:max-h-72 overscroll-contain pr-0.5">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8 px-4 space-y-2">
                      <div className="w-9 h-9 rounded-full bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
                        <Bell className="w-4 h-4" />
                      </div>
                      <p className="text-xs font-semibold text-foreground">No new notifications</p>
                      <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                        High match opportunities and crawler results will appear here automatically.
                      </p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`p-2.5 sm:p-3 rounded-xl border text-xs cursor-pointer transition-all active:scale-[0.99] ${
                          !n.read
                            ? "bg-primary/5 border-primary/20 hover:bg-primary/10"
                            : "border-border/50 hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          {n.type === "HIGH_MATCH" ? (
                            <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                              <Target className="w-3.5 h-3.5" />
                            </div>
                          ) : (
                            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0 mt-0.5">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </div>
                          )}
                          <div className="space-y-0.5 min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1.5">
                              <p className="font-semibold text-foreground text-xs truncate">
                                {n.title}
                              </p>
                              {!n.read && (
                                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                              {n.message}
                            </p>
                            <span className="text-[10px] font-mono text-muted-foreground/70 block pt-0.5">
                              {new Date(n.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="hidden lg:flex">
            <SessionResetButton />
          </div>

          <div className="hidden md:flex">
            <Button
              variant="ghost"
              size="icon"
              onClick={startTour}
              className="h-10 w-10 text-muted-foreground hover:text-foreground relative rounded-lg"
              aria-label="Start Step-by-Step Walkthrough"
              title="Interactive Tour & Onboarding"
            >
              <Compass className="w-4 h-4 text-indigo-500" />
            </Button>
          </div>

          <div className="hidden md:flex">
            <GuidelinesModal />
          </div>

          <div className="hidden sm:flex">
            <ThemeToggle />
          </div>

          <Button
            id="tour-add-job-url"
            onClick={() => setIsCaptureModalOpen(true)}
            variant="default"
            size="default"
            aria-label="Capture and qualify new job posting"
            className="flex items-center gap-1.5 sm:gap-2 font-semibold text-xs sm:text-sm h-9 sm:h-10 px-2.5 sm:px-4 shrink-0"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Add Job URL</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </header>

      {/* Quick Job Capture Modal */}
      <JobCaptureModal
        isOpen={isCaptureModalOpen}
        onClose={() => setIsCaptureModalOpen(false)}
        onJobCreated={() => {
          if (onRefresh) onRefresh();
        }}
      />
    </>
  );
};

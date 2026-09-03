"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Command, Bell, CheckCircle2, Sparkles, Clock, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { JobCaptureModal } from "@/components/jobs/JobCaptureModal";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Notification } from "@/types";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/api";

interface HeaderProps {
  onRefresh?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onRefresh }) => {
  const router = useRouter();
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
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
        className="h-16 border-b border-border bg-card/95 backdrop-blur px-4 sm:px-6 pl-16 md:pl-6 flex items-center justify-between sticky top-0 z-30 shadow-sm"
      >
        {/* Search Bar with functional navigation */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 w-full max-w-md">
          <div className="relative w-full">
            <Search
              className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <Input
              ref={searchInputRef}
              type="search"
              aria-label="Search jobs, skills, or companies"
              placeholder="Search jobs, skills, companies... (Press Enter)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-12 h-10 text-sm bg-background border-border"
            />
            <kbd className="hidden sm:inline-flex absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none h-5 select-none items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-xs text-muted-foreground">
              <Command className="w-3 h-3" />K
            </kbd>
          </div>
        </form>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 ml-4 shrink-0">
          {/* Notifications Dropdown Trigger */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setNotifsOpen(!notifsOpen);
                if (!notifsOpen) loadNotifications();
              }}
              className="relative h-10 w-10 text-muted-foreground hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary ring-2 ring-background" />
              )}
            </Button>

            {/* Dropdown Popup */}
            {notifsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-border bg-card shadow-xl p-3 z-50 animate-in fade-in-0 zoom-in-95 duration-100">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/60">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs text-foreground">Notifications</span>
                    {unreadCount > 0 && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                        {unreadCount} new
                      </Badge>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-primary hover:underline font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">
                      No notifications yet.
                    </p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                          !n.read
                            ? "bg-primary/5 border-primary/20 hover:bg-primary/10"
                            : "border-transparent hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {n.type === "HIGH_MATCH" ? (
                            <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          )}
                          <div className="space-y-0.5 min-w-0">
                            <p className="font-semibold text-foreground text-[11px] truncate leading-tight">
                              {n.title}
                            </p>
                            <p className="text-[11px] text-muted-foreground line-clamp-2 leading-normal">
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

          <ThemeToggle />

          <Button
            onClick={() => setIsCaptureModalOpen(true)}
            variant="default"
            size="default"
            aria-label="Capture and qualify new job posting"
            className="flex items-center gap-2 font-semibold text-sm h-10 px-4"
          >
            <Plus className="w-4 h-4" />
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

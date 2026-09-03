"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { JobCaptureModal } from "@/components/jobs/JobCaptureModal";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

interface HeaderProps {
  onRefresh?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onRefresh }) => {
  const router = useRouter();
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

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

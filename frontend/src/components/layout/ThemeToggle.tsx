"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon, Laptop, Check } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  variant?: "dropdown" | "button";
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = "dropdown",
  className,
}) => {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label="Toggle theme"
        className={cn(
          "w-9 h-9 rounded-lg border border-border bg-background/50 text-muted-foreground transition-colors",
          className
        )}
      >
        <Moon className="w-4 h-4 opacity-70" />
      </Button>
    );
  }

  if (variant === "button") {
    return (
      <Button
        variant="outline"
        size="icon"
        onClick={toggleTheme}
        aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
        title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
        className={cn(
          "w-9 h-9 rounded-lg border border-border bg-card hover:bg-accent text-foreground transition-all duration-200 shadow-sm relative overflow-hidden",
          className
        )}
      >
        <Sun
          className={cn(
            "w-4 h-4 transition-transform duration-300 absolute",
            resolvedTheme === "dark"
              ? "scale-0 rotate-90 opacity-0"
              : "scale-100 rotate-0 opacity-100 text-amber-500"
          )}
        />
        <Moon
          className={cn(
            "w-4 h-4 transition-transform duration-300 absolute",
            resolvedTheme === "dark"
              ? "scale-100 rotate-0 opacity-100 text-indigo-400"
              : "scale-0 -rotate-90 opacity-0"
          )}
        />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label="Select theme"
          title="Change theme (Light / Dark / System)"
          className={cn(
            "w-9 h-9 rounded-lg border border-border bg-card hover:bg-accent text-foreground transition-all duration-200 shadow-sm relative overflow-hidden",
            className
          )}
        >
          <Sun
            className={cn(
              "w-4 h-4 transition-all duration-300 absolute",
              resolvedTheme === "dark"
                ? "scale-0 rotate-90 opacity-0"
                : "scale-100 rotate-0 opacity-100 text-amber-500"
            )}
          />
          <Moon
            className={cn(
              "w-4 h-4 transition-all duration-300 absolute",
              resolvedTheme === "dark"
                ? "scale-100 rotate-0 opacity-100 text-indigo-400"
                : "scale-0 -rotate-90 opacity-0"
            )}
          />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-36 rounded-xl border border-border bg-card/95 backdrop-blur shadow-lg p-1.5 space-y-0.5"
      >
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className={cn(
            "flex items-center justify-between text-xs font-medium cursor-pointer rounded-lg px-2.5 py-2 transition-colors",
            theme === "light"
              ? "bg-accent text-accent-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          )}
        >
          <div className="flex items-center gap-2">
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>Light</span>
          </div>
          {theme === "light" && <Check className="w-3.5 h-3.5 text-primary" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className={cn(
            "flex items-center justify-between text-xs font-medium cursor-pointer rounded-lg px-2.5 py-2 transition-colors",
            theme === "dark"
              ? "bg-accent text-accent-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          )}
        >
          <div className="flex items-center gap-2">
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
            <span>Dark</span>
          </div>
          {theme === "dark" && <Check className="w-3.5 h-3.5 text-primary" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className={cn(
            "flex items-center justify-between text-xs font-medium cursor-pointer rounded-lg px-2.5 py-2 transition-colors",
            theme === "system"
              ? "bg-accent text-accent-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          )}
        >
          <div className="flex items-center gap-2">
            <Laptop className="w-3.5 h-3.5 text-muted-foreground" />
            <span>System</span>
          </div>
          {theme === "system" && <Check className="w-3.5 h-3.5 text-primary" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

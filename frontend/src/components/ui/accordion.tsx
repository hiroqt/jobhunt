"use client";

import * as React from "react";
import { ArrowDown01Icon as ChevronDown } from "hugeicons-react";
import { cn } from "@/lib/utils";

interface AccordionContextValue {
  openValues: string[];
  toggleItem: (value: string) => void;
}

const AccordionContext = React.createContext<AccordionContextValue | undefined>(undefined);

export interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "single" | "multiple";
  defaultValue?: string | string[];
}

export const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  ({ type = "single", defaultValue, className, children, ...props }, ref) => {
    const [openValues, setOpenValues] = React.useState<string[]>(() => {
      if (!defaultValue) return [];
      return Array.isArray(defaultValue) ? defaultValue : [defaultValue];
    });

    const toggleItem = React.useCallback(
      (value: string) => {
        setOpenValues((prev) => {
          if (type === "single") {
            return prev.includes(value) ? [] : [value];
          }
          return prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value];
        });
      },
      [type]
    );

    return (
      <AccordionContext.Provider value={{ openValues, toggleItem }}>
        <div ref={ref} className={cn("divide-y divide-border", className)} {...props}>
          {children}
        </div>
      </AccordionContext.Provider>
    );
  }
);
Accordion.displayName = "Accordion";

interface AccordionItemContextValue {
  value: string;
  isOpen: boolean;
}

const AccordionItemContext = React.createContext<AccordionItemContextValue | undefined>(undefined);

export interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ value, className, children, ...props }, ref) => {
    const context = React.useContext(AccordionContext);
    const isOpen = context?.openValues.includes(value) ?? false;

    return (
      <AccordionItemContext.Provider value={{ value, isOpen }}>
        <div ref={ref} className={cn("border-b border-border/60 last:border-b-0", className)} {...props}>
          {children}
        </div>
      </AccordionItemContext.Provider>
    );
  }
);
AccordionItem.displayName = "AccordionItem";

export interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const accordionContext = React.useContext(AccordionContext);
    const itemContext = React.useContext(AccordionItemContext);

    if (!itemContext) return null;
    const { value, isOpen } = itemContext;

    return (
      <button
        ref={ref}
        type="button"
        aria-expanded={isOpen}
        onClick={() => accordionContext?.toggleItem(value)}
        className={cn(
          "flex w-full items-center justify-between py-4 text-left text-base font-semibold transition-all hover:underline cursor-pointer group",
          isOpen ? "text-primary" : "text-foreground",
          className
        )}
        {...props}
      >
        <span>{children}</span>
        <ChevronDown
          className={cn(
            "w-4 h-4 shrink-0 transition-transform duration-200 text-muted-foreground group-hover:text-foreground",
            isOpen && "rotate-180 text-primary"
          )}
        />
      </button>
    );
  }
);
AccordionTrigger.displayName = "AccordionTrigger";

export interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ className, children, ...props }, ref) => {
    const itemContext = React.useContext(AccordionItemContext);
    if (!itemContext || !itemContext.isOpen) return null;

    return (
      <div
        ref={ref}
        className={cn(
          "pb-4 pt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed animate-in fade-in-50 duration-200",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
AccordionContent.displayName = "AccordionContent";

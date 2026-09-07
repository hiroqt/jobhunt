"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  UserCheck01Icon as UserCheck,
  ChartRadarIcon as Radar,
  Briefcase01Icon as Briefcase,
  Mortarboard01Icon as GraduationCap,
  File01Icon as FileText,
  Rocket01Icon as Rocket
} from "hugeicons-react";

export const ONBOARDING_STORAGE_KEY = "sakto_ka_onboarding_v4_completed";

export interface OnboardingStep {
  id: string;
  stepNumber: number; // 0 for welcome, 1-5 for pages
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ElementType;
  accentColor: string;
  targetPath: string;
  targetSelector?: string;
  targetSelectors?: string[];
  indicatorText: string;
  actionInstruction: string;
  highlights: {
    title: string;
    description: string;
  }[];
  proTip: string;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    stepNumber: 0,
    title: "Welcome to sakto ka",
    subtitle:
      "An end-to-end Career Intelligence System engineered to automate discovery, qualify job fit, and prepare you for technical interviews.",
    badge: "Welcome Tour",
    icon: Rocket,
    accentColor: "text-primary",
    targetPath: "/",
    indicatorText: "Begin the 1-minute guided interactive walkthrough",
    actionInstruction: "Click 'Start Guided Walkthrough' below to explore step-by-step",
    highlights: [
      {
        title: "Automated Job Radar",
        description: "Scans LinkedIn, Indeed, JobStreet PH, Kalibrr, and RemoteOK for active tech roles.",
      },
      {
        title: "AI Fit Scoring (0–100%)",
        description: "Instantly checks your skills against role requirements and detects expired links.",
      },
      {
        title: "STAR Prep & ATS Resume",
        description: "Generates role-specific behavioral answers and pixel-perfect 1-page ATS PDF resumes.",
      },
    ],
    proTip: "You can skip any step or exit the tour anytime.",
  },
  {
    id: "profile",
    stepNumber: 1,
    title: "1. Configure Candidate Profile",
    subtitle:
      "Upload your resume and choose an AI Extraction Model to automatically populate your verified technical skills.",
    badge: "Step 1 of 5",
    icon: UserCheck,
    accentColor: "text-blue-500",
    targetPath: "/profile",
    targetSelector: "#tour-profile-resume",
    targetSelectors: ["#tour-profile-dropzone", "#tour-profile-model-select"],
    indicatorText: "Upload Zone (Left) & Extraction Model Selector (Right)",
    actionInstruction: "1️⃣ Drop your PDF/TXT resume in the box, 2️⃣ select an Extraction Model (e.g. OpenRouter Free), and 3️⃣ click 'Auto-Populate Profile'",
    highlights: [
      {
        title: "1. Upload Resume Dropzone",
        description: "Click to select a PDF/TXT resume or paste plain text into the box on the left.",
      },
      {
        title: "2. AI Extraction Model Selection",
        description: "Choose your preferred LLM provider (OpenRouter Free, Gemini, Groq, OpenAI) on the right.",
      },
      {
        title: "3. Auto-Populate & Verify Skills",
        description: "Click 'Auto-Populate Profile' to automatically extract your skills, target roles, and tenure.",
      },
    ],
    proTip: "You can also manually add individual skills in the 'Add Skill to Inventory' section below.",
  },
  {
    id: "searches",
    stepNumber: 2,
    title: "2. Discover a Job (Radar)",
    subtitle:
      "Configure multi-source background crawlers, save search criteria, and click 'Discover Now' to populate fresh opportunities into Step 3.",
    badge: "Step 2 of 5",
    icon: Radar,
    accentColor: "text-purple-500",
    targetPath: "/searches",
    targetSelector: "#tour-search-card-run",
    targetSelectors: [
      "#tour-view-discovered-jobs",
      "#tour-search-card-run",
      "#tour-searches-new-btn",
    ],
    indicatorText: "Click 'Discover Now' ➔ View Discovered Jobs ➔ Job Explorer",
    actionInstruction: "1️⃣ If no search exists, click '+ New Search' ➔ 2️⃣ On active card, click glowing 'Discover Now' ➔ 3️⃣ Click glowing 'View Discovered Jobs' to proceed to Step 3 (Job Explorer)!",
    highlights: [
      {
        title: "1. Configure or Pick Search",
        description: "Click '+ New Search' to set role title presets, target portals (LinkedIn, Indeed, JobStreet), and keywords.",
      },
      {
        title: "2. Click 'Discover Now' on Active Card",
        description: "Hit the glowing 'Discover Now' button on your active configuration to trigger live scraping.",
      },
      {
        title: "3. Discovered Jobs Summary Popup",
        description: "Review new opportunities discovered and duplicates filtered in the completion popup.",
      },
      {
        title: "4. Click 'View Discovered Jobs' ➔ Step 3",
        description: "Click the glowing button to proceed straight to Step 3 (Job Explorer) and inspect 0–100% Fit Scores!",
      },
    ],
    proTip: "Triggering a search with daily frequency continuously surfaces fresh postings before they expire.",
  },
  {
    id: "jobs",
    stepNumber: 3,
    title: "3. Job Explorer & Fit Analysis",
    subtitle:
      "After searches are triggered, review your populated opportunities here, inspect 0–100% Fit Scores, and evaluate matching skills.",
    badge: "Step 3 of 5",
    icon: Briefcase,
    accentColor: "text-emerald-500",
    targetPath: "/jobs",
    targetSelector: "#tour-first-job-card",
    targetSelectors: ["#tour-first-job-card", "#tour-jobs-filter-card"],
    indicatorText: "Review discovered jobs and inspect Match Score & Skill Breakdown",
    actionInstruction: "1️⃣ Review 0–100% Fit Scores on discovered jobs, 2️⃣ click an opportunity to inspect skills & verified link, and 3️⃣ bookmark or prepare for interview!",
    highlights: [
      {
        title: "1. Evaluate 0–100% AI Fit Scores",
        description: "Inspect verified matching skills, missing qualifications, and salary match before applying.",
      },
      {
        title: "2. Discovered Opportunities Stream",
        description: "Browse roles scraped across connected portals, sorted by match percentage and freshness.",
      },
      {
        title: "3. Verify Employer Posting Link",
        description: "Confirm whether the employer portal posting is still active before submitting your resume.",
      },
    ],
    proTip: "Always click 'Verify Link' before applying to confirm the employer portal has not closed the posting.",
  },
  {
    id: "prep",
    stepNumber: 4,
    title: "4. AI Interview Prep Studio",
    subtitle:
      "Prepare for recruiter screens and technical rounds with tailored STAR answers and architectural talking points.",
    badge: "Step 4 of 5",
    icon: GraduationCap,
    accentColor: "text-amber-500",
    targetPath: "/prep",
    targetSelector: "#tour-prep-generate-btn",
    targetSelectors: ["#tour-prep-generate-btn"],
    indicatorText: "Select an opportunity and click 'Generate Prep Kit'",
    actionInstruction: "Generate role-specific STAR answers, skill gap coaching, and deep-dive technical Q&A",
    highlights: [
      {
        title: "STAR Method Answer Models",
        description: "Generates Situation, Task, Action, and Result structured answers tailored to the target role.",
      },
      {
        title: "Skill Gap & Talking Points",
        description: "Identifies technical gaps from job postings and suggests strategic talking points to bridge them.",
      },
      {
        title: "Deep-Dive Technical Scenarios",
        description: "Practice system design challenges and tricky questions specific to the company's tech stack.",
      },
    ],
    proTip: "Generate prep sheets before your initial recruiter screen to have crisp metrics and examples ready.",
  },
  {
    id: "resume",
    stepNumber: 5,
    title: "5. ATS Resume Studio & Builder",
    subtitle:
      "Craft bespoke, ATS-optimized resumes customized for every opportunity to maximize interview callbacks.",
    badge: "Step 5 of 5",
    icon: FileText,
    accentColor: "text-rose-500",
    targetPath: "/resume",
    targetSelector: "#tour-resume-pdf-btn",
    indicatorText: "Select industry template and click 'Download ATS PDF'",
    actionInstruction: "Export a machine-parseable, pixel-perfect 1-page ATS PDF ready to submit",
    highlights: [
      {
        title: "Role-Specific Tailoring",
        description: "Rewrites bullet points to highlight the exact keywords and achievements employers search for.",
      },
      {
        title: "ATS Match Score & Keyword Audit",
        description: "Inspect missing technical keywords, formatting compliance, and impact score before applying.",
      },
      {
        title: "Export to Clean PDF & Markdown",
        description: "Download polished, ATS-safe resumes with one click formatted for applicant tracking systems.",
      },
    ],
    proTip: "Tailoring your resume to match the job description's top keywords drastically improves ATS pass rates.",
  },
];

interface OnboardingContextType {
  isOpen: boolean;
  isGoodLuckOpen: boolean;
  currentStepIndex: number;
  currentStep: OnboardingStep;
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipStep: () => void;
  jumpToStep: (index: number) => void;
  closeTour: () => void;
  completeTour: () => void;
  openGoodLuckModal: () => void;
  closeGoodLuckModal: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isGoodLuckOpen, setIsGoodLuckOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Check initial visit
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const hasCompleted = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (!hasCompleted) {
        const timer = setTimeout(() => {
          setIsOpen(true);
          setCurrentStepIndex(0);
        }, 700);
        return () => clearTimeout(timer);
      }
    } catch {
      // ignore
    }
  }, []);

  // Update target element highlighting in DOM
  useEffect(() => {
    if (!isOpen || currentStepIndex === 0) {
      // Remove any leftover tour highlight classes
      document.querySelectorAll(".tour-highlight-active").forEach((el) => {
        el.classList.remove("tour-highlight-active");
      });
      return;
    }

    const step = ONBOARDING_STEPS[currentStepIndex];
    const selectors = step?.targetSelectors || (step?.targetSelector ? [step.targetSelector] : []);
    if (selectors.length === 0) return;

    const timer = setTimeout(() => {
      // Clean up previous highlights
      document.querySelectorAll(".tour-highlight-active").forEach((el) => {
        el.classList.remove("tour-highlight-active");
      });

      // Special dynamic highlighting for Step 2 (Automated Job Searches)
      if (currentStepIndex === 2) {
        // Priority 1: If Discovery Result modal is open, glow the "View Discovered Jobs" button!
        const viewJobsBtn = document.querySelector("#tour-view-discovered-jobs") as HTMLButtonElement | null;
        if (viewJobsBtn) {
          viewJobsBtn.classList.add("tour-highlight-active");
          viewJobsBtn.scrollIntoView({ behavior: "smooth", block: "center" });
          return;
        }

        // Priority 2: If Create Search modal or other modal is open, let modal internal steps handle highlighting
        const isDialogOpen = document.querySelector('[role="dialog"]');
        if (isDialogOpen) {
          return;
        }

        // Priority 3: If active search card exists, glow "Discover Now"!
        const discoverNowBtn = document.querySelector("#tour-search-card-run") as HTMLButtonElement | null;
        if (discoverNowBtn && !discoverNowBtn.disabled) {
          discoverNowBtn.classList.add("tour-highlight-active");
          discoverNowBtn.scrollIntoView({ behavior: "smooth", block: "center" });
          return;
        }

        // Priority 4: If no active search card exists yet, glow "+ New Search" button!
        const newSearchBtn = document.querySelector("#tour-searches-new-btn") as HTMLButtonElement | null;
        if (newSearchBtn) {
          newSearchBtn.classList.add("tour-highlight-active");
          newSearchBtn.scrollIntoView({ behavior: "smooth", block: "nearest" });
          return;
        }
        return;
      }

      // If a modal/dialog is currently open, DO NOT glow anything on the background page
      const isDialogOpen = document.querySelector('[role="dialog"]');
      if (isDialogOpen) {
        return;
      }

      // Default highlight logic for other steps
      selectors.forEach((sel) => {
        document.querySelectorAll(sel).forEach((el) => {
          // If task is marked done, do not make it glow!
          if (el.getAttribute("data-tour-done") === "true") {
            return;
          }
          el.classList.add("tour-highlight-active");
        });
      });

      const firstEl = document.querySelector(selectors[0]);
      if (firstEl && firstEl.getAttribute("data-tour-done") !== "true") {
        firstEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      document.querySelectorAll(".tour-highlight-active").forEach((el) => {
        el.classList.remove("tour-highlight-active");
      });
    };
  }, [isOpen, currentStepIndex, pathname]);

  const jumpToStep = useCallback(
    (index: number) => {
      const targetStep = ONBOARDING_STEPS[index];
      if (!targetStep) return;

      setCurrentStepIndex(index);
      if (targetStep.targetPath && pathname !== targetStep.targetPath) {
        router.push(targetStep.targetPath);
      }
    },
    [pathname, router]
  );

  const startTour = useCallback(() => {
    setIsOpen(true);
    jumpToStep(1); // Jump straight to Step 1 (/profile)
  }, [jumpToStep]);

  const closeTour = useCallback(() => {
    setIsOpen(false);
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    } catch {
      // ignore
    }
  }, []);

  const openGoodLuckModal = useCallback(() => {
    setIsGoodLuckOpen(true);
  }, []);

  const closeGoodLuckModal = useCallback(() => {
    setIsGoodLuckOpen(false);
  }, []);

  const completeTour = useCallback(() => {
    closeTour();
    setIsGoodLuckOpen(true);
    router.push("/");
  }, [closeTour, router]);

  const nextStep = useCallback(() => {
    if (currentStepIndex < ONBOARDING_STEPS.length - 1) {
      jumpToStep(currentStepIndex + 1);
    } else {
      completeTour();
    }
  }, [currentStepIndex, jumpToStep, completeTour]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 1) {
      jumpToStep(currentStepIndex - 1);
    } else if (currentStepIndex === 1) {
      setCurrentStepIndex(0); // Return to welcome modal
    }
  }, [currentStepIndex, jumpToStep]);

  const skipStep = useCallback(() => {
    nextStep();
  }, [nextStep]);

  const currentStep = ONBOARDING_STEPS[currentStepIndex] || ONBOARDING_STEPS[0];

  const value = useMemo(
    () => ({
      isOpen,
      isGoodLuckOpen,
      currentStepIndex,
      currentStep,
      startTour,
      nextStep,
      prevStep,
      skipStep,
      jumpToStep,
      closeTour,
      completeTour,
      openGoodLuckModal,
      closeGoodLuckModal,
    }),
    [
      isOpen,
      isGoodLuckOpen,
      currentStepIndex,
      currentStep,
      startTour,
      nextStep,
      prevStep,
      skipStep,
      jumpToStep,
      closeTour,
      completeTour,
      openGoodLuckModal,
      closeGoodLuckModal,
    ]
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
};

export const useOnboarding = (): OnboardingContextType => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
};

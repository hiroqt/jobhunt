"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  File01Icon as FileText,
  FlashIcon as Zap,
  ChartRadarIcon as Radar,
  Add01Icon as Plus,
  HelpCircleIcon as HelpCircle
} from "hugeicons-react";
import { JobCaptureModal } from "@/components/jobs/JobCaptureModal";
import { Badge } from "@/components/ui/badge";
import { openCoverLetterStudio } from "@/lib/events";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent
} from "@/components/ui/accordion";

export default function DashboardPage() {
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);

  const faqs = [
    {
      id: "faq-1",
      question: "What is the sakto ka Career Intelligence System?",
      answer:
        "sakto ka is an end-to-end, privacy-first career automation platform designed to assist every phase of your job search. It aggregates and normalizes verified job postings across major platforms, evaluates qualification fit and keyword gaps against your candidate profile, builds ATS-compliant single-column resumes, curates role-tailored cover letters, and generates technical STAR interview preparation drills. All operations run in-session with zero server-side data retention.",
    },
    {
      id: "faq-2",
      question: "How does the Curated Cover Letter Studio tailor letters to job postings?",
      answer:
        "The Cover Letter Studio synthesizes target role qualifications, mandatory skills, and company background with your verified candidate profile. You can curate a letter from an active pipeline opportunity or paste any external job posting link. You can customize the tone (Professional, High-Impact, Technical, Startup) and length (Concise, Standard, Detailed), then copy the result, download it as markdown/text, or attach it directly to your job application.",
    },
    {
      id: "faq-3",
      question: "What makes the ATS Resume Studio different from generic resume builders?",
      answer:
        "Many popular templates use multi-column layouts, tables, text frames, or complex icons that break Applicant Tracking System (ATS) parsers like Workday, Taleo, Greenhouse, and Lever. Our studio strictly generates single-column hierarchy resumes with standard headers, converts generic tasks into quantified XYZ achievement bullets, benchmarks keyword density against target job descriptions, and exports clean, selectable vector PDFs.",
    },
    {
      id: "faq-4",
      question: "Where does Discover Jobs source opportunities and how are links cleaned?",
      answer:
        "The discovery engine queries 5 major job boards: LinkedIn, Indeed, JobStreet, Kalibrr, and Google Jobs. Ingested links pass through an automated tracking stripper that removes tracking tokens, referral codes, and redirect wrappers (like utm_* parameters). The system also runs automated HTTP status validation to alert you if a job posting has expired or closed.",
    },
    {
      id: "faq-5",
      question: "How does the AI Interview Prep Coach help me prepare?",
      answer:
        "When you select a job for preparation, the coach generates targeted technical drills, system design scenarios, and behavioral questions specific to that role. It provides response frameworks using the STAR methodology (Situation, Task, Action, Result) alongside interview cheat sheets and role-specific question banks.",
    },
    {
      id: "faq-6",
      question: "What is the Zero Data Retention and Stateless Privacy Guarantee?",
      answer:
        "Privacy is central to sakto ka. Your uploaded resumes, parsed links, AI prompts, and generated drafts are processed entirely in-session and volatile memory. We never sell or persistently store candidate resumes, contact information, or application history on remote servers.",
    },
    {
      id: "faq-7",
      question: "Which AI model providers can I use, and does it work offline?",
      answer:
        "You can connect cloud AI providers including OpenRouter (featuring Nemotron 3 Ultra and 3.5 Lightning), Google Gemini, NVIDIA NIM, or Groq. If no API key is provided, the platform automatically utilizes our deterministic, zero-key offline heuristic engine so you can continue working without interruptions.",
    },
    {
      id: "faq-8",
      question: "How do I capture and evaluate a job from an external site?",
      answer:
        "Click the 'Capture Job URL' card in the header, paste any job link or raw description text, and choose your extraction provider. The platform extracts the job title, company, requirements, workplace type, and salary range, automatically evaluating the posting against your candidate profile to provide an instant match score and skill breakdown.",
    },
  ];

  return (
    <div className="space-y-8 sm:space-y-10 animate-in fade-in duration-200 pb-12">
      {/* Header: Designed Typographic Hero with Feature Cards */}
      <header className="relative space-y-5 pb-8 sm:pb-10 border-b border-border/60">
        {/* Subtle Ambient Radial Glow (Not a card, zero borders/boxes) */}
        <div
          aria-hidden="true"
          className="absolute -top-10 -left-10 -z-10 w-96 h-72 bg-primary/[0.04] rounded-full blur-3xl pointer-events-none"
        />

        <div className="space-y-3 max-w-4xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
            sakto ka{" "}
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              Career Intelligence System
            </span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground/90 leading-relaxed max-w-3xl">
            A private career automation platform designed to assist every phase of your job search: aggregating verified job postings across multiple platforms, evaluating qualification fit and keyword gaps against your candidate profile, generating ATS-compliant single-column resumes, curating role-tailored cover letters from active jobs or external job links, and simulating technical STAR interview preparation.
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground/70 font-mono pt-1">
            <span>100% In-Session Privacy</span>
            <span className="text-border">•</span>
            <span>Zero Server-Side Retention</span>
            <span className="text-border">•</span>
            <span>ATS Format Guaranteed</span>
          </div>
        </div>

        {/* Quick Action Feature Cards: Same Design as Curate Cover Letter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-4 sm:pt-6">
          {/* Card 1: Cover Letter Studio */}
          <button
            type="button"
            onClick={() => openCoverLetterStudio({ tab: "link" })}
            className="p-3.5 sm:p-4 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent hover:border-primary/45 hover:from-primary/15 hover:via-primary/8 transition-all cursor-pointer group text-left shadow-xs flex flex-col justify-between"
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-primary text-primary-foreground shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-bold text-foreground group-hover:text-primary transition-colors">
                    Cover Letter Studio
                  </h3>
                  <Badge variant="outline" className="text-[10px] text-primary border-primary/30 font-medium py-0 px-1.5">
                    Role &amp; Resume Tailored
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                  Curate customized, ATS-aligned cover letters from active jobs or external links.
                </p>
              </div>
            </div>
          </button>

          {/* Card 2: ATS Resume Studio */}
          <Link
            href="/resume"
            className="p-3.5 sm:p-4 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent hover:border-primary/45 hover:from-primary/15 hover:via-primary/8 transition-all cursor-pointer group text-left shadow-xs flex flex-col justify-between"
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-primary text-primary-foreground shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                <Zap className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-bold text-foreground group-hover:text-primary transition-colors">
                    ATS Resume Studio
                  </h3>
                  <Badge variant="outline" className="text-[10px] text-primary border-primary/30 font-medium py-0 px-1.5">
                    90%+ ATS Score
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                  Build single-column, keyword-optimized resumes engineered to pass ATS screeners.
                </p>
              </div>
            </div>
          </Link>

          {/* Card 3: Discover Jobs */}
          <Link
            href="/searches"
            className="p-3.5 sm:p-4 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent hover:border-primary/45 hover:from-primary/15 hover:via-primary/8 transition-all cursor-pointer group text-left shadow-xs flex flex-col justify-between"
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-primary text-primary-foreground shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                <Radar className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-bold text-foreground group-hover:text-primary transition-colors">
                    Discover Jobs
                  </h3>
                  <Badge variant="outline" className="text-[10px] text-primary border-primary/30 font-medium py-0 px-1.5">
                    5 Live Boards
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                  Aggregates verified postings across LinkedIn, Indeed, JobStreet, and Google Jobs.
                </p>
              </div>
            </div>
          </Link>

          {/* Card 4: Capture Job URL */}
          <button
            type="button"
            onClick={() => setIsCaptureModalOpen(true)}
            className="p-3.5 sm:p-4 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent hover:border-primary/45 hover:from-primary/15 hover:via-primary/8 transition-all cursor-pointer group text-left shadow-xs flex flex-col justify-between"
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-primary text-primary-foreground shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                <Plus className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-bold text-foreground group-hover:text-primary transition-colors">
                    Capture Job URL
                  </h3>
                  <Badge variant="outline" className="text-[10px] text-primary border-primary/30 font-medium py-0 px-1.5">
                    Instant Ingest
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                  Paste any job link to auto-extract role requirements and evaluate skill match.
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Architectural Accent Anchor Line */}
        <div
          aria-hidden="true"
          className="absolute -bottom-px left-0 h-[2px] w-24 sm:w-32 bg-primary rounded-full"
        />
      </header>

      {/* Frequently Asked Questions: Accordion Section */}
      <section className="space-y-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Frequently Asked Questions
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Everything you need to know about job discovery, ATS resume compliance, custom cover letter curation, and our stateless privacy architecture.
          </p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-6 shadow-xs">
          <Accordion type="single" defaultValue="faq-1">
            {faqs.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id} className="border-border/60">
                <AccordionTrigger className="text-base sm:text-[17px] py-4 sm:py-5 font-semibold text-foreground hover:text-primary transition-colors">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm sm:text-[15px] text-muted-foreground leading-relaxed pb-5 pt-1">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Quick Job Capture Modal */}
      <JobCaptureModal
        isOpen={isCaptureModalOpen}
        onClose={() => setIsCaptureModalOpen(false)}
        onJobCreated={() => setIsCaptureModalOpen(false)}
      />
    </div>
  );
}

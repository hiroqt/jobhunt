"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Sparkles,
  Download,
  Copy,
  Check,
  Plus,
  Trash2,
  Building2,
  GraduationCap,
  Briefcase,
  Award,
  ExternalLink,
  RefreshCw,
  Sliders,
  Eye,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
  Code2,
  FolderGit2,
  Wand2,
  RotateCcw,
} from "lucide-react";
import { getCandidateProfile, getJobs } from "@/lib/api";
import { CandidateProfile, Job } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface WorkExperienceItem {
  id: string;
  company: string;
  location: string;
  role: string;
  period: string;
  bullets: string[];
}

interface EducationItem {
  id: string;
  school: string;
  location: string;
  degree: string;
}

interface ProjectItem {
  id: string;
  title: string;
  tagline: string;
  technologies: string;
}

interface CertificationItem {
  id: string;
  name: string;
  details: string;
}

interface SkillCategoryItem {
  id: string;
  category: string;
  skills: string;
}

// Clean Generic Template Data (Zero personal details by default)
const SAMPLE_RESUME_DATA = {
  fullName: "ALEXANDER MORGAN",
  headline: "Senior Full-Stack Engineer · Cloud Solutions Architect · Technical Consultant",
  email: "alex.morgan@example.com",
  linkedin: "linkedin.com/in/alex-morgan",
  github: "github.com/alexmorgan",
  portfolio: "alexmorgan.dev",
  educationList: [
    {
      id: "edu-1",
      school: "STATE UNIVERSITY OF SCIENCE & TECHNOLOGY",
      location: "San Francisco, CA",
      degree: "Bachelor of Science in Computer Science & Information Systems",
    },
  ],
  experienceList: [
    {
      id: "exp-1",
      company: "GLOBAL ENTERPRISE CLOUD SYSTEMS",
      location: "San Francisco, CA",
      role: "Lead Full-Stack Engineer",
      period: "2024 – Present",
      bullets: [
        "Architected and deployed high-throughput distributed microservices using Next.js, Node.js, and PostgreSQL, reducing API response latency by 35%.",
        "Led cross-functional engineering squad of 6 developers, standardizing CI/CD deployment pipelines and automated integration test coverage to 94%.",
      ],
    },
    {
      id: "exp-2",
      company: "DATAFLOW INNOVATIONS LAB",
      location: "Austin, TX",
      role: "Software Development Engineer",
      period: "2022 – 2024",
      bullets: [
        "Engineered real-time telemetry indexing pipeline processing 2M+ daily events with sub-second Elasticsearch and Redis caching queries.",
        "Developed responsive TypeScript web applications and integrated secure OAuth2 / REST API backend microservices.",
      ],
    },
    {
      id: "exp-3",
      company: "INDEPENDENT TECHNICAL CONSULTANT",
      location: "Remote",
      role: "Full-Stack Software Consultant",
      period: "2020 – 2022",
      bullets: [
        "Delivered custom production web architectures and mobile client solutions for enterprise clients and scaling technology startups.",
      ],
    },
  ],
  projectsList: [
    {
      id: "proj-1",
      title: "PulseEngine",
      tagline: "High-performance autonomous job indexing and candidate qualification copilot",
      technologies: "Next.js · TypeScript · FastAPI · PostgreSQL",
    },
    {
      id: "proj-2",
      title: "CloudTrack OS",
      tagline: "All-in-one distributed workforce tracking, scheduling, and payroll integration platform",
      technologies: "React · Node.js · Supabase · Tailwind CSS",
    },
    {
      id: "proj-3",
      title: "PaceMentor AI",
      tagline: "AI-powered adaptive mobile coaching application with GPS telemetry and health analytics",
      technologies: "Flutter · Firebase · Python",
    },
  ],
  certificationsList: [
    {
      id: "cert-1",
      name: "AWS Certified Solutions Architect",
      details: "Generative AI · Distributed Systems · Serverless Infrastructure · Advanced SQL & Database Design",
    },
    {
      id: "cert-2",
      name: "IBM AI Engineering Professional",
      details: "RAG Architectures · Neural Networks & Deep Learning · Prompt Engineering · LLM Orchestration",
    },
    {
      id: "cert-3",
      name: "Lean Six Sigma — Green Belt",
      details: "Process Optimization & Quality Engineering",
    },
  ],
  skillsCategories: [
    {
      id: "skill-1",
      category: "AI & Context Engineering",
      skills: "Context Engineering · Agentic Workflows · RAG Pipelines · Prompt Architecture · LLM Orchestration · OpenAI API · Groq LLM",
    },
    {
      id: "skill-2",
      category: "Frontend",
      skills: "React · Next.js · Vue.js · TypeScript · Tailwind CSS · State Management · Flutter",
    },
    {
      id: "skill-3",
      category: "Backend & Databases",
      skills: "Node.js · Python · FastAPI · PHP · Laravel · PostgreSQL · MySQL · Redis · Supabase · Firebase · REST APIs",
    },
    {
      id: "skill-4",
      category: "Tools & Platforms",
      skills: "AWS · Docker · Kubernetes · GitHub Actions · CI/CD · Vercel · Figma · Git",
    },
    {
      id: "skill-5",
      category: "Languages",
      skills: "English (fluent) · Filipino (native)",
    },
  ],
};

function ResumeStudioContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const targetJobId = searchParams.get("job_id");

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [selectedTargetJob, setSelectedTargetJob] = useState<Job | null>(null);
  const [activeTab, setActiveTab] = useState<"editor" | "diagnostics">("editor");
  const [copied, setCopied] = useState(false);
  const [isTailoring, setIsTailoring] = useState(false);

  // Resume Content State (Initialized with Generic Template Placeholders)
  const [fullName, setFullName] = useState(SAMPLE_RESUME_DATA.fullName);
  const [headline, setHeadline] = useState(SAMPLE_RESUME_DATA.headline);
  const [email, setEmail] = useState(SAMPLE_RESUME_DATA.email);
  const [linkedin, setLinkedin] = useState(SAMPLE_RESUME_DATA.linkedin);
  const [github, setGithub] = useState(SAMPLE_RESUME_DATA.github);
  const [portfolio, setPortfolio] = useState(SAMPLE_RESUME_DATA.portfolio);

  const [educationList, setEducationList] = useState<EducationItem[]>(SAMPLE_RESUME_DATA.educationList);
  const [experienceList, setExperienceList] = useState<WorkExperienceItem[]>(SAMPLE_RESUME_DATA.experienceList);
  const [projectsList, setProjectsList] = useState<ProjectItem[]>(SAMPLE_RESUME_DATA.projectsList);
  const [certificationsList, setCertificationsList] = useState<CertificationItem[]>(SAMPLE_RESUME_DATA.certificationsList);
  const [skillsCategories, setSkillsCategories] = useState<SkillCategoryItem[]>(SAMPLE_RESUME_DATA.skillsCategories);

  // Reset to sample template
  const handleResetToSample = () => {
    setFullName(SAMPLE_RESUME_DATA.fullName);
    setHeadline(SAMPLE_RESUME_DATA.headline);
    setEmail(SAMPLE_RESUME_DATA.email);
    setLinkedin(SAMPLE_RESUME_DATA.linkedin);
    setGithub(SAMPLE_RESUME_DATA.github);
    setPortfolio(SAMPLE_RESUME_DATA.portfolio);
    setEducationList(SAMPLE_RESUME_DATA.educationList);
    setExperienceList(SAMPLE_RESUME_DATA.experienceList);
    setProjectsList(SAMPLE_RESUME_DATA.projectsList);
    setCertificationsList(SAMPLE_RESUME_DATA.certificationsList);
    setSkillsCategories(SAMPLE_RESUME_DATA.skillsCategories);
  };

  // Clear all fields
  const handleClearAll = () => {
    setFullName("");
    setHeadline("");
    setEmail("");
    setLinkedin("");
    setGithub("");
    setPortfolio("");
    setEducationList([]);
    setExperienceList([]);
    setProjectsList([]);
    setCertificationsList([]);
    setSkillsCategories([]);
  };

  // Load Profile & Target Job
  useEffect(() => {
    async function initData() {
      setLoading(true);
      try {
        const [candProfile, jobsData] = await Promise.all([
          getCandidateProfile().catch(() => null),
          getJobs().catch(() => []),
        ]);

        if (candProfile && candProfile.full_name) {
          setProfile(candProfile);
          setFullName(candProfile.full_name);
          if (candProfile.headline) setHeadline(candProfile.headline);
          if (candProfile.email) setEmail(candProfile.email);
          if (candProfile.linkedin_url) setLinkedin(candProfile.linkedin_url);
          if (candProfile.github_url) setGithub(candProfile.github_url);
          if (candProfile.portfolio_url) setPortfolio(candProfile.portfolio_url);
        }

        setAvailableJobs(jobsData);

        if (targetJobId && jobsData.length > 0) {
          const match = jobsData.find((j) => j.id === targetJobId);
          if (match) {
            setSelectedTargetJob(match);
          }
        }
      } catch (err) {
        console.error("Error loading resume studio data:", err);
      } finally {
        setLoading(false);
      }
    }
    initData();
  }, [targetJobId]);

  // Handle Target Job Selection
  const handleSelectTargetJob = (jobId: string) => {
    if (!jobId) {
      setSelectedTargetJob(null);
      router.push("/resume");
      return;
    }
    const found = availableJobs.find((j) => j.id === jobId);
    if (found) {
      setSelectedTargetJob(found);
      router.push(`/resume?job_id=${jobId}`);
    }
  };

  // AI 1-Click Role Tailoring
  const handleTailorForJob = () => {
    if (!selectedTargetJob) return;
    setIsTailoring(true);

    setTimeout(() => {
      if (selectedTargetJob.title) {
        setHeadline(selectedTargetJob.title);
      }

      const targetRequired = [
        ...(selectedTargetJob.matched_skills || []),
        ...(selectedTargetJob.missing_critical_skills || []),
        ...(selectedTargetJob.missing_preferred_skills || []),
      ];

      if (targetRequired.length > 0) {
        setSkillsCategories((prev) => {
          const updated = [...prev];
          const techIndex = updated.findIndex((c) => c.category.toLowerCase().includes("tools") || c.category.toLowerCase().includes("ai") || c.category.toLowerCase().includes("frontend"));
          if (techIndex >= 0) {
            const currentList = updated[techIndex].skills.split(" · ");
            const merged = Array.from(new Set([...currentList, ...targetRequired.slice(0, 4)]));
            updated[techIndex].skills = merged.join(" · ");
          }
          return updated;
        });
      }

      setIsTailoring(false);
    }, 500);
  };

  // Print & PDF Download Action (Pure Black, Clean Balanced Spacing, 1-Page Layout, Zero Browser Headers/Footers)
  const handleDownloadPDF = () => {
    const printElement = document.getElementById("ats-resume-print-area");
    if (!printElement) {
      window.print();
      return;
    }

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>${fullName || "Resume"}</title>
          <style>
            @page {
              size: letter portrait;
              margin: 0; /* Suppresses browser headers, time, URL, and page numbers */
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body {
              background: #ffffff !important;
              color: #000000 !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              font-size: 8.5pt;
              line-height: 1.32;
            }
            .resume-sheet {
              width: 100%;
              max-width: 8.5in;
              margin: 0 auto;
              padding: 0.45in 0.55in;
              color: #000000 !important;
            }
            h1, h2, h3, p, span, strong, div, li, a {
              color: #000000 !important;
            }
            /* Header */
            .header-block {
              text-align: center;
              margin-bottom: 14px;
            }
            .header-name, h1 {
              font-size: 20pt;
              font-weight: 700;
              text-transform: uppercase;
              text-align: center;
              letter-spacing: 0.5px;
              line-height: 1.1;
              margin-bottom: 4px;
              color: #000000 !important;
            }
            .header-headline {
              font-size: 9pt;
              text-align: center;
              font-weight: 600;
              margin-bottom: 3px;
              color: #000000 !important;
            }
            .header-contact {
              font-size: 8.5pt;
              text-align: center;
              display: flex;
              flex-wrap: wrap;
              justify-content: center;
              gap: 4px 8px;
              color: #000000 !important;
            }
            /* Section Blocks */
            .section-block {
              margin-bottom: 12px;
              display: block;
              width: 100%;
            }
            .section-block:last-child {
              margin-bottom: 0;
            }
            /* Section Headlines */
            .section-headline, h2 {
              font-size: 9.5pt;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              border-bottom: 1px solid #000000 !important;
              padding-bottom: 2px;
              margin-top: 0;
              margin-bottom: 6px;
              color: #000000 !important;
              width: 100%;
              display: block;
            }
            /* Entries */
            .edu-item {
              margin-bottom: 5px;
              font-size: 8.5pt;
            }
            .edu-item:last-child {
              margin-bottom: 0;
            }
            .exp-item {
              margin-bottom: 8px;
            }
            .exp-item:last-child {
              margin-bottom: 0;
            }
            .entry-header {
              display: flex;
              justify-content: space-between;
              align-items: baseline;
              font-size: 8.5pt;
              font-weight: 700;
              margin-bottom: 1px;
            }
            .entry-sub {
              font-size: 8pt;
              font-weight: 500;
              margin-bottom: 3px;
            }
            ul, .bullet-list {
              list-style-type: disc;
              padding-left: 16px;
              margin-top: 3px;
              margin-bottom: 0;
            }
            li {
              font-size: 8pt;
              line-height: 1.35;
              margin-bottom: 2.5px;
              color: #000000 !important;
            }
            li:last-child {
              margin-bottom: 0;
            }
            .proj-item {
              margin-bottom: 5.5px;
              font-size: 8.5pt;
              line-height: 1.3;
            }
            .proj-item:last-child {
              margin-bottom: 0;
            }
            .proj-tech {
              font-size: 7.5pt;
              color: #000000 !important;
              margin-top: 1px;
              font-style: italic;
            }
            .cert-item {
              margin-bottom: 4px;
              font-size: 8.5pt;
              line-height: 1.3;
            }
            .cert-item:last-child {
              margin-bottom: 0;
            }
            .skill-item {
              margin-bottom: 3.5px;
              font-size: 8.5pt;
              line-height: 1.3;
            }
            .skill-item:last-child {
              margin-bottom: 0;
            }
            * {
              break-inside: avoid;
              page-break-inside: avoid;
            }
          </style>
        </head>
        <body>
          <div class="resume-sheet">
            ${printElement.innerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1500);
    }, 200);
  };

  // Copy Plain Text for ATS Form Fields
  const handleCopyPlainText = () => {
    const textLines: string[] = [];
    textLines.push(fullName.toUpperCase());
    textLines.push(headline);
    textLines.push([email, linkedin, github, portfolio].filter(Boolean).join(" • "));
    
    textLines.push("\nEDUCATION");
    educationList.forEach((edu) => {
      textLines.push(`${edu.school} — ${edu.location}`);
      textLines.push(`${edu.degree}`);
    });

    textLines.push("\nWORK EXPERIENCE");
    experienceList.forEach((exp) => {
      textLines.push(`${exp.company} — ${exp.location}`);
      textLines.push(`${exp.role} | ${exp.period}`);
      exp.bullets.forEach((b) => textLines.push(`• ${b}`));
    });

    textLines.push("\nPROJECTS");
    projectsList.forEach((proj) => {
      textLines.push(`${proj.title} — ${proj.tagline}`);
      if (proj.technologies) textLines.push(`${proj.technologies}`);
    });

    textLines.push("\nCERTIFICATIONS");
    certificationsList.forEach((cert) => {
      textLines.push(`${cert.name}: ${cert.details}`);
    });

    textLines.push("\nSKILLS");
    skillsCategories.forEach((sc) => {
      textLines.push(`${sc.category}: ${sc.skills}`);
    });

    navigator.clipboard.writeText(textLines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
            <FileCheck className="w-7 h-7 text-primary" />
            <span>ATS Resume Studio</span>
            <Badge variant="outline" className="text-xs font-mono border-primary/30 text-primary bg-primary/5">
              Standard 1-Page Layout
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Build and export machine-parseable, single-page vector PDF resumes with pure black text and balanced professional spacing.
          </p>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyPlainText}
            className="h-9 px-3 text-xs font-semibold gap-1.5 border-border hover:bg-muted"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied Plain Text" : "Copy for ATS Form"}</span>
          </Button>

          <Button
            onClick={handleDownloadPDF}
            variant="default"
            size="sm"
            className="h-9 px-4 text-xs font-semibold gap-1.5 shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download ATS PDF (1-Page)</span>
          </Button>
        </div>
      </div>

      {/* Target Job Optimization & Template Presets */}
      <Card className="border-border bg-card p-4 space-y-3 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Target Role Optimization (Optional)</h2>
              {selectedTargetJob && (
                <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                  {selectedTargetJob.source}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedTargetJob
                ? `Tailoring for: ${selectedTargetJob.title} at ${selectedTargetJob.company}`
                : "Select any captured job from Job Explorer to analyze requirement match and align keywords."}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <select
              aria-label="Target Job Selection"
              value={selectedTargetJob?.id || ""}
              onChange={(e) => handleSelectTargetJob(e.target.value)}
              className="bg-background border border-border rounded-md px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring font-medium h-9 max-w-xs"
            >
              <option value="">-- Standalone General Resume --</option>
              {availableJobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.company})
                </option>
              ))}
            </select>

            {selectedTargetJob && (
              <Button
                size="sm"
                onClick={handleTailorForJob}
                disabled={isTailoring}
                className="h-9 px-3 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground shrink-0"
              >
                <Wand2 className={cn("w-3.5 h-3.5", isTailoring && "animate-spin")} />
                <span>{isTailoring ? "Tailoring..." : "Align Keywords"}</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleResetToSample}
              className="h-9 px-2.5 text-xs font-medium gap-1 text-muted-foreground hover:text-foreground shrink-0"
              title="Reset fields to standard sample template"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Sample</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Studio Grid: Editor (Left 6 Cols) & Live Preview (Right 6 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Panel: Structured Editor (6 Cols) */}
        <div className="lg:col-span-6 space-y-4 no-print">
          <div className="flex items-center justify-between bg-card border border-border rounded-xl p-1.5">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab("editor")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5",
                  activeTab === "editor"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Resume Sections</span>
              </button>

              <button
                onClick={() => setActiveTab("diagnostics")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5",
                  activeTab === "diagnostics"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>ATS Quality Check</span>
              </button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-7 px-2 text-[11px] text-muted-foreground hover:text-rose-500"
            >
              Clear All
            </Button>
          </div>

          {/* Tab 1: Editor Form */}
          {activeTab === "editor" && (
            <div className="space-y-4">
              {/* Header Info */}
              <Card className="border-border bg-card p-4 space-y-3">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  <span>Header &amp; Contact</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground">Full Name</label>
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="FULL NAME"
                      className="h-8 text-xs bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground">Professional Headline</label>
                    <Input
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="Senior Software Engineer · Full-Stack Consultant"
                      className="h-8 text-xs bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground">Email</label>
                    <Input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="h-8 text-xs bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground">LinkedIn</label>
                    <Input
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      placeholder="linkedin.com/in/username"
                      className="h-8 text-xs bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground">GitHub</label>
                    <Input
                      value={github}
                      onChange={(e) => setGithub(e.target.value)}
                      placeholder="github.com/username"
                      className="h-8 text-xs bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground">Portfolio / Web</label>
                    <Input
                      value={portfolio}
                      onChange={(e) => setPortfolio(e.target.value)}
                      placeholder="portfolio.dev"
                      className="h-8 text-xs bg-background"
                    />
                  </div>
                </div>
              </Card>

              {/* Education */}
              <Card className="border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-primary" />
                    <span>Education</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      setEducationList([
                        ...educationList,
                        { id: `edu-${Date.now()}`, school: "University Name", location: "City, State", degree: "Degree Title" },
                      ])
                    }
                    className="text-primary hover:underline font-medium text-[11px]"
                  >
                    + Add School
                  </button>
                </div>

                {educationList.map((edu, idx) => (
                  <div key={edu.id} className="p-3 rounded-lg border border-border bg-muted/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-muted-foreground">School #{idx + 1}</span>
                      {educationList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setEducationList(educationList.filter((e) => e.id !== edu.id))}
                          className="text-muted-foreground hover:text-rose-500 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Input
                        value={edu.school}
                        onChange={(e) => setEducationList(educationList.map((item) => item.id === edu.id ? { ...item, school: e.target.value } : item))}
                        placeholder="Institution Name"
                        className="h-8 text-xs bg-background"
                      />
                      <Input
                        value={edu.location}
                        onChange={(e) => setEducationList(educationList.map((item) => item.id === edu.id ? { ...item, location: e.target.value } : item))}
                        placeholder="Location (e.g. City, State)"
                        className="h-8 text-xs bg-background"
                      />
                      <Input
                        value={edu.degree}
                        onChange={(e) => setEducationList(educationList.map((item) => item.id === edu.id ? { ...item, degree: e.target.value } : item))}
                        placeholder="Degree Title (e.g. Bachelor of Science in Computer Science)"
                        className="h-8 text-xs bg-background sm:col-span-2"
                      />
                    </div>
                  </div>
                ))}
              </Card>

              {/* Work Experience */}
              <Card className="border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-primary" />
                    <span>Work Experience</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      setExperienceList([
                        ...experienceList,
                        {
                          id: `exp-${Date.now()}`,
                          company: "Company Name",
                          location: "Location",
                          role: "Role Title",
                          period: "2024 – Present",
                          bullets: ["Delivered technical capabilities resulting in measurable business performance gains."],
                        },
                      ])
                    }
                    className="text-primary hover:underline font-medium text-[11px]"
                  >
                    + Add Position
                  </button>
                </div>

                <div className="space-y-3">
                  {experienceList.map((exp, expIdx) => (
                    <div key={exp.id} className="p-3 rounded-lg border border-border bg-muted/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono text-muted-foreground">Position #{expIdx + 1}</span>
                        {experienceList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setExperienceList(experienceList.filter((e) => e.id !== exp.id))}
                            className="text-muted-foreground hover:text-rose-500 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Input
                          value={exp.company}
                          onChange={(e) => setExperienceList(experienceList.map((item) => item.id === exp.id ? { ...item, company: e.target.value } : item))}
                          placeholder="Company Name"
                          className="h-8 text-xs bg-background"
                        />
                        <Input
                          value={exp.location}
                          onChange={(e) => setExperienceList(experienceList.map((item) => item.id === exp.id ? { ...item, location: e.target.value } : item))}
                          placeholder="Location (e.g. Remote, City)"
                          className="h-8 text-xs bg-background"
                        />
                        <Input
                          value={exp.role}
                          onChange={(e) => setExperienceList(experienceList.map((item) => item.id === exp.id ? { ...item, role: e.target.value } : item))}
                          placeholder="Role (e.g. Lead Engineer)"
                          className="h-8 text-xs bg-background"
                        />
                        <Input
                          value={exp.period}
                          onChange={(e) => setExperienceList(experienceList.map((item) => item.id === exp.id ? { ...item, period: e.target.value } : item))}
                          placeholder="Period (e.g. 2024 – Present)"
                          className="h-8 text-xs bg-background"
                        />
                      </div>

                      {/* Bullets */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span className="font-semibold text-foreground">Bullet Achievements</span>
                          <button
                            type="button"
                            onClick={() =>
                              setExperienceList(
                                experienceList.map((item) =>
                                  item.id === exp.id ? { ...item, bullets: [...item.bullets, "Architected high-scale systems and improved workflow efficiencies."] } : item
                                )
                              )
                            }
                            className="text-primary hover:underline font-medium text-[11px]"
                          >
                            + Add Bullet
                          </button>
                        </div>

                        {exp.bullets.map((bullet, bIdx) => (
                          <div key={bIdx} className="flex items-start gap-1.5">
                            <span className="text-muted-foreground text-xs mt-1">•</span>
                            <Textarea
                              value={bullet}
                              onChange={(e) => {
                                const newBullets = [...exp.bullets];
                                newBullets[bIdx] = e.target.value;
                                setExperienceList(experienceList.map((item) => item.id === exp.id ? { ...item, bullets: newBullets } : item));
                              }}
                              rows={2}
                              className="text-xs bg-background leading-relaxed flex-1"
                            />
                            {exp.bullets.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setExperienceList(
                                    experienceList.map((item) =>
                                      item.id === exp.id ? { ...item, bullets: item.bullets.filter((_, idx) => idx !== bIdx) } : item
                                    )
                                  );
                                }}
                                className="text-muted-foreground hover:text-rose-500 p-1 mt-1"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Projects */}
              <Card className="border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <FolderGit2 className="w-3.5 h-3.5 text-primary" />
                    <span>Projects</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      setProjectsList([
                        ...projectsList,
                        { id: `proj-${Date.now()}`, title: "Project Name", tagline: "Description of project outcome", technologies: "React · TypeScript" },
                      ])
                    }
                    className="text-primary hover:underline font-medium text-[11px]"
                  >
                    + Add Project
                  </button>
                </div>

                <div className="space-y-2">
                  {projectsList.map((proj) => (
                    <div key={proj.id} className="p-2.5 rounded-lg border border-border bg-muted/20 space-y-1.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Input
                          value={proj.title}
                          onChange={(e) => setProjectsList(projectsList.map((p) => p.id === proj.id ? { ...p, title: e.target.value } : p))}
                          placeholder="Project Title"
                          className="h-8 text-xs bg-background"
                        />
                        <Input
                          value={proj.technologies}
                          onChange={(e) => setProjectsList(projectsList.map((p) => p.id === proj.id ? { ...p, technologies: e.target.value } : p))}
                          placeholder="Tech Stack / Role (e.g. Next.js · Supabase)"
                          className="h-8 text-xs bg-background"
                        />
                      </div>
                      <Input
                        value={proj.tagline}
                        onChange={(e) => setProjectsList(projectsList.map((p) => p.id === proj.id ? { ...p, tagline: e.target.value } : p))}
                        placeholder="Tagline / Short description of impact"
                        className="h-8 text-xs bg-background"
                      />
                    </div>
                  ))}
                </div>
              </Card>

              {/* Certifications */}
              <Card className="border-border bg-card p-4 space-y-3">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-primary" />
                  <span>Certifications</span>
                </h3>
                <div className="space-y-2">
                  {certificationsList.map((cert) => (
                    <div key={cert.id} className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2 rounded-lg border border-border bg-muted/20">
                      <Input
                        value={cert.name}
                        onChange={(e) => setCertificationsList(certificationsList.map((c) => c.id === cert.id ? { ...c, name: e.target.value } : c))}
                        placeholder="Certification Group"
                        className="h-8 text-xs bg-background font-semibold"
                      />
                      <Input
                        value={cert.details}
                        onChange={(e) => setCertificationsList(certificationsList.map((c) => c.id === cert.id ? { ...c, details: e.target.value } : c))}
                        placeholder="Topics / Details"
                        className="h-8 text-xs bg-background sm:col-span-2"
                      />
                    </div>
                  ))}
                </div>
              </Card>

              {/* Skills */}
              <Card className="border-border bg-card p-4 space-y-3">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-primary" />
                  <span>Skills Breakdown</span>
                </h3>
                <div className="space-y-2">
                  {skillsCategories.map((sc) => (
                    <div key={sc.id} className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2 rounded-lg border border-border bg-muted/20">
                      <Input
                        value={sc.category}
                        onChange={(e) => setSkillsCategories(skillsCategories.map((item) => item.id === sc.id ? { ...item, category: e.target.value } : item))}
                        placeholder="Category Name"
                        className="h-8 text-xs bg-background font-semibold"
                      />
                      <Input
                        value={sc.skills}
                        onChange={(e) => setSkillsCategories(skillsCategories.map((item) => item.id === sc.id ? { ...item, skills: e.target.value } : item))}
                        placeholder="Skill Items separated by middle dots (·)"
                        className="h-8 text-xs bg-background sm:col-span-2"
                      />
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Tab 2: Diagnostics */}
          {activeTab === "diagnostics" && (
            <Card className="border-border bg-card p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <h3 className="text-base font-bold text-foreground">ATS Machine Parseability Score</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Strict single-column formatting audit for ATS machines.</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">100%</span>
                  <p className="text-[10px] text-muted-foreground">Compliance Rating</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl border border-border bg-muted/30 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">Strict 1-Page Letter Layout Validated</p>
                    <p className="text-muted-foreground text-[11px]">Proportional margins and balanced section spacing ensure zero multi-page spills.</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-border bg-muted/30 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">100% Pure Black Color Palette</p>
                    <p className="text-muted-foreground text-[11px]">Zero colored elements or light grays that degrade when parsed by enterprise OCR engines.</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-border bg-muted/30 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">Standard Semantic Section Underlines</p>
                    <p className="text-muted-foreground text-[11px]">Clear horizontal rules delineate Education, Experience, Projects, Certifications, and Skills.</p>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Panel: Reactive Live ATS Document Preview (6 Cols) */}
        <div id="ats-resume-print-container" className="lg:col-span-6 sticky top-20">
          <div className="flex items-center justify-between pb-2 text-xs text-muted-foreground no-print">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-primary" />
              <span>Standard ATS 1-Page Document Preview</span>
            </span>
            <span className="text-[11px] font-mono">Pure Black • 8.5" × 11"</span>
          </div>

          {/* Printable Document Box */}
          <div
            id="ats-resume-print-area"
            className="bg-white text-black border border-border shadow-2xl rounded-xl p-8 sm:p-10 font-sans select-text"
            style={{ minHeight: "750px", color: "#000000" }}
          >
            {/* Header / Contact Info */}
            <div className="header-block text-center" style={{ textAlign: "center", marginBottom: "14px" }}>
              <h1 className="header-name text-2xl sm:text-3xl font-bold tracking-tight uppercase text-black" style={{ fontSize: "20pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", lineHeight: 1.1, marginBottom: "4px", color: "#000000" }}>
                {fullName || "FULL NAME"}
              </h1>
              <p className="header-headline text-xs font-semibold text-black" style={{ fontSize: "9pt", fontWeight: 600, marginBottom: "3px", color: "#000000" }}>
                {headline || "Professional Headline / Target Role"}
              </p>
              <div className="header-contact flex flex-wrap items-center justify-center gap-x-2 text-xs text-black font-normal" style={{ fontSize: "8.5pt", display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: "8px", rowGap: "3px", color: "#000000" }}>
                {email && <span>{email}</span>}
                {linkedin && <span>• {linkedin}</span>}
                {github && <span>• {github}</span>}
                {portfolio && <span>• {portfolio}</span>}
              </div>
            </div>

            {/* EDUCATION */}
            {educationList.length > 0 && (
              <div className="section-block" style={{ marginBottom: "12px", width: "100%" }}>
                <h2 className="section-headline" style={{ fontSize: "9.5pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #000000", paddingBottom: "2px", marginTop: "0px", marginBottom: "6px", color: "#000000", width: "100%", display: "block" }}>
                  EDUCATION
                </h2>
                {educationList.map((edu, idx) => (
                  <div key={edu.id} className="edu-item" style={{ marginBottom: idx === educationList.length - 1 ? "0px" : "5px", fontSize: "8.5pt" }}>
                    <div className="entry-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <strong style={{ fontWeight: 700, textTransform: "uppercase", color: "#000000" }}>{edu.school}</strong>
                      <span style={{ color: "#000000", fontSize: "8.5pt" }}>— {edu.location}</span>
                    </div>
                    <p style={{ color: "#000000", fontSize: "8.5pt", marginTop: "1px" }}>{edu.degree}</p>
                  </div>
                ))}
              </div>
            )}

            {/* WORK EXPERIENCE */}
            {experienceList.length > 0 && (
              <div className="section-block" style={{ marginBottom: "12px", width: "100%" }}>
                <h2 className="section-headline" style={{ fontSize: "9.5pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #000000", paddingBottom: "2px", marginTop: "0px", marginBottom: "6px", color: "#000000", width: "100%", display: "block" }}>
                  WORK EXPERIENCE
                </h2>
                {experienceList.map((exp, expIdx) => (
                  <div key={exp.id} className="exp-item" style={{ marginBottom: expIdx === experienceList.length - 1 ? "0px" : "8px" }}>
                    <div className="entry-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: "8.5pt" }}>
                      <strong style={{ fontWeight: 700, textTransform: "uppercase", color: "#000000" }}>{exp.company}</strong>
                      <span style={{ color: "#000000", fontSize: "8.5pt" }}>— {exp.location}</span>
                    </div>
                    <div className="entry-sub" style={{ fontSize: "8pt", fontWeight: 500, color: "#000000", marginTop: "1px" }}>
                      <span>{exp.role}</span>
                      <span> | {exp.period}</span>
                    </div>
                    <ul className="bullet-list" style={{ listStyleType: "disc", paddingLeft: "16px", marginTop: "3px", marginBottom: "0px" }}>
                      {exp.bullets.map((b, i) => (
                        <li key={i} style={{ fontSize: "8pt", lineHeight: 1.35, marginBottom: i === exp.bullets.length - 1 ? "0px" : "2.5px", color: "#000000" }}>
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {/* PROJECTS */}
            {projectsList.length > 0 && (
              <div className="section-block" style={{ marginBottom: "12px", width: "100%" }}>
                <h2 className="section-headline" style={{ fontSize: "9.5pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #000000", paddingBottom: "2px", marginTop: "0px", marginBottom: "6px", color: "#000000", width: "100%", display: "block" }}>
                  PROJECTS
                </h2>
                {projectsList.map((proj, pIdx) => (
                  <div key={proj.id} className="proj-item" style={{ marginBottom: pIdx === projectsList.length - 1 ? "0px" : "5.5px", fontSize: "8.5pt", lineHeight: 1.3 }}>
                    <div>
                      <strong style={{ fontWeight: 700, color: "#000000" }}>{proj.title}</strong>
                      <span style={{ color: "#000000" }}> — {proj.tagline}</span>
                    </div>
                    {proj.technologies && (
                      <p className="proj-tech" style={{ fontSize: "7.5pt", color: "#000000", marginTop: "1px", fontStyle: "italic" }}>{proj.technologies}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* CERTIFICATIONS */}
            {certificationsList.length > 0 && (
              <div className="section-block" style={{ marginBottom: "12px", width: "100%" }}>
                <h2 className="section-headline" style={{ fontSize: "9.5pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #000000", paddingBottom: "2px", marginTop: "0px", marginBottom: "6px", color: "#000000", width: "100%", display: "block" }}>
                  CERTIFICATIONS
                </h2>
                {certificationsList.map((cert, cIdx) => (
                  <div key={cert.id} className="cert-item" style={{ marginBottom: cIdx === certificationsList.length - 1 ? "0px" : "4px", fontSize: "8.5pt", lineHeight: 1.3, color: "#000000" }}>
                    <strong style={{ fontWeight: 700, color: "#000000" }}>{cert.name}: </strong>
                    <span style={{ color: "#000000" }}>{cert.details}</span>
                  </div>
                ))}
              </div>
            )}

            {/* SKILLS */}
            {skillsCategories.length > 0 && (
              <div className="section-block" style={{ marginBottom: "0px", width: "100%" }}>
                <h2 className="section-headline" style={{ fontSize: "9.5pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #000000", paddingBottom: "2px", marginTop: "0px", marginBottom: "6px", color: "#000000", width: "100%", display: "block" }}>
                  SKILLS
                </h2>
                {skillsCategories.map((sc, sIdx) => (
                  <div key={sc.id} className="skill-item" style={{ marginBottom: sIdx === skillsCategories.length - 1 ? "0px" : "3.5px", fontSize: "8.5pt", lineHeight: 1.3, color: "#000000" }}>
                    <strong style={{ fontWeight: 700, color: "#000000" }}>{sc.category}: </strong>
                    <span style={{ color: "#000000" }}>{sc.skills}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResumePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading ATS Resume Studio...</div>}>
      <ResumeStudioContent />
    </Suspense>
  );
}

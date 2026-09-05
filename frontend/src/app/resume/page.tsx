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
  EyeOff,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
  Code2,
  FolderGit2,
  Wand2,
  RotateCcw,
  LayoutTemplate,
  Layers,
  Settings2,
  DollarSign,
  TrendingUp,
  Users,
  HeartPulse,
  Phone,
  MapPin,
  Mail,
  Linkedin,
  Github,
  Globe,
  X,
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

interface ContactFieldsVisibility {
  phone: boolean;
  location: boolean;
  email: boolean;
  linkedin: boolean;
  github: boolean;
  portfolio: boolean;
}

interface IndustryTemplate {
  id: string;
  name: string;
  category: string;
  iconName: "code" | "briefcase" | "trending" | "dollar" | "users" | "heart" | "building" | "file";
  description: string;
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  portfolio: string;
  visibleContactFields: ContactFieldsVisibility;
  sectionTitles: {
    education: string;
    experience: string;
    projects: string;
    certifications: string;
    skills: string;
  };
  sectionVisibility: {
    education: boolean;
    experience: boolean;
    projects: boolean;
    certifications: boolean;
    skills: boolean;
  };
  educationList: EducationItem[];
  experienceList: WorkExperienceItem[];
  projectsList: ProjectItem[];
  certificationsList: CertificationItem[];
  skillsCategories: SkillCategoryItem[];
}

// Multi-Industry ATS Resume Templates
const INDUSTRY_TEMPLATES: Record<string, IndustryTemplate> = {
  tech: {
    id: "tech",
    name: "Software & Technology",
    category: "Engineering & Tech",
    iconName: "code",
    description: "Tailored for Software Engineers, Full-Stack Developers, Cloud Architects, and DevOps.",
    fullName: "ALEXANDER MORGAN",
    headline: "Senior Full-Stack Engineer · Cloud Solutions Architect · Technical Consultant",
    email: "alex.morgan@example.com",
    phone: "(415) 555-0192",
    location: "San Francisco, CA",
    linkedin: "linkedin.com/in/alex-morgan",
    github: "github.com/alexmorgan",
    portfolio: "alexmorgan.dev",
    visibleContactFields: {
      phone: true,
      location: true,
      email: true,
      linkedin: true,
      github: true,
      portfolio: true,
    },
    sectionTitles: {
      education: "EDUCATION",
      experience: "WORK EXPERIENCE",
      projects: "PROJECTS",
      certifications: "CERTIFICATIONS",
      skills: "TECHNICAL SKILLS & TECHNOLOGIES",
    },
    sectionVisibility: {
      education: true,
      experience: true,
      projects: true,
      certifications: true,
      skills: true,
    },
    educationList: [
      {
        id: "edu-tech-1",
        school: "STATE UNIVERSITY OF SCIENCE & TECHNOLOGY",
        location: "San Francisco, CA",
        degree: "Bachelor of Science in Computer Science & Information Systems",
      },
    ],
    experienceList: [
      {
        id: "exp-tech-1",
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
        id: "exp-tech-2",
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
        id: "exp-tech-3",
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
        id: "proj-tech-1",
        title: "PulseEngine",
        tagline: "High-performance autonomous job indexing and candidate qualification copilot",
        technologies: "Next.js · TypeScript · FastAPI · PostgreSQL",
      },
      {
        id: "proj-tech-2",
        title: "CloudTrack OS",
        tagline: "All-in-one distributed workforce tracking, scheduling, and payroll integration platform",
        technologies: "React · Node.js · Supabase · Tailwind CSS",
      },
      {
        id: "proj-tech-3",
        title: "PaceMentor AI",
        tagline: "AI-powered adaptive mobile coaching application with GPS telemetry and health analytics",
        technologies: "Flutter · Firebase · Python",
      },
    ],
    certificationsList: [
      {
        id: "cert-tech-1",
        name: "AWS Certified Solutions Architect",
        details: "Generative AI · Distributed Systems · Serverless Infrastructure · Advanced SQL & Database Design",
      },
      {
        id: "cert-tech-2",
        name: "IBM AI Engineering Professional",
        details: "RAG Architectures · Neural Networks & Deep Learning · Prompt Engineering · LLM Orchestration",
      },
      {
        id: "cert-tech-3",
        name: "Lean Six Sigma — Green Belt",
        details: "Process Optimization & Quality Engineering",
      },
    ],
    skillsCategories: [
      {
        id: "skill-tech-1",
        category: "AI & Context Engineering",
        skills: "Context Engineering · Agentic Workflows · RAG Pipelines · Prompt Architecture · LLM Orchestration · OpenAI API · Groq LLM",
      },
      {
        id: "skill-tech-2",
        category: "Frontend",
        skills: "React · Next.js · Vue.js · TypeScript · Tailwind CSS · State Management · Flutter",
      },
      {
        id: "skill-tech-3",
        category: "Backend & Databases",
        skills: "Node.js · Python · FastAPI · PHP · Laravel · PostgreSQL · MySQL · Redis · Supabase · Firebase · REST APIs",
      },
      {
        id: "skill-tech-4",
        category: "Tools & Platforms",
        skills: "AWS · Docker · Kubernetes · GitHub Actions · CI/CD · Vercel · Figma · Git",
      },
      {
        id: "skill-tech-5",
        category: "Languages",
        skills: "English (fluent) · Filipino (native)",
      },
    ],
  },
  business_ops: {
    id: "business_ops",
    name: "Business & Operations",
    category: "Operations & Management",
    iconName: "briefcase",
    description: "Built for Operations Managers, Project Directors, Scrum Masters, and Logistics Specialists.",
    fullName: "JORDAN R. CARTER",
    headline: "Senior Operations Manager · Project Director · Agile & Lean Six Sigma Lead",
    email: "jordan.carter@example.com",
    phone: "(312) 555-0148",
    location: "Chicago, IL",
    linkedin: "linkedin.com/in/jordan-carter",
    github: "",
    portfolio: "jordancarter-ops.com",
    visibleContactFields: {
      phone: true,
      location: true,
      email: true,
      linkedin: true,
      github: false,
      portfolio: true,
    },
    sectionTitles: {
      education: "EDUCATION",
      experience: "PROFESSIONAL EXPERIENCE",
      projects: "STRATEGIC INITIATIVES & PROGRAMS",
      certifications: "LICENSES & CERTIFICATIONS",
      skills: "CORE COMPETENCIES & ENTERPRISE TOOLS",
    },
    sectionVisibility: {
      education: true,
      experience: true,
      projects: true,
      certifications: true,
      skills: true,
    },
    educationList: [
      {
        id: "edu-ops-1",
        school: "STATE UNIVERSITY OF BUSINESS ADMINISTRATION",
        location: "Chicago, IL",
        degree: "Bachelor of Business Administration (BBA) — Supply Chain & Operations Management",
      },
    ],
    experienceList: [
      {
        id: "exp-ops-1",
        company: "GLOBAL LOGISTICS & SUPPLY CORP",
        location: "Chicago, IL",
        role: "Director of Operations",
        period: "2023 – Present",
        bullets: [
          "Directed multi-site logistics operations across 4 regional fulfillment centers, improving order fulfillment velocity by 32% while reducing operational overhead by $1.8M.",
          "Led cross-functional team of 18 project managers and warehouse supervisors, standardizing Kaizen and Lean Six Sigma SOPs across enterprise workflows.",
        ],
      },
      {
        id: "exp-ops-2",
        company: "SUMMIT BUSINESS CONSULTING",
        location: "Austin, TX",
        role: "Senior Project Manager",
        period: "2021 – 2023",
        bullets: [
          "Orchestrated 14 enterprise digital transformation projects on time and 12% under budget, utilizing Agile/Scrum and RACI governance frameworks.",
          "Standardized automated executive KPI dashboards in Power BI and Tableau, reducing weekly leadership status reporting overhead by 60%.",
        ],
      },
      {
        id: "exp-ops-3",
        company: "APEX ADVISORY GROUP",
        location: "Remote",
        role: "Operations Analyst",
        period: "2019 – 2021",
        bullets: [
          "Conducted comprehensive business process re-engineering and root-cause variance analysis, saving 400+ monthly labor hours.",
        ],
      },
    ],
    projectsList: [
      {
        id: "proj-ops-1",
        title: "Enterprise SAP S/4HANA Migration",
        tagline: "End-to-end ERP deployment across 6 operating units training 450+ stakeholders",
        technologies: "SAP ERP · Jira · Power BI · RACI Framework",
      },
      {
        id: "proj-ops-2",
        title: "Global Vendor SLA Optimization",
        tagline: "Restructured third-party procurement and SLA compliance metrics, reducing fulfillment delays by 40%",
        technologies: "Lean Six Sigma · Cost Modeling · Contract Negotiation",
      },
    ],
    certificationsList: [
      {
        id: "cert-ops-1",
        name: "PMP (Project Management Professional)",
        details: "Project Management Institute (PMI) · Agile & Waterfall Governance",
      },
      {
        id: "cert-ops-2",
        name: "Lean Six Sigma Black Belt",
        details: "Process Optimization · Kaizen · Root Cause Analysis · Statistical Quality Control",
      },
      {
        id: "cert-ops-3",
        name: "Certified ScrumMaster (CSM)",
        details: "Scrum Alliance · Agile Team Coaching & Sprint Ceremonies",
      },
    ],
    skillsCategories: [
      {
        id: "skill-ops-1",
        category: "Operations & Governance",
        skills: "P&L Management · Budgeting & Forecasting · Supply Chain Optimization · Vendor Management · Risk Mitigation · KPI Scorecards",
      },
      {
        id: "skill-ops-2",
        category: "Methodologies",
        skills: "Agile / Scrum · Lean Six Sigma · Kaizen · Change Management · Continuous Improvement · Root Cause Analysis",
      },
      {
        id: "skill-ops-3",
        category: "Enterprise Systems",
        skills: "SAP ERP · Jira · Asana · Power BI · Tableau · Salesforce CRM · Advanced Microsoft Excel (VBA / Power Query)",
      },
      {
        id: "skill-ops-4",
        category: "Languages",
        skills: "English (fluent) · Spanish (professional)",
      },
    ],
  },
  sales_marketing: {
    id: "sales_marketing",
    name: "Marketing & Sales",
    category: "Growth & Commercial",
    iconName: "trending",
    description: "Designed for Growth Marketers, Account Executives, Brand Strategists, and Revenue Leads.",
    fullName: "TAYLOR M. VANCE",
    headline: "Director of Growth Marketing · Enterprise Sales Strategist · Demand Generation Lead",
    email: "taylor.vance@example.com",
    phone: "(212) 555-0183",
    location: "New York, NY",
    linkedin: "linkedin.com/in/taylor-vance",
    github: "",
    portfolio: "taylorvance-growth.com",
    visibleContactFields: {
      phone: true,
      location: true,
      email: true,
      linkedin: true,
      github: false,
      portfolio: true,
    },
    sectionTitles: {
      education: "EDUCATION",
      experience: "PROFESSIONAL EXPERIENCE",
      projects: "KEY CAMPAIGNS & GTM INITIATIVES",
      certifications: "CREDENTIALS & CERTIFICATIONS",
      skills: "GROWTH STACK & CORE COMPETENCIES",
    },
    sectionVisibility: {
      education: true,
      experience: true,
      projects: true,
      certifications: true,
      skills: true,
    },
    educationList: [
      {
        id: "edu-mkt-1",
        school: "NORTHWESTERN COMMUNICATIONS INSTITUTE",
        location: "New York, NY",
        degree: "Bachelor of Science in Marketing & Strategic Communications",
      },
    ],
    experienceList: [
      {
        id: "exp-mkt-1",
        company: "VANGUARD BRAND MEDIA",
        location: "New York, NY",
        role: "Head of Demand Generation",
        period: "2023 – Present",
        bullets: [
          "Scaled annual inbound qualified pipeline from $3.2M to $9.4M ARR across paid acquisition, lifecycle email, and organic SEO channels.",
          "Managed $1.6M multi-channel marketing budget, achieving 3.8x blended ROAS and lowering customer acquisition cost (CAC) by 28%.",
        ],
      },
      {
        id: "exp-mkt-2",
        company: "HORIZON DIGITAL GROWTH",
        location: "Boston, MA",
        role: "Senior Growth Marketing Manager",
        period: "2021 – 2023",
        bullets: [
          "Spearheaded account-based marketing (ABM) campaigns targeting Tier-1 enterprise accounts, generating 420+ high-intent sales opportunities.",
          "Orchestrated conversion rate optimization (CRO) A/B testing on landing pages, boosting checkout conversion rates by 44%.",
        ],
      },
      {
        id: "exp-mkt-3",
        company: "BEACON ENTERPRISE SALES",
        location: "Remote",
        role: "Enterprise Account Executive",
        period: "2019 – 2021",
        bullets: [
          "Achieved 138% average annual quota attainment, closing $4.2M in recurring software contract revenue.",
        ],
      },
    ],
    projectsList: [
      {
        id: "proj-mkt-1",
        title: "Global SaaS Product Launch GTM",
        tagline: "Orchestrated multi-channel campaign generating 14,000+ demo signups and $1.8M ARR in 90 days",
        technologies: "HubSpot · Google Ads · LinkedIn Ads · Meta Ads Manager",
      },
      {
        id: "proj-mkt-2",
        title: "Automated Customer Lifecycle Engine",
        tagline: "Designed behavioral trigger email nurture funnels in HubSpot, lifting 60-day customer retention by 35%",
        technologies: "HubSpot Workflows · Segment · Mixpanel · Copywriting",
      },
    ],
    certificationsList: [
      {
        id: "cert-mkt-1",
        name: "HubSpot Inbound & Growth Certified",
        details: "Inbound Marketing · Marketing Automation · Lifecycle Funnel Strategy",
      },
      {
        id: "cert-mkt-2",
        name: "Google Analytics 4 (GA4) & Google Ads Professional",
        details: "Search Ads · Attribution Modeling · Multi-Touch Conversion Tracking",
      },
      {
        id: "cert-mkt-3",
        name: "Salesforce Certified Administrator",
        details: "CRM Pipeline Architecture · Lead Scoring · Workflow Rules",
      },
    ],
    skillsCategories: [
      {
        id: "skill-mkt-1",
        category: "Growth & Strategy",
        skills: "Demand Generation · B2B / B2C Marketing · Account-Based Marketing (ABM) · Go-To-Market (GTM) Strategy · Brand Positioning",
      },
      {
        id: "skill-mkt-2",
        category: "Sales & Revenue",
        skills: "Pipeline Velocity · Solution Selling · Contract Negotiation · Lead Qualification (MEDDPICC) · Customer Retention",
      },
      {
        id: "skill-mkt-3",
        category: "Marketing Stack",
        skills: "HubSpot · Salesforce CRM · Google Analytics (GA4) · SEMrush · Mailchimp · Meta Ads Manager · LinkedIn Campaign Manager",
      },
      {
        id: "skill-mkt-4",
        category: "Languages",
        skills: "English (fluent) · French (conversational)",
      },
    ],
  },
  finance_accounting: {
    id: "finance_accounting",
    name: "Finance & Accounting",
    category: "Finance & Banking",
    iconName: "dollar",
    description: "Built for Financial Analysts, CPAs, Corporate Accountants, and FP&A Directors.",
    fullName: "MORGAN L. REYES",
    headline: "Senior Financial Analyst · Corporate Accounting Specialist · FP&A Lead",
    email: "morgan.reyes@example.com",
    phone: "(415) 555-0177",
    location: "San Francisco, CA",
    linkedin: "linkedin.com/in/morgan-reyes",
    github: "",
    portfolio: "",
    visibleContactFields: {
      phone: true,
      location: true,
      email: true,
      linkedin: true,
      github: false,
      portfolio: false,
    },
    sectionTitles: {
      education: "EDUCATION",
      experience: "PROFESSIONAL EXPERIENCE",
      projects: "FINANCIAL MODELS & VALUATION PROJECTS",
      certifications: "LICENSES & CERTIFICATIONS",
      skills: "FINANCIAL MODELING & TECHNICAL TOOLS",
    },
    sectionVisibility: {
      education: true,
      experience: true,
      projects: true,
      certifications: true,
      skills: true,
    },
    educationList: [
      {
        id: "edu-fin-1",
        school: "STATE UNIVERSITY SCHOOL OF BUSINESS",
        location: "San Francisco, CA",
        degree: "Bachelor of Science in Finance & Accounting (Summa Cum Laude)",
      },
    ],
    experienceList: [
      {
        id: "exp-fin-1",
        company: "STERLING CAPITAL PARTNERS",
        location: "San Francisco, CA",
        role: "Senior FP&A Analyst",
        period: "2023 – Present",
        bullets: [
          "Built dynamic 3-statement financial models, multi-year operating budgets, and variance forecasts for $65M commercial portfolio.",
          "Presented monthly P&L executive reviews and capital expenditure scenario analyses to CFO and Board of Directors.",
        ],
      },
      {
        id: "exp-fin-2",
        company: "KEYSTONE FINANCIAL SERVICES",
        location: "Los Angeles, CA",
        role: "Senior Corporate Accountant",
        period: "2021 – 2023",
        bullets: [
          "Led month-end and year-end GAAP financial close, ledger reconciliations, and external audit filings with zero compliance deficiencies.",
          "Automated accounts reconciliation workflows using Excel Power Query and Python, cutting financial close cycle by 4 business days.",
        ],
      },
      {
        id: "exp-fin-3",
        company: "PACIFIC FIRST BANCORP",
        location: "Seattle, WA",
        role: "Financial Analyst",
        period: "2019 – 2021",
        bullets: [
          "Evaluated commercial credit facilities and prepared quantitative discounted cash flow (DCF) valuation models.",
        ],
      },
    ],
    projectsList: [
      {
        id: "proj-fin-1",
        title: "M&A Buy-Side Financial Valuation Model",
        tagline: "Engineered comprehensive DCF, LBO, and sensitivity valuation model for $34M corporate acquisition",
        technologies: "Discounted Cash Flow · Sensitivity Analysis · Scenario Modeling",
      },
      {
        id: "proj-fin-2",
        title: "Corporate Cost Restructuring Audit",
        tagline: "Identified $2.2M in redundant operational expenditure across software and vendor supply contracts",
        technologies: "Variance Analysis · GAAP Compliance · ERP Audit",
      },
    ],
    certificationsList: [
      {
        id: "cert-fin-1",
        name: "CPA (Certified Public Accountant)",
        details: "State Board of Accountancy · US GAAP & Financial Reporting",
      },
      {
        id: "cert-fin-2",
        name: "FMVA (Financial Modeling & Valuation Analyst)",
        details: "Corporate Finance Institute (CFI) · DCF, LBO, and M&A Modeling",
      },
      {
        id: "cert-fin-3",
        name: "CFA Level II Candidate",
        details: "CFA Institute · Equity Valuation & Portfolio Management",
      },
    ],
    skillsCategories: [
      {
        id: "skill-fin-1",
        category: "Financial Modeling",
        skills: "DCF Valuation · 3-Statement Financial Modeling · Budget Forecasting · Variance Analysis · Sensitivity Testing · LBO Modeling",
      },
      {
        id: "skill-fin-2",
        category: "Accounting & Compliance",
        skills: "US GAAP · IFRS Standards · Month-End Close · General Ledger · Internal Auditing · SOX Compliance · Tax Strategy",
      },
      {
        id: "skill-fin-3",
        category: "Financial Systems",
        skills: "QuickBooks Pro · NetSuite ERP · Microsoft Excel (VBA / Power Query) · Bloomberg Terminal · Power BI · SAP FI/CO",
      },
      {
        id: "skill-fin-4",
        category: "Languages",
        skills: "English (fluent) · Mandarin (professional)",
      },
    ],
  },
  hr_people_ops: {
    id: "hr_people_ops",
    name: "Human Resources & Talent",
    category: "People & HR",
    iconName: "users",
    description: "Designed for HR Business Partners, Talent Acquisition Leads, and People Operations Managers.",
    fullName: "SAMANTHA K. HAYES",
    headline: "Senior HR Business Partner · Talent Acquisition Director · Employee Relations Lead",
    email: "samantha.hayes@example.com",
    phone: "(612) 555-0199",
    location: "Minneapolis, MN",
    linkedin: "linkedin.com/in/samantha-hayes",
    github: "",
    portfolio: "",
    visibleContactFields: {
      phone: true,
      location: true,
      email: true,
      linkedin: true,
      github: false,
      portfolio: false,
    },
    sectionTitles: {
      education: "EDUCATION",
      experience: "PROFESSIONAL EXPERIENCE",
      projects: "ORGANIZATIONAL INITIATIVES & PROGRAMS",
      certifications: "PROFESSIONAL CREDENTIALS",
      skills: "HR COMPETENCIES & HCM PLATFORMS",
    },
    sectionVisibility: {
      education: true,
      experience: true,
      projects: true,
      certifications: true,
      skills: true,
    },
    educationList: [
      {
        id: "edu-hr-1",
        school: "MIDWEST UNIVERSITY OF HUMAN RESOURCES",
        location: "Minneapolis, MN",
        degree: "Bachelor of Arts in Human Resources Management & Industrial Relations",
      },
    ],
    experienceList: [
      {
        id: "exp-hr-1",
        company: "PINNACLE ENTERPRISE GROUP",
        location: "Minneapolis, MN",
        role: "Senior HR Business Partner",
        period: "2023 – Present",
        bullets: [
          "Served as dedicated strategic HR advisor for 550+ employees across 5 business units, decreasing annualized employee turnover from 24% to 11%.",
          "Spearheaded organizational restructuring, performance appraisal frameworks, and executive coaching across leadership tiers.",
        ],
      },
      {
        id: "exp-hr-2",
        company: "BRIGHTPATH TALENT SOLUTIONS",
        location: "Denver, CO",
        role: "Talent Acquisition Manager",
        period: "2021 – 2023",
        bullets: [
          "Scaled headcount by 160+ specialized roles in 18 months, shortening average time-to-hire by 32% and lifting offer acceptance rate to 92%.",
          "Implemented structured competency-based interviewing and DEI hiring rubrics across all hiring managers.",
        ],
      },
      {
        id: "exp-hr-3",
        company: "CRESTVIEW ENTERPRISES",
        location: "Remote",
        role: "HR Generalist",
        period: "2019 – 2021",
        bullets: [
          "Administered benefits programs, onboarding workflows, and workplace dispute resolutions ensuring 100% compliance with labor laws.",
        ],
      },
    ],
    projectsList: [
      {
        id: "proj-hr-1",
        title: "Enterprise Onboarding & Culture Redesign",
        tagline: "Restructured 90-day new hire integration curriculum, elevating 1st-year employee retention to 94%",
        technologies: "Workday · BambooHR · Employee Experience Surveying",
      },
      {
        id: "proj-hr-2",
        title: "Quarterly OKR & Performance Overhaul",
        tagline: "Modernized performance evaluation system replacing annual reviews for 700+ employees",
        technologies: "Culture Amp · Goal Alignment · Compensation Benchmarking",
      },
    ],
    certificationsList: [
      {
        id: "cert-hr-1",
        name: "SHRM-SCP (Senior Certified Professional)",
        details: "Society for Human Resource Management · Strategic HR Leadership",
      },
      {
        id: "cert-hr-2",
        name: "SPHR (Senior Professional in Human Resources)",
        details: "HRCI · Employment Law, Labor Compliance & Strategic Workforce Planning",
      },
    ],
    skillsCategories: [
      {
        id: "skill-hr-1",
        category: "People Strategy",
        skills: "Talent Acquisition · Employee Relations · Total Rewards & Benefits · Performance Management · DEI Initiatives · Leadership Coaching",
      },
      {
        id: "skill-hr-2",
        category: "Compliance & Law",
        skills: "FMLA / FLSA / ADA Compliance · Labor Relations · Workplace Investigations · Conflict Resolution · Policy Formulation",
      },
      {
        id: "skill-hr-3",
        category: "HR Platforms",
        skills: "Workday HCM · BambooHR · Greenhouse ATS · ADP Workforce Now · Culture Amp · Lever · Microsoft Office 365",
      },
      {
        id: "skill-hr-4",
        category: "Languages",
        skills: "English (fluent) · Tagalog (native)",
      },
    ],
  },
  healthcare_admin: {
    id: "healthcare_admin",
    name: "Healthcare & Administration",
    category: "Healthcare & Clinical",
    iconName: "heart",
    description: "Designed for Clinical Operations Managers, Healthcare Administrators, and Patient Coordinators.",
    fullName: "ELENA V. RAMOS",
    headline: "Healthcare Operations Manager · Clinical Administrative Lead · Patient Experience Director",
    email: "elena.ramos@example.com",
    phone: "(619) 555-0164",
    location: "San Diego, CA",
    linkedin: "linkedin.com/in/elena-ramos",
    github: "",
    portfolio: "",
    visibleContactFields: {
      phone: true,
      location: true,
      email: true,
      linkedin: true,
      github: false,
      portfolio: false,
    },
    sectionTitles: {
      education: "EDUCATION",
      experience: "CLINICAL & ADMINISTRATIVE EXPERIENCE",
      projects: "QUALITY IMPROVEMENT & COMPLIANCE PROGRAMS",
      certifications: "LICENSES & CLINICAL CERTIFICATIONS",
      skills: "CLINICAL KNOWLEDGE & HEALTHCARE SYSTEMS",
    },
    sectionVisibility: {
      education: true,
      experience: true,
      projects: true,
      certifications: true,
      skills: true,
    },
    educationList: [
      {
        id: "edu-hc-1",
        school: "CALIFORNIA INSTITUTE OF HEALTH SCIENCES",
        location: "San Diego, CA",
        degree: "Bachelor of Science in Healthcare Administration & Health Informatics",
      },
    ],
    experienceList: [
      {
        id: "exp-hc-1",
        company: "PACIFIC COAST HEALTHCARE NETWORK",
        location: "San Diego, CA",
        role: "Clinical Operations Manager",
        period: "2023 – Present",
        bullets: [
          "Supervised daily clinical operations for multi-specialty healthcare facility supporting 42 physicians and 35,000 annual patient visits.",
          "Streamlined patient intake and triage scheduling workflows, reducing average clinic wait times by 38% and elevating satisfaction to 96%.",
        ],
      },
      {
        id: "exp-hc-2",
        company: "METRO HEALTHCARE SYSTEMS",
        location: "Phoenix, AZ",
        role: "Healthcare Administrative Coordinator",
        period: "2021 – 2023",
        bullets: [
          "Oversaw provider credentialing, medical records compliance, and insurance claims escalation resolving 98% of prior authorizations within 24h.",
          "Conducted quarterly clinical staff audits ensuring strict adherence to HIPAA, OSHA, and Joint Commission accreditation standards.",
        ],
      },
      {
        id: "exp-hc-3",
        company: "ST. JUDE COMMUNITY CLINIC",
        location: "Remote",
        role: "Patient Services Representative Lead",
        period: "2019 – 2021",
        bullets: [
          "Trained and scheduled front-desk staff across 3 outpatient clinics while maintaining 100% billing accuracy.",
        ],
      },
    ],
    projectsList: [
      {
        id: "proj-hc-1",
        title: "Enterprise Electronic Health Record (EHR) Migration",
        tagline: "Managed staff transition to Epic Systems, achieving 100% on-time provider charting compliance",
        technologies: "Epic EHR · Workflow Mapping · Clinical Training",
      },
      {
        id: "proj-hc-2",
        title: "HIPAA Security & Patient Records Audit",
        tagline: "Revamped electronic document storage and access protocols, eliminating data entry audit vulnerabilities",
        technologies: "HIPAA Privacy · EHR Compliance · Joint Commission Standards",
      },
    ],
    certificationsList: [
      {
        id: "cert-hc-1",
        name: "Certified Medical Manager (CMM)",
        details: "Professional Healthcare Institute · Practice Management & Compliance",
      },
      {
        id: "cert-hc-2",
        name: "HIPAA Security & Privacy Professional",
        details: "Healthcare Compliance Association · Patient Data Protection & Regulatory Audits",
      },
      {
        id: "cert-hc-3",
        name: "Basic Life Support (BLS)",
        details: "American Heart Association",
      },
    ],
    skillsCategories: [
      {
        id: "skill-hc-1",
        category: "Healthcare Operations",
        skills: "Medical Billing & Coding (ICD-10 / CPT) · Patient Scheduling · Provider Credentialing · HIPAA Compliance · Quality Assurance",
      },
      {
        id: "skill-hc-2",
        category: "Clinical Systems",
        skills: "Epic Systems · Cerner EHR · Kareo · Meditech · AthenaHealth · Microsoft Excel · Doxy.me Telehealth",
      },
      {
        id: "skill-hc-3",
        category: "Core Competencies",
        skills: "Cross-Functional Clinical Leadership · Patient Advocacy · Dispute Resolution · Multidisciplinary Staff Training",
      },
      {
        id: "skill-hc-4",
        category: "Languages",
        skills: "English (fluent) · Spanish (fluent medical terminology)",
      },
    ],
  },
  general_consulting: {
    id: "general_consulting",
    name: "Management & Consulting",
    category: "Consulting & Strategy",
    iconName: "building",
    description: "Built for Management Consultants, Strategy Advisors, and Business Transformation Leaders.",
    fullName: "DEVON A. SULLIVAN",
    headline: "Senior Management Consultant · Strategy & Business Transformation Advisor",
    email: "devon.sullivan@example.com",
    phone: "(215) 555-0131",
    location: "Philadelphia, PA",
    linkedin: "linkedin.com/in/devon-sullivan",
    github: "",
    portfolio: "devonsullivan-advisory.com",
    visibleContactFields: {
      phone: true,
      location: true,
      email: true,
      linkedin: true,
      github: false,
      portfolio: true,
    },
    sectionTitles: {
      education: "EDUCATION",
      experience: "PROFESSIONAL EXPERIENCE",
      projects: "CLIENT ENGAGEMENTS & STRATEGIC ADVISORY",
      certifications: "CREDENTIALS & CERTIFICATIONS",
      skills: "CORE COMPETENCIES & CONSULTING TOOLKIT",
    },
    sectionVisibility: {
      education: true,
      experience: true,
      projects: true,
      certifications: true,
      skills: true,
    },
    educationList: [
      {
        id: "edu-cns-1",
        school: "EASTERN UNIVERSITY OF ECONOMICS & MANAGEMENT",
        location: "Philadelphia, PA",
        degree: "Bachelor of Arts in Economics & International Business",
      },
    ],
    experienceList: [
      {
        id: "exp-cns-1",
        company: "MONROE STRATEGY ADVISORY",
        location: "Philadelphia, PA",
        role: "Senior Management Consultant",
        period: "2023 – Present",
        bullets: [
          "Advised Fortune 500 executive leadership on market entry strategies, operating model redesigns, and organizational cost containment.",
          "Led engagement squad of 5 analysts delivering $6.2M in annual recurring operational savings for global manufacturing client.",
        ],
      },
      {
        id: "exp-cns-2",
        company: "VANTAGE BUSINESS CONSULTING",
        location: "Washington, DC",
        role: "Management Consultant",
        period: "2021 – 2023",
        bullets: [
          "Formulated quantitative benchmarking analyses and change management roadmaps across 8 enterprise client transformations.",
          "Authored high-impact executive deliverables, steering committee presentations, and financial due diligence reports.",
        ],
      },
      {
        id: "exp-cns-3",
        company: "CAPITAL INSIGHT ANALYTICS",
        location: "Remote",
        role: "Business Strategy Analyst",
        period: "2019 – 2021",
        bullets: [
          "Performed competitive market landscape assessments and synthesized qualitative stakeholder interviews into actionable strategic frameworks.",
        ],
      },
    ],
    projectsList: [
      {
        id: "proj-cns-1",
        title: "Fortune 500 Operating Model Redesign",
        tagline: "Restructured cross-departmental reporting hierarchy and shared service centers, cutting operating lag by 30%",
        technologies: "Organizational Design · Change Management · Executive Alignment",
      },
      {
        id: "proj-cns-2",
        title: "Post-Merger Integration Playbook",
        tagline: "Synthesized standard integration playbook merging operations and technology for $80M corporate acquisition",
        technologies: "Due Diligence · PMO Governance · Risk Mitigation",
      },
    ],
    certificationsList: [
      {
        id: "cert-cns-1",
        name: "Certified Management Consultant (CMC)",
        details: "Institute of Management Consultants (IMC USA)",
      },
      {
        id: "cert-cns-2",
        name: "Certified ScrumMaster (CSM)",
        details: "Scrum Alliance · Agile Project Governance",
      },
    ],
    skillsCategories: [
      {
        id: "skill-cns-1",
        category: "Strategy & Advisory",
        skills: "Management Consulting · Operating Model Design · Market Sizing & Feasibility · Post-Merger Integration · Executive Presentation",
      },
      {
        id: "skill-cns-2",
        category: "Analytical Frameworks",
        skills: "MECE Framework · Financial Due Diligence · Competitive Benchmarking · Root Cause Analysis · Scenario Planning",
      },
      {
        id: "skill-cns-3",
        category: "Consulting Toolkit",
        skills: "Advanced PowerPoint · Microsoft Excel Financial Modeling · Tableau · Miro · Jira · Project Management Office (PMO)",
      },
      {
        id: "skill-cns-4",
        category: "Languages",
        skills: "English (fluent) · German (conversational)",
      },
    ],
  },
  blank: {
    id: "blank",
    name: "Custom / Blank Canvas",
    category: "Custom Setup",
    iconName: "file",
    description: "Start from a blank canvas to build your custom single-page resume.",
    fullName: "",
    headline: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    portfolio: "",
    visibleContactFields: {
      phone: true,
      location: true,
      email: true,
      linkedin: true,
      github: false,
      portfolio: false,
    },
    sectionTitles: {
      education: "EDUCATION",
      experience: "WORK EXPERIENCE",
      projects: "PROJECTS",
      certifications: "CERTIFICATIONS",
      skills: "SKILLS",
    },
    sectionVisibility: {
      education: true,
      experience: true,
      projects: true,
      certifications: true,
      skills: true,
    },
    educationList: [],
    experienceList: [],
    projectsList: [],
    certificationsList: [],
    skillsCategories: [],
  },
};

// Helper for Lucide Template Icons
function TemplateIcon({ name, className }: { name: IndustryTemplate["iconName"]; className?: string }) {
  switch (name) {
    case "code":
      return <Code2 className={className || "w-4 h-4"} />;
    case "briefcase":
      return <Briefcase className={className || "w-4 h-4"} />;
    case "trending":
      return <TrendingUp className={className || "w-4 h-4"} />;
    case "dollar":
      return <DollarSign className={className || "w-4 h-4"} />;
    case "users":
      return <Users className={className || "w-4 h-4"} />;
    case "heart":
      return <HeartPulse className={className || "w-4 h-4"} />;
    case "building":
      return <Building2 className={className || "w-4 h-4"} />;
    case "file":
    default:
      return <FileText className={className || "w-4 h-4"} />;
  }
}

function ResumeStudioContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const targetJobId = searchParams.get("job_id");

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [selectedTargetJob, setSelectedTargetJob] = useState<Job | null>(null);
  const [activeTab, setActiveTab] = useState<"editor" | "diagnostics" | "preview">("editor");
  const [copied, setCopied] = useState(false);
  const [isTailoring, setIsTailoring] = useState(false);

  // Industry Template Preset State
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("tech");

  // Customizable Section Titles & Visibility
  const [sectionTitles, setSectionTitles] = useState({
    education: "EDUCATION",
    experience: "WORK EXPERIENCE",
    projects: "PROJECTS",
    certifications: "CERTIFICATIONS",
    skills: "TECHNICAL SKILLS & TECHNOLOGIES",
  });

  const [sectionVisibility, setSectionVisibility] = useState({
    education: true,
    experience: true,
    projects: true,
    certifications: true,
    skills: true,
  });

  // Contact Field Visibility Controls
  const [visibleContactFields, setVisibleContactFields] = useState<ContactFieldsVisibility>({
    phone: true,
    location: true,
    email: true,
    linkedin: true,
    github: true,
    portfolio: true,
  });

  // Resume Content State (Initialized with Tech Template Placeholders)
  const [fullName, setFullName] = useState(INDUSTRY_TEMPLATES.tech.fullName);
  const [headline, setHeadline] = useState(INDUSTRY_TEMPLATES.tech.headline);
  const [email, setEmail] = useState(INDUSTRY_TEMPLATES.tech.email);
  const [phone, setPhone] = useState(INDUSTRY_TEMPLATES.tech.phone);
  const [location, setLocation] = useState(INDUSTRY_TEMPLATES.tech.location);
  const [linkedin, setLinkedin] = useState(INDUSTRY_TEMPLATES.tech.linkedin);
  const [github, setGithub] = useState(INDUSTRY_TEMPLATES.tech.github);
  const [portfolio, setPortfolio] = useState(INDUSTRY_TEMPLATES.tech.portfolio);

  const [educationList, setEducationList] = useState<EducationItem[]>(INDUSTRY_TEMPLATES.tech.educationList);
  const [experienceList, setExperienceList] = useState<WorkExperienceItem[]>(INDUSTRY_TEMPLATES.tech.experienceList);
  const [projectsList, setProjectsList] = useState<ProjectItem[]>(INDUSTRY_TEMPLATES.tech.projectsList);
  const [certificationsList, setCertificationsList] = useState<CertificationItem[]>(INDUSTRY_TEMPLATES.tech.certificationsList);
  const [skillsCategories, setSkillsCategories] = useState<SkillCategoryItem[]>(INDUSTRY_TEMPLATES.tech.skillsCategories);

  // Switch Industry Template Preset
  const handleSelectIndustryTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tmpl = INDUSTRY_TEMPLATES[templateId];
    if (!tmpl) return;

    setFullName(tmpl.fullName);
    setHeadline(tmpl.headline);
    setEmail(tmpl.email);
    setPhone(tmpl.phone);
    setLocation(tmpl.location);
    setLinkedin(tmpl.linkedin);
    setGithub(tmpl.github);
    setPortfolio(tmpl.portfolio);
    setVisibleContactFields(tmpl.visibleContactFields);
    setSectionTitles(tmpl.sectionTitles);
    setSectionVisibility(tmpl.sectionVisibility);
    setEducationList(tmpl.educationList);
    setExperienceList(tmpl.experienceList);
    setProjectsList(tmpl.projectsList);
    setCertificationsList(tmpl.certificationsList);
    setSkillsCategories(tmpl.skillsCategories);
  };

  // Reset to Current Selected Template
  const handleResetToCurrentTemplate = () => {
    handleSelectIndustryTemplate(selectedTemplateId);
  };

  // Clear all fields
  const handleClearAll = () => {
    setSelectedTemplateId("blank");
    setFullName("");
    setHeadline("");
    setEmail("");
    setPhone("");
    setLocation("");
    setLinkedin("");
    setGithub("");
    setPortfolio("");
    setEducationList([]);
    setExperienceList([]);
    setProjectsList([]);
    setCertificationsList([]);
    setSkillsCategories([]);
  };

  // Toggle Visibility for a Specific Section
  const toggleSectionVisibility = (sectionKey: keyof typeof sectionVisibility) => {
    setSectionVisibility((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  // Update Section Title
  const handleUpdateSectionTitle = (sectionKey: keyof typeof sectionTitles, newTitle: string) => {
    setSectionTitles((prev) => ({
      ...prev,
      [sectionKey]: newTitle,
    }));
  };

  // Toggle optional contact fields (e.g. GitHub or Portfolio)
  const toggleContactField = (field: keyof ContactFieldsVisibility) => {
    setVisibleContactFields((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  // Load Candidate Profile once on initial mount
  useEffect(() => {
    let isMounted = true;
    async function initData() {
      setLoading(true);
      try {
        const [candProfile, jobsData] = await Promise.all([
          getCandidateProfile().catch(() => null),
          getJobs().catch(() => []),
        ]);

        if (!isMounted) return;

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
        if (isMounted) setLoading(false);
      }
    }
    initData();
    return () => {
      isMounted = false;
    };
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
          const techIndex = updated.findIndex((c) =>
            c.category.toLowerCase().includes("tools") ||
            c.category.toLowerCase().includes("competencies") ||
            c.category.toLowerCase().includes("skills") ||
            c.category.toLowerCase().includes("ai") ||
            c.category.toLowerCase().includes("frontend")
          );
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

  // Get active formatted contact list
  const getActiveContactItems = () => {
    const items: string[] = [];
    if (visibleContactFields.phone && phone.trim()) items.push(phone.trim());
    if (visibleContactFields.location && location.trim()) items.push(location.trim());
    if (visibleContactFields.email && email.trim()) items.push(email.trim());
    if (visibleContactFields.linkedin && linkedin.trim()) items.push(linkedin.trim());
    if (visibleContactFields.github && github.trim()) items.push(github.trim());
    if (visibleContactFields.portfolio && portfolio.trim()) items.push(portfolio.trim());
    return items;
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
    
    const contactItems = getActiveContactItems();
    if (contactItems.length > 0) {
      textLines.push(contactItems.join(" • "));
    }

    if (sectionVisibility.education && educationList.length > 0) {
      textLines.push(`\n${sectionTitles.education}`);
      educationList.forEach((edu) => {
        textLines.push(`${edu.school} — ${edu.location}`);
        textLines.push(`${edu.degree}`);
      });
    }

    if (sectionVisibility.experience && experienceList.length > 0) {
      textLines.push(`\n${sectionTitles.experience}`);
      experienceList.forEach((exp) => {
        textLines.push(`${exp.company} — ${exp.location}`);
        textLines.push(`${exp.role} | ${exp.period}`);
        exp.bullets.forEach((b) => textLines.push(`• ${b}`));
      });
    }

    if (sectionVisibility.projects && projectsList.length > 0) {
      textLines.push(`\n${sectionTitles.projects}`);
      projectsList.forEach((proj) => {
        textLines.push(`${proj.title} — ${proj.tagline}`);
        if (proj.technologies) textLines.push(`${proj.technologies}`);
      });
    }

    if (sectionVisibility.certifications && certificationsList.length > 0) {
      textLines.push(`\n${sectionTitles.certifications}`);
      certificationsList.forEach((cert) => {
        textLines.push(`${cert.name}: ${cert.details}`);
      });
    }

    if (sectionVisibility.skills && skillsCategories.length > 0) {
      textLines.push(`\n${sectionTitles.skills}`);
      skillsCategories.forEach((sc) => {
        textLines.push(`${sc.category}: ${sc.skills}`);
      });
    }

    navigator.clipboard.writeText(textLines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const contactItems = getActiveContactItems();

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
            Build and export machine-parseable, single-page vector PDF resumes with pure black text and balanced professional spacing across any industry.
          </p>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap shrink-0 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyPlainText}
            className="h-9 px-3 text-xs font-semibold gap-1.5 border-border hover:bg-muted flex-1 sm:flex-initial"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy ATS Text"}</span>
          </Button>

          <Button
            onClick={handleDownloadPDF}
            variant="default"
            size="sm"
            className="h-9 px-4 text-xs font-semibold gap-1.5 shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground flex-1 sm:flex-initial"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download ATS PDF</span>
          </Button>
        </div>
      </div>

      {/* Preset & Optimization Bar */}
      <Card className="border-border bg-card p-3.5 sm:p-4 space-y-4 no-print">
        {/* Industry Preset Visual Cards */}
        <div className="space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <LayoutTemplate className="w-3.5 h-3.5 text-primary" />
              <span>Select Industry Template</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetToCurrentTemplate}
                className="text-muted-foreground hover:text-foreground text-[11px] font-medium flex items-center gap-1"
                title="Reload default data for this template"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Template Data</span>
              </button>
              <span className="text-muted-foreground/40">|</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-muted-foreground hover:text-rose-500 text-[11px] font-medium"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Clean Icon-Based Industry Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {Object.values(INDUSTRY_TEMPLATES).map((tmpl) => {
              const isSelected = selectedTemplateId === tmpl.id;
              return (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => handleSelectIndustryTemplate(tmpl.id)}
                  className={cn(
                    "flex flex-col items-center justify-center p-2.5 rounded-lg border text-center transition-all group",
                    isSelected
                      ? "border-primary bg-primary/10 text-foreground font-semibold shadow-xs"
                      : "border-border bg-muted/20 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <TemplateIcon
                    name={tmpl.iconName}
                    className={cn(
                      "w-4 h-4 mb-1.5 transition-colors",
                      isSelected ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  <span className="text-[11px] leading-tight line-clamp-2">{tmpl.name}</span>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground pt-0.5">
            {INDUSTRY_TEMPLATES[selectedTemplateId]?.description || "Customize headers, titles, and section visibility below."}
          </p>
        </div>

        {/* Target Job Optimization Option */}
        <div className="pt-2 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">Target Role Optimization (Optional)</span>
              {selectedTargetJob && (
                <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                  {selectedTargetJob.source}
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {selectedTargetJob
                ? `Aligns keywords with ${selectedTargetJob.title} at ${selectedTargetJob.company}.`
                : "Select a job from your pipeline to automatically match competencies and keywords."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 w-full sm:w-auto">
            <select
              aria-label="Target Job Selection"
              value={selectedTargetJob?.id || ""}
              onChange={(e) => handleSelectTargetJob(e.target.value)}
              className="bg-background border border-border rounded-md px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring font-medium h-8 w-full sm:w-auto sm:max-w-xs"
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
                className="h-8 px-3 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground shrink-0 w-full sm:w-auto"
              >
                <Wand2 className={cn("w-3.5 h-3.5", isTailoring && "animate-spin")} />
                <span>{isTailoring ? "Tailoring..." : "Align Keywords"}</span>
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Mobile Tab Segmented Switcher (Visible only on <lg screens) */}
      <div className="flex lg:hidden items-center bg-card border border-border rounded-xl p-1 gap-1 no-print">
        <button
          onClick={() => setActiveTab("editor")}
          className={cn(
            "flex-1 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5",
            activeTab === "editor"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Editor</span>
        </button>

        <button
          onClick={() => setActiveTab("preview")}
          className={cn(
            "flex-1 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5",
            activeTab === "preview"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Live Preview</span>
        </button>

        <button
          onClick={() => setActiveTab("diagnostics")}
          className={cn(
            "flex-1 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5",
            activeTab === "diagnostics"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Quality Check</span>
        </button>
      </div>

      {/* Main Studio Grid: Editor (Left 6 Cols) & Live Preview (Right 6 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Panel: Structured Editor (6 Cols) */}
        <div className={cn("lg:col-span-6 space-y-4 no-print", activeTab === "preview" ? "hidden lg:block" : "block")}>
          <div className="hidden lg:flex items-center justify-between bg-card border border-border rounded-xl p-1.5">
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
                <span>Resume Content &amp; Headings</span>
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

            <Badge variant="outline" className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
              <TemplateIcon name={INDUSTRY_TEMPLATES[selectedTemplateId]?.iconName || "file"} className="w-3 h-3" />
              <span>{INDUSTRY_TEMPLATES[selectedTemplateId]?.name}</span>
            </Badge>
          </div>

          {/* Tab 1: Editor Form */}
          {activeTab === "editor" && (
            <div className="space-y-4">
              {/* Header Info */}
              <Card className="border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-primary" />
                    <span>Header &amp; Contact Details</span>
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    {!visibleContactFields.github && (
                      <button
                        type="button"
                        onClick={() => toggleContactField("github")}
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add GitHub</span>
                      </button>
                    )}
                    {!visibleContactFields.portfolio && (
                      <button
                        type="button"
                        onClick={() => toggleContactField("portfolio")}
                        className="text-primary hover:underline flex items-center gap-1 ml-2"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Website</span>
                      </button>
                    )}
                  </div>
                </div>

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
                    <label className="text-[11px] font-semibold text-muted-foreground">Professional Headline / Target Role</label>
                    <Input
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="e.g. Operations Director · Senior Marketing Strategist"
                      className="h-8 text-xs bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      <span>Email Address</span>
                    </label>
                    <Input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="h-8 text-xs bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      <span>Phone Number</span>
                    </label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(555) 019-2834"
                      className="h-8 text-xs bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>Location</span>
                    </label>
                    <Input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="City, State (e.g. Chicago, IL)"
                      className="h-8 text-xs bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                      <Linkedin className="w-3 h-3" />
                      <span>LinkedIn Profile</span>
                    </label>
                    <Input
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      placeholder="linkedin.com/in/username"
                      className="h-8 text-xs bg-background"
                    />
                  </div>

                  {/* Industry-specific / optional GitHub */}
                  {visibleContactFields.github && (
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                          <Github className="w-3 h-3" />
                          <span>GitHub URL</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => toggleContactField("github")}
                          className="text-muted-foreground hover:text-rose-500 text-[10px]"
                          title="Remove GitHub field"
                        >
                          Remove
                        </button>
                      </div>
                      <Input
                        value={github}
                        onChange={(e) => setGithub(e.target.value)}
                        placeholder="github.com/username"
                        className="h-8 text-xs bg-background"
                      />
                    </div>
                  )}

                  {/* Industry-specific / optional Portfolio */}
                  {visibleContactFields.portfolio && (
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          <span>Portfolio / Website</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => toggleContactField("portfolio")}
                          className="text-muted-foreground hover:text-rose-500 text-[10px]"
                          title="Remove Website field"
                        >
                          Remove
                        </button>
                      </div>
                      <Input
                        value={portfolio}
                        onChange={(e) => setPortfolio(e.target.value)}
                        placeholder="portfolio.com"
                        className="h-8 text-xs bg-background"
                      />
                    </div>
                  )}
                </div>
              </Card>

              {/* Education */}
              <Card className="border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-3.5 h-3.5 text-primary shrink-0" />
                    <Input
                      aria-label="Education Section Title"
                      value={sectionTitles.education}
                      onChange={(e) => handleUpdateSectionTitle("education", e.target.value)}
                      className="h-7 text-xs font-bold uppercase w-40 bg-background/50 border-border"
                      title="Click to customize section title"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleSectionVisibility("education")}
                      className={cn(
                        "flex items-center gap-1 text-[11px] px-2 py-1 rounded border transition-colors",
                        sectionVisibility.education
                          ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5"
                          : "border-muted text-muted-foreground hover:text-foreground"
                      )}
                      title="Toggle section visibility on PDF and preview"
                    >
                      {sectionVisibility.education ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      <span>{sectionVisibility.education ? "Visible" : "Hidden"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setEducationList([
                          ...educationList,
                          { id: `edu-${Date.now()}`, school: "Institution Name", location: "City, State", degree: "Degree Title" },
                        ])
                      }
                      className="text-primary hover:underline font-medium text-[11px]"
                    >
                      + Add School
                    </button>
                  </div>
                </div>

                {!sectionVisibility.education && (
                  <p className="text-[11px] text-muted-foreground bg-muted/40 p-2 rounded italic">
                    This section is hidden from the resume preview and PDF export. Click "Hidden" to show.
                  </p>
                )}

                {sectionVisibility.education && educationList.map((edu, idx) => (
                  <div key={edu.id} className="p-3 rounded-lg border border-border bg-muted/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-muted-foreground">Education #{idx + 1}</span>
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
                        placeholder="Degree Title (e.g. Bachelor of Science in Business Management)"
                        className="h-8 text-xs bg-background sm:col-span-2"
                      />
                    </div>
                  </div>
                ))}
              </Card>

              {/* Work Experience */}
              <Card className="border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-primary shrink-0" />
                    <Input
                      aria-label="Work Experience Section Title"
                      value={sectionTitles.experience}
                      onChange={(e) => handleUpdateSectionTitle("experience", e.target.value)}
                      className="h-7 text-xs font-bold uppercase w-52 bg-background/50 border-border"
                      title="Click to customize section title"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleSectionVisibility("experience")}
                      className={cn(
                        "flex items-center gap-1 text-[11px] px-2 py-1 rounded border transition-colors",
                        sectionVisibility.experience
                          ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5"
                          : "border-muted text-muted-foreground hover:text-foreground"
                      )}
                      title="Toggle section visibility on PDF and preview"
                    >
                      {sectionVisibility.experience ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      <span>{sectionVisibility.experience ? "Visible" : "Hidden"}</span>
                    </button>

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
                            bullets: ["Led key initiatives and achieved measurable organizational outcomes."],
                          },
                        ])
                      }
                      className="text-primary hover:underline font-medium text-[11px]"
                    >
                      + Add Position
                    </button>
                  </div>
                </div>

                {!sectionVisibility.experience && (
                  <p className="text-[11px] text-muted-foreground bg-muted/40 p-2 rounded italic">
                    This section is hidden from the resume preview and PDF export. Click "Hidden" to show.
                  </p>
                )}

                {sectionVisibility.experience && (
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
                            placeholder="Company / Organization Name"
                            className="h-8 text-xs bg-background"
                          />
                          <Input
                            value={exp.location}
                            onChange={(e) => setExperienceList(experienceList.map((item) => item.id === exp.id ? { ...item, location: e.target.value } : item))}
                            placeholder="Location (e.g. Remote, City, State)"
                            className="h-8 text-xs bg-background"
                          />
                          <Input
                            value={exp.role}
                            onChange={(e) => setExperienceList(experienceList.map((item) => item.id === exp.id ? { ...item, role: e.target.value } : item))}
                            placeholder="Role Title (e.g. Operations Manager)"
                            className="h-8 text-xs bg-background"
                          />
                          <Input
                            value={exp.period}
                            onChange={(e) => setExperienceList(experienceList.map((item) => item.id === exp.id ? { ...item, period: e.target.value } : item))}
                            placeholder="Period (e.g. 2023 – Present)"
                            className="h-8 text-xs bg-background"
                          />
                        </div>

                        {/* Bullets */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                            <span className="font-semibold text-foreground">Bullet Achievements &amp; Metrics</span>
                            <button
                              type="button"
                              onClick={() =>
                                setExperienceList(
                                  experienceList.map((item) =>
                                    item.id === exp.id ? { ...item, bullets: [...item.bullets, "Executed key operational improvements resulting in quantifiable performance gains."] } : item
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
                )}
              </Card>

              {/* Projects / Key Initiatives */}
              <Card className="border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <FolderGit2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <Input
                      aria-label="Projects Section Title"
                      value={sectionTitles.projects}
                      onChange={(e) => handleUpdateSectionTitle("projects", e.target.value)}
                      className="h-7 text-xs font-bold uppercase w-60 bg-background/50 border-border"
                      title="Click to customize section title (e.g. KEY INITIATIVES & CAMPAIGNS)"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleSectionVisibility("projects")}
                      className={cn(
                        "flex items-center gap-1 text-[11px] px-2 py-1 rounded border transition-colors",
                        sectionVisibility.projects
                          ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5"
                          : "border-muted text-muted-foreground hover:text-foreground"
                      )}
                      title="Toggle section visibility on PDF and preview"
                    >
                      {sectionVisibility.projects ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      <span>{sectionVisibility.projects ? "Visible" : "Hidden"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setProjectsList([
                          ...projectsList,
                          { id: `proj-${Date.now()}`, title: "Initiative Title", tagline: "Summary of outcome and key impact", technologies: "Tools / Methodologies used" },
                        ])
                      }
                      className="text-primary hover:underline font-medium text-[11px]"
                    >
                      + Add Item
                    </button>
                  </div>
                </div>

                {!sectionVisibility.projects && (
                  <p className="text-[11px] text-muted-foreground bg-muted/40 p-2 rounded italic">
                    This section is hidden from the resume preview and PDF export. Click "Hidden" to show.
                  </p>
                )}

                {sectionVisibility.projects && (
                  <div className="space-y-2">
                    {projectsList.map((proj) => (
                      <div key={proj.id} className="p-2.5 rounded-lg border border-border bg-muted/20 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono text-muted-foreground">Item Entry</span>
                          <button
                            type="button"
                            onClick={() => setProjectsList(projectsList.filter((p) => p.id !== proj.id))}
                            className="text-muted-foreground hover:text-rose-500 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <Input
                            value={proj.title}
                            onChange={(e) => setProjectsList(projectsList.map((p) => p.id === proj.id ? { ...p, title: e.target.value } : p))}
                            placeholder="Title (e.g. Enterprise ERP Transformation)"
                            className="h-8 text-xs bg-background"
                          />
                          <Input
                            value={proj.technologies}
                            onChange={(e) => setProjectsList(projectsList.map((p) => p.id === proj.id ? { ...p, technologies: e.target.value } : p))}
                            placeholder="Tools / Core Focus (e.g. SAP ERP · Power BI · RACI)"
                            className="h-8 text-xs bg-background"
                          />
                        </div>
                        <Input
                          value={proj.tagline}
                          onChange={(e) => setProjectsList(projectsList.map((p) => p.id === proj.id ? { ...p, tagline: e.target.value } : p))}
                          placeholder="Tagline / Description of outcome"
                          className="h-8 text-xs bg-background"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Certifications / Credentials */}
              <Card className="border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Award className="w-3.5 h-3.5 text-primary shrink-0" />
                    <Input
                      aria-label="Certifications Section Title"
                      value={sectionTitles.certifications}
                      onChange={(e) => handleUpdateSectionTitle("certifications", e.target.value)}
                      className="h-7 text-xs font-bold uppercase w-56 bg-background/50 border-border"
                      title="Click to customize section title"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleSectionVisibility("certifications")}
                      className={cn(
                        "flex items-center gap-1 text-[11px] px-2 py-1 rounded border transition-colors",
                        sectionVisibility.certifications
                          ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5"
                          : "border-muted text-muted-foreground hover:text-foreground"
                      )}
                      title="Toggle section visibility on PDF and preview"
                    >
                      {sectionVisibility.certifications ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      <span>{sectionVisibility.certifications ? "Visible" : "Hidden"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setCertificationsList([
                          ...certificationsList,
                          { id: `cert-${Date.now()}`, name: "Certification Name", details: "Issuing Body · Relevant Topics" },
                        ])
                      }
                      className="text-primary hover:underline font-medium text-[11px]"
                    >
                      + Add Credential
                    </button>
                  </div>
                </div>

                {!sectionVisibility.certifications && (
                  <p className="text-[11px] text-muted-foreground bg-muted/40 p-2 rounded italic">
                    This section is hidden from the resume preview and PDF export. Click "Hidden" to show.
                  </p>
                )}

                {sectionVisibility.certifications && (
                  <div className="space-y-2">
                    {certificationsList.map((cert) => (
                      <div key={cert.id} className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2 rounded-lg border border-border bg-muted/20 items-center">
                        <Input
                          value={cert.name}
                          onChange={(e) => setCertificationsList(certificationsList.map((c) => c.id === cert.id ? { ...c, name: e.target.value } : c))}
                          placeholder="Credential (e.g. PMP, CPA, SHRM-SCP)"
                          className="h-8 text-xs bg-background font-semibold"
                        />
                        <div className="sm:col-span-2 flex items-center gap-2">
                          <Input
                            value={cert.details}
                            onChange={(e) => setCertificationsList(certificationsList.map((c) => c.id === cert.id ? { ...c, details: e.target.value } : c))}
                            placeholder="Issuing Organization &amp; Topics"
                            className="h-8 text-xs bg-background flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => setCertificationsList(certificationsList.filter((c) => c.id !== cert.id))}
                            className="text-muted-foreground hover:text-rose-500 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Skills / Core Competencies */}
              <Card className="border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <Input
                      aria-label="Skills Section Title"
                      value={sectionTitles.skills}
                      onChange={(e) => handleUpdateSectionTitle("skills", e.target.value)}
                      className="h-7 text-xs font-bold uppercase w-60 bg-background/50 border-border"
                      title="Click to customize section title"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleSectionVisibility("skills")}
                      className={cn(
                        "flex items-center gap-1 text-[11px] px-2 py-1 rounded border transition-colors",
                        sectionVisibility.skills
                          ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5"
                          : "border-muted text-muted-foreground hover:text-foreground"
                      )}
                      title="Toggle section visibility on PDF and preview"
                    >
                      {sectionVisibility.skills ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      <span>{sectionVisibility.skills ? "Visible" : "Hidden"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setSkillsCategories([
                          ...skillsCategories,
                          { id: `skill-${Date.now()}`, category: "Category Name", skills: "Skill Item 1 · Skill Item 2 · Skill Item 3" },
                        ])
                      }
                      className="text-primary hover:underline font-medium text-[11px]"
                    >
                      + Add Category
                    </button>
                  </div>
                </div>

                {!sectionVisibility.skills && (
                  <p className="text-[11px] text-muted-foreground bg-muted/40 p-2 rounded italic">
                    This section is hidden from the resume preview and PDF export. Click "Hidden" to show.
                  </p>
                )}

                {sectionVisibility.skills && (
                  <div className="space-y-2">
                    {skillsCategories.map((sc) => (
                      <div key={sc.id} className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2 rounded-lg border border-border bg-muted/20 items-center">
                        <Input
                          value={sc.category}
                          onChange={(e) => setSkillsCategories(skillsCategories.map((item) => item.id === sc.id ? { ...item, category: e.target.value } : item))}
                          placeholder="Category (e.g. Core Competencies)"
                          className="h-8 text-xs bg-background font-semibold"
                        />
                        <div className="sm:col-span-2 flex items-center gap-2">
                          <Input
                            value={sc.skills}
                            onChange={(e) => setSkillsCategories(skillsCategories.map((item) => item.id === sc.id ? { ...item, skills: e.target.value } : item))}
                            placeholder="Skill items separated by middle dots (·)"
                            className="h-8 text-xs bg-background flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => setSkillsCategories(skillsCategories.filter((item) => item.id !== sc.id))}
                            className="text-muted-foreground hover:text-rose-500 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                    <p className="font-semibold text-foreground">Customizable Semantic Section Rules</p>
                    <p className="text-muted-foreground text-[11px]">Standard solid horizontal rules delineate each active section cleanly.</p>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Panel: Reactive Live ATS Document Preview (6 Cols) */}
        <div
          id="ats-resume-print-container"
          className={cn(
            "lg:col-span-6 lg:sticky lg:top-20",
            activeTab === "preview" ? "block" : "hidden lg:block"
          )}
        >
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
            className="bg-white text-black border border-border shadow-2xl rounded-xl p-4 sm:p-8 md:p-10 font-sans select-text overflow-x-auto"
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
              
              {/* Dynamic Contact Row */}
              {contactItems.length > 0 && (
                <div className="header-contact flex flex-wrap items-center justify-center gap-x-2 text-xs text-black font-normal" style={{ fontSize: "8.5pt", display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: "8px", rowGap: "3px", color: "#000000" }}>
                  {contactItems.map((item, idx) => (
                    <span key={idx}>
                      {idx > 0 && <span className="text-black font-normal mr-1.5">•</span>}
                      {item}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* EDUCATION */}
            {sectionVisibility.education && educationList.length > 0 && (
              <div className="section-block" style={{ marginBottom: "12px", width: "100%" }}>
                <h2 className="section-headline" style={{ fontSize: "9.5pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #000000", paddingBottom: "2px", marginTop: "0px", marginBottom: "6px", color: "#000000", width: "100%", display: "block" }}>
                  {sectionTitles.education}
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
            {sectionVisibility.experience && experienceList.length > 0 && (
              <div className="section-block" style={{ marginBottom: "12px", width: "100%" }}>
                <h2 className="section-headline" style={{ fontSize: "9.5pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #000000", paddingBottom: "2px", marginTop: "0px", marginBottom: "6px", color: "#000000", width: "100%", display: "block" }}>
                  {sectionTitles.experience}
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

            {/* PROJECTS / INITIATIVES */}
            {sectionVisibility.projects && projectsList.length > 0 && (
              <div className="section-block" style={{ marginBottom: "12px", width: "100%" }}>
                <h2 className="section-headline" style={{ fontSize: "9.5pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #000000", paddingBottom: "2px", marginTop: "0px", marginBottom: "6px", color: "#000000", width: "100%", display: "block" }}>
                  {sectionTitles.projects}
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
            {sectionVisibility.certifications && certificationsList.length > 0 && (
              <div className="section-block" style={{ marginBottom: "12px", width: "100%" }}>
                <h2 className="section-headline" style={{ fontSize: "9.5pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #000000", paddingBottom: "2px", marginTop: "0px", marginBottom: "6px", color: "#000000", width: "100%", display: "block" }}>
                  {sectionTitles.certifications}
                </h2>
                {certificationsList.map((cert, cIdx) => (
                  <div key={cert.id} className="cert-item" style={{ marginBottom: cIdx === certificationsList.length - 1 ? "0px" : "4px", fontSize: "8.5pt", lineHeight: 1.3, color: "#000000" }}>
                    <strong style={{ fontWeight: 700, color: "#000000" }}>{cert.name}: </strong>
                    <span style={{ color: "#000000" }}>{cert.details}</span>
                  </div>
                ))}
              </div>
            )}

            {/* SKILLS / CORE COMPETENCIES */}
            {sectionVisibility.skills && skillsCategories.length > 0 && (
              <div className="section-block" style={{ marginBottom: "0px", width: "100%" }}>
                <h2 className="section-headline" style={{ fontSize: "9.5pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #000000", paddingBottom: "2px", marginTop: "0px", marginBottom: "6px", color: "#000000", width: "100%", display: "block" }}>
                  {sectionTitles.skills}
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

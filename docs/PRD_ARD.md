# Job Hunt Pipeline

## Product Requirements Document (PRD) & Architecture Requirements Document (ARD)

**Document Version:** 2.0  
**Status:** Implementation Ready  
**Product Type:** Personal Job Search & Career Intelligence Platform  
**Primary Users:** Fresh Graduates, Junior Developers, Career Switchers  
**Primary Backend:** Python + FastAPI  
**Primary Frontend:** Next.js + TypeScript  
**Database:** PostgreSQL  
**Architecture:** Modular Monolith with Asynchronous Processing Capability  

---

# Table of Contents

* [1. Executive Summary](#1-executive-summary)
* [2. Product Overview](#2-product-overview)
* [3. Problem Statement](#3-problem-statement)
* [4. Product Vision](#4-product-vision)
* [5. Product Goals](#5-product-goals)
* [6. Non-Goals](#6-non-goals)
* [7. Target Users](#7-target-users)
* [8. Core Product Concept](#8-core-product-concept)
* [9. End-to-End User Workflow](#9-end-to-end-user-workflow)
* [10. Product Requirements](#10-product-requirements)
* [11. Job Capture](#11-job-capture)
* [12. Job Parsing & Extraction](#12-job-parsing--extraction)
* [13. Candidate Profile](#13-candidate-profile)
* [14. Skill Taxonomy](#14-skill-taxonomy)
* [15. Job Match Engine](#15-job-match-engine)
* [16. Application Decision Engine](#16-application-decision-engine)
* [17. Application Pipeline](#17-application-pipeline)
* [18. Follow-Up Management](#18-follow-up-management)
* [19. Interview Management](#19-interview-management)
* [20. Resume Intelligence](#20-resume-intelligence)
* [21. Portfolio Intelligence](#21-portfolio-intelligence)
* [22. Interview Preparation](#22-interview-preparation)
* [23. Feedback Engine](#23-feedback-engine)
* [24. Dashboard](#24-dashboard)
* [25. Analytics](#25-analytics)
* [26. Notifications](#26-notifications)
* [27. AI Architecture](#27-ai-architecture)
* [28. Architecture Requirements](#28-architecture-requirements)
* [29. Recommended Technology Stack](#29-recommended-technology-stack)
* [30. High-Level Architecture](#30-high-level-architecture)
* [31. Application Architecture](#31-application-architecture)
* [32. Data Architecture](#32-data-architecture)
* [33. Database Model](#33-database-model)
* [34. API Architecture](#34-api-architecture)
* [35. Job Processing Pipeline](#35-job-processing-pipeline)
* [36. Background Processing](#36-background-processing)
* [37. Security Architecture](#37-security-architecture)
* [38. Privacy Requirements](#38-privacy-requirements)
* [39. Error Handling](#39-error-handling)
* [40. Observability](#40-observability)
* [41. UI/UX Requirements](#41-uiux-requirements)
* [42. MVP Scope](#42-mvp-scope)
* [43. V2 Scope](#43-v2-scope)
* [44. V3 Scope](#44-v3-scope)
* [45. Implementation Roadmap](#45-implementation-roadmap)
* [46. Testing Strategy](#46-testing-strategy)
* [47. Definition of Done](#47-definition-of-done)
* [48. Success Metrics](#48-success-metrics)
* [49. Product Principles](#49-product-principles)
* [50. Future Opportunities](#50-future-opportunities)
* [51. Final Architecture](#51-final-architecture)

---

# 1. Executive Summary

Job Hunt Pipeline is a personal job-search operating system designed primarily for fresh graduates, junior developers, and early-career professionals.

The platform transforms job searching from a fragmented activity into a structured, measurable, and feedback-driven process.

Instead of manually browsing job boards, saving links, maintaining spreadsheets, and forgetting application history, the candidate can submit a job URL to the platform and allow the Python processing pipeline to analyze it.

The core workflow is:

```text
Find Job
    ↓
Paste Job URL
    ↓
Validate URL
    ↓
Extract Job Information
    ↓
Parse Requirements
    ↓
Extract & Normalize Skills
    ↓
Compare With Candidate Profile
    ↓
Calculate Match Score
    ↓
Recommend APPLY / REVIEW / SKIP
    ↓
Candidate Decides
    ↓
Track Application
    ↓
Follow Up
    ↓
Interview
    ↓
Record Outcome
    ↓
Analyze Feedback
    ↓
Identify Skill Gaps
    ↓
Improve
    ↓
Apply Again
```

The system is not intended to become an uncontrolled autonomous job-application bot.

The candidate remains responsible for deciding whether to apply and for submitting applications unless explicit, compliant automation is later introduced.

---

# 2. Product Overview

## 2.1 Product Name

**Job Hunt Pipeline**

## 2.2 Product Type

Personal job-search management, analysis, and career intelligence platform.

## 2.3 Primary Users

* Fresh graduates
* Junior developers
* Entry-level software engineers
* Career switchers
* Freelancers transitioning into employment
* Early-career professionals

## 2.4 Core Value Proposition

> Turn every job application into structured data that helps you make better applications.

## 2.5 Product Philosophy

The platform should optimize for:

```text
Better Applications
        >
More Applications
```

The goal is not to maximize application count.

The goal is to maximize the probability that each application is relevant, well-prepared, and strategically useful.

---

# 3. Problem Statement

Job searching is fragmented across multiple platforms and tools.

Candidates may use:

* LinkedIn
* JobStreet
* Indeed
* Glassdoor
* Company career pages
* Email
* Google Sheets
* Notion
* Calendar
* Personal notes

This creates several problems:

### Discovery Problems

* Job opportunities are scattered across multiple sources.
* Candidates repeatedly encounter the same jobs.
* Job postings can expire without notice.
* Candidates have difficulty comparing opportunities.

### Qualification Problems

Candidates often manually inspect:

* Skills
* Experience
* Education
* Location
* Employment type
* Responsibilities
* Preferred qualifications

This is repetitive and time-consuming.

### Application Problems

Candidates frequently lose track of:

* When they applied
* Which resume they used
* Who contacted them
* When to follow up
* Which stage they reached

### Learning Problems

After rejection, candidates often do not know:

* Why they were rejected
* Which skills are repeatedly missing
* Whether their resume is effective
* Which job sources produce interviews
* Which interview stages are problematic

The Job Hunt Pipeline solves these problems by converting job-search activity into structured data.

---

# 4. Product Vision

Build a career intelligence system that learns from every application and helps candidates continuously improve their job-search strategy.

The long-term system should be able to answer:

```text
Which jobs should I prioritize?

Which skills are employers requesting most?

Which skills am I missing?

Which resume performs best?

Which job sources produce the most interviews?

Which roles produce the best outcomes?

At which interview stage am I losing opportunities?

What should I improve this week?

What should I focus on before applying again?
```

---

# 5. Product Goals

## 5.1 Primary Goals

* Centralize job opportunities.
* Automate job-posting analysis.
* Extract job requirements.
* Normalize technical skills.
* Match jobs against candidate capabilities.
* Provide transparent recommendations.
* Track applications.
* Manage follow-ups.
* Track interviews.
* Record outcomes.
* Analyze rejection and interview feedback.
* Identify recurring skill gaps.
* Improve future applications.

## 5.2 Secondary Goals

* Resume analysis
* Portfolio analysis
* Interview preparation
* Skill-gap analysis
* Application analytics
* Job-source analytics
* Resume version comparison

---

# 6. Non-Goals

The system must not:

* Mass-apply automatically.
* Fabricate candidate experience.
* Invent skills.
* Generate fake credentials.
* Misrepresent employment history.
* Bypass CAPTCHA.
* Circumvent anti-bot protections.
* Abuse job-board APIs.
* Spam recruiters.
* Impersonate candidates without explicit authorization.
* Guarantee interviews or employment.

AI is an assistant, not the candidate.

---

# 7. Target Users

## 7.1 Primary Persona

### Fresh Graduate

Needs:

* Entry-level opportunities
* Help understanding requirements
* Skill-gap identification
* Application organization
* Interview preparation
* Feedback tracking

## 7.2 Secondary Persona

### Junior Developer

Needs:

* Better job matching
* Resume optimization
* Application analytics
* Interview tracking
* Career progression insights

## 7.3 Career Switcher

Needs:

* Transferable-skill analysis
* Role compatibility
* Skill gap detection
* Portfolio positioning

---

# 8. Core Product Concept

The Job Hunt Pipeline is built around a continuous feedback loop.

```text
DISCOVER
    ↓
CAPTURE
    ↓
QUALIFY
    ↓
APPLY
    ↓
TRACK
    ↓
FOLLOW UP
    ↓
INTERVIEW
    ↓
OUTCOME
    ↓
FEEDBACK
    ↓
ANALYZE
    ↓
IDENTIFY GAPS
    ↓
IMPROVE
    ↓
APPLY AGAIN
```

The system becomes more valuable as historical application data increases.

---

# 9. End-to-End User Workflow

```text
External Job Source
        ↓
Candidate copies URL
        ↓
Paste URL
        ↓
Python FastAPI
        ↓
URL Validation
        ↓
Source Detection
        ↓
Content Extraction
        ↓
Job Parsing
        ↓
Skill Extraction
        ↓
Skill Normalization
        ↓
Candidate Matching
        ↓
Recommendation
    ┌───┼────┐
    ↓   ↓    ↓
 APPLY REVIEW SKIP
    ↓
Application Created
    ↓
Application Tracking
    ↓
Follow-up
    ↓
Interview
    ↓
Outcome
    ↓
Feedback
    ↓
Analytics
    ↓
Career Improvement
```

---

# 10. Product Requirements

The system consists of the following major modules:

```text
Candidate
Jobs
Matching
Applications
Follow-ups
Interviews
Resumes
Portfolio
Feedback
Analytics
Notifications
AI
```

The MVP should focus on:

```text
Candidate
    ↓
Jobs
    ↓
Matching
    ↓
Applications
    ↓
Analytics
```

---

# 11. Job Capture

The platform shall allow candidates to:

* Paste a job URL.
* Enter job information manually.
* Save jobs.
* Favorite jobs.
* Add notes.
* Add tags.
* Record source.
* Record discovery date.
* Detect duplicate jobs.

## Supported Sources

Initial support:

* LinkedIn
* JobStreet
* Indeed
* Public company career pages
* Generic public job pages

The extraction architecture must remain source-agnostic.

Each source should have its own extractor when necessary.

---

# 12. Job Parsing & Extraction

The Python pipeline owns job extraction.

## Processing Flow

```text
Job URL
    ↓
URL Validation
    ↓
Canonicalization
    ↓
Duplicate Detection
    ↓
Source Identification
    ↓
HTTP Fetch
    ↓
Readable Content Extraction
    ↓
HTML Cleaning
    ↓
Job Parser
    ↓
Schema Validation
    ↓
Skill Extraction
    ↓
Skill Normalization
    ↓
Database
```

## Extracted Fields

```text
Job
├── title
├── company
├── location
├── workplace_type
├── employment_type
├── salary
├── description
├── responsibilities
├── required_skills
├── preferred_skills
├── experience_requirement
├── education_requirement
├── certifications
├── source
├── source_url
├── canonical_url
├── posted_at
├── expiration_date
└── discovered_at
```

## Example Structured Output

```json
{
  "title": "Junior Software Developer",
  "company": "Example Company",
  "location": "Makati",
  "workplace_type": "Hybrid",
  "employment_type": "Full-time",
  "experience": {
    "minimum_years": 0,
    "maximum_years": 2
  },
  "education": [
    "Information Technology",
    "Computer Science"
  ],
  "required_skills": [
    "JavaScript",
    "React",
    "Git",
    "REST API"
  ],
  "preferred_skills": [
    "Next.js",
    "TypeScript",
    "Docker"
  ]
}
```

---

# 13. Candidate Profile

The candidate profile represents the candidate's actual capabilities.

```text
Candidate
├── Basic Information
├── Education
├── Experience
├── Skills
├── Certifications
├── Preferred Roles
├── Preferred Locations
├── Work Preferences
├── Salary Expectations
├── Resume Versions
├── Portfolio Projects
└── Career Goals
```

The profile should be editable at any time.

---

# 14. Skill Taxonomy

Skills should be normalized into categories.

```text
Frontend
├── HTML
├── CSS
├── JavaScript
├── TypeScript
├── React
├── Next.js
└── Vue

Backend
├── Node.js
├── Python
├── FastAPI
├── Express
├── PHP
└── REST API

Database
├── PostgreSQL
├── MySQL
├── MariaDB
├── MongoDB
└── Redis

DevOps
├── Docker
├── CI/CD
├── GitHub Actions
├── Cloud
└── Linux

Security
├── Authentication
├── Authorization
├── OWASP
├── API Security
└── Secure Development

AI
├── LLM APIs
├── RAG
├── Prompt Engineering
├── Agents
└── AI Integration
```

The taxonomy must be extensible.

---

# 15. Job Match Engine

The matching engine compares a job with the candidate profile.

## Initial Weighting

```text
Technical Skills       35%
Role Compatibility     25%
Experience             15%
Education              10%
Location               10%
Other                   5%
```

Weights must be configurable.

## Score

```text
90–100   Excellent
75–89    Strong
60–74    Possible
40–59    Weak
0–39     Poor
```

These categories are guidance rather than objective employability measurements.

---

# 16. Application Decision Engine

The decision engine returns:

```text
APPLY
REVIEW
SKIP
```

## APPLY

Conditions may include:

* Strong technical match
* Suitable role
* Reasonable experience requirement
* No significant mandatory gaps

## REVIEW

Conditions may include:

* Strong overall match
* Some important gaps
* Potentially flexible requirements
* Strategic value to candidate

## SKIP

Conditions may include:

* Major mandatory skill gaps
* Unacceptable location
* Unacceptable work arrangement
* Role outside target career path
* Significant experience mismatch

The candidate can always override the recommendation.

---

# 17. Application Pipeline

Application states:

```text
SAVED
    ↓
QUALIFIED
    ↓
APPLIED
    ↓
APPLICATION_VIEWED
    ↓
RECRUITER_CONTACTED
    ↓
HR_SCREENING
    ↓
TECHNICAL_INTERVIEW
    ↓
FINAL_INTERVIEW
    ↓
OFFER
```

Alternative states:

```text
REJECTED
WITHDRAWN
NO_RESPONSE
POSITION_CLOSED
```

Every transition must be recorded.

---

# 18. Follow-Up Management

The system should support:

* Follow-up date
* Follow-up type
* Contact person
* Contact channel
* Notes
* Completion state
* Reminder

Example:

```text
Applied
   ↓
Wait
   ↓
Follow-up Due
   ↓
Contact Recruiter
   ↓
Response?
 ┌───────┴───────┐
 ↓               ↓
YES              NO
 ↓               ↓
Continue       Schedule
Pipeline       Another Follow-up
```

---

# 19. Interview Management

Each interview should include:

```text
Interview
├── application_id
├── stage
├── scheduled_at
├── interviewer
├── meeting_url
├── notes
├── questions
├── confidence_score
├── outcome
└── feedback
```

Possible stages:

* Recruiter screening
* HR interview
* Technical interview
* Coding assessment
* System design
* Behavioral interview
* Final interview

---

# 20. Resume Intelligence

The platform should support multiple resume versions.

```text
Resume
├── id
├── name
├── version
├── file
├── extracted_text
├── skills
├── experience
├── projects
└── created_at
```

The system should compare resume content against a specific job.

Example:

```text
React              ✓ Strong
TypeScript         ✓ Strong
REST API           ✓ Strong
Docker             △ Weak Evidence
AWS                ✗ Missing
```

The system should recommend truthful improvements only.

---

# 21. Portfolio Intelligence

Portfolio projects should be represented as structured records.

```text
PortfolioProject
├── title
├── description
├── technologies
├── role
├── responsibilities
├── outcomes
├── repository_url
├── live_url
└── evidence
```

The system should identify which projects best demonstrate requirements from a specific job.

---

# 22. Interview Preparation

Interview preparation should be job-specific.

```text
Job
 ↓
Requirements
 ↓
Candidate Gaps
 ↓
Interview Topics
 ↓
Technical Questions
 ↓
Behavioral Questions
 ↓
Project Questions
 ↓
Mock Interview
```

AI should generate preparation based on the actual job rather than generic templates.

---

# 23. Feedback Engine

The system should capture:

* Rejection reason
* Interview feedback
* Technical weaknesses
* Communication feedback
* Resume feedback
* Salary mismatch
* Experience mismatch
* Skill gaps
* Candidate observations

Feedback should be normalized.

Example:

```text
Raw Feedback
    ↓
"Need more experience with Docker"
    ↓
Category:
Technical Skill
    ↓
Skill:
Docker
    ↓
Gap:
Intermediate
```

---

# 24. Dashboard

The dashboard should provide a high-level view of the job search.

## Primary Metrics

```text
Applications
Interviews
Responses
Offers
Follow-ups Due
```

## Additional Sections

```text
Application Funnel
Upcoming Interviews
Recent Applications
Skill Gaps
Recommended Actions
Job Sources
```

---

# 25. Analytics

Analytics should focus on outcomes rather than activity.

## Core Metrics

```text
Applications / Week
Response Rate
Interview Rate
Offer Rate
Rejection Rate
Average Response Time
Average Time to Interview
```

## Funnel

```text
Saved
 ↓
Applied
 ↓
Viewed
 ↓
Contacted
 ↓
Interview
 ↓
Final
 ↓
Offer
```

## Skill Analytics

Track:

* Most requested skills
* Missing skills
* Frequently matched skills
* Skills associated with interviews
* Skills associated with rejection

## Source Analytics

Compare:

* LinkedIn
* JobStreet
* Indeed
* Company websites
* Referrals
* Other sources

---

# 26. Notifications

Notifications may include:

* Follow-up due
* Interview upcoming
* Application becoming stale
* Recruiter response
* Job closing soon
* Weekly performance report

Notifications must be configurable.

---

# 27. AI Architecture

AI must be isolated behind an internal provider abstraction layer.

```text
Application
      ↓
AI Service
      ↓
AI Provider Interface (BaseAIProvider)
      ↓
┌─────────────────┬─────────────────┬─────────────────┬───────────────────┬─────────────┐
│ Google Gemini   │ NVIDIA NIM      │ Zhipu GLM       │ OpenAI/Anthropic  │ Local/Mock  │
│ (2.5-flash)     │ (Llama/DeepSeek)│ (GLM-4-Flash)   │ (Custom/Groq)     │ (Zero Dep)  │
└─────────────────┴─────────────────┴─────────────────┴───────────────────┴─────────────┘
```

The rest of the application must not directly depend on a specific AI provider.

## Supported Model Providers

1. **Google Gemini**: High-speed, structured JSON generation with `gemini-2.5-flash`.
2. **NVIDIA NIM (Free Tier Available)**: Access to models like `meta/llama-3.3-70b-instruct`, `deepseek-ai/deepseek-r1`, and `mistralai/mistral-large-2-instruct` using NVIDIA API keys.
3. **Zhipu AI / GLM (Free/Low-Cost)**: High-speed bilingual reasoning with `glm-4-flash` / `glm-4-plus`.
4. **OpenAI-Compatible & Free Tier Aggregators**: Groq, OpenRouter, and Ollama/vLLM local endpoints.
5. **OpenAI & Anthropic**: Standard commercial foundation models (`gpt-4o-mini`, `claude-3-5-sonnet`).
6. **Local Heuristic / Regex Fallback**: Zero-cost, deterministic rule-based extractor requiring 0 API keys for offline testing.

## AI Responsibilities

AI can assist with:

* Job parsing
* Skill extraction
* Semantic normalization
* Job summarization
* Match explanations
* Resume analysis
* Portfolio analysis
* Interview questions
* Feedback categorization
* Career-gap analysis

## Deterministic Responsibilities

Regular Python code should handle:

* Validation
* Authentication
* Authorization
* Database operations
* Status transitions
* Scoring calculations
* Business rules
* Rate limits
* Security

---

# 28. Architecture Requirements

The system shall use a modular architecture.

## Required Layers

```text
API Layer
    ↓
Service Layer
    ↓
Domain Layer
    ↓
Repository Layer
    ↓
Database
```

Additional infrastructure:

```text
AI Layer
Processing Layer
Worker Layer
Security Layer
Observability Layer
```

The architecture must remain simple enough for a single developer to maintain.

---

# 29. Recommended Technology Stack

| Layer               | Technology                                |
| ------------------- | ----------------------------------------- |
| Frontend            | Next.js                                   |
| Frontend Language   | TypeScript                                |
| UI                  | React + Tailwind CSS                      |
| Backend             | Python                                    |
| API Framework       | FastAPI                                   |
| Validation          | Pydantic                                  |
| ORM                 | SQLAlchemy                                |
| Database            | PostgreSQL                                |
| Migrations          | Alembic                                   |
| HTTP Client         | httpx                                     |
| HTML Parsing        | BeautifulSoup / selectolax                |
| Browser Automation  | Playwright                                |
| AI                  | Provider Abstraction                      |
| Testing             | pytest                                    |
| Async Testing       | pytest-asyncio                            |
| Linting             | Ruff                                      |
| Type Checking       | mypy                                      |
| Package Management  | uv                                        |
| Containerization    | Docker                                    |
| Optional Queue      | Celery / RQ / Dramatiq                    |
| Optional Cache      | Redis                                     |
| Frontend Deployment | Vercel                                    |
| Backend Deployment  | Python-capable hosting/container platform |

---

# 30. High-Level Architecture

```text
                         USER
                           │
                           ▼
                ┌────────────────────┐
                │      Next.js       │
                │  React + TypeScript│
                └─────────┬──────────┘
                          │ HTTPS
                          ▼
                ┌────────────────────┐
                │      FastAPI       │
                │       Python       │
                └─────────┬──────────┘
                          │
        ┌─────────────────┼──────────────────┐
        │                 │                  │
        ▼                 ▼                  ▼
┌───────────────┐ ┌───────────────┐ ┌────────────────┐
│ Job Pipeline  │ │ AI Services   │ │ Career Modules │
│               │ │               │ │                │
│ Extract       │ │ Parse         │ │ Applications   │
│ Parse         │ │ Analyze       │ │ Interviews     │
│ Normalize     │ │ Match         │ │ Follow-ups     │
│ Validate      │ │ Recommend     │ │ Analytics      │
└───────┬───────┘ └───────┬───────┘ └───────┬────────┘
        │                 │                 │
        └─────────────────┼─────────────────┘
                          ▼
                ┌────────────────────┐
                │    PostgreSQL      │
                │   Source of Truth  │
                └────────────────────┘
```

---

# 31. Application Architecture

The backend should follow a modular-monolith architecture.

```text
FastAPI
│
├── API
│
├── Candidates
│
├── Jobs
│
├── Matching
│
├── Applications
│
├── Interviews
│
├── Resumes
│
├── Portfolio
│
├── Feedback
│
├── Analytics
│
├── Notifications
│
├── AI
│
└── Processing
```

Modules should communicate through service interfaces rather than tightly coupling internal implementation details.

---

# 32. Data Architecture

PostgreSQL is the primary source of truth.

Structured data should be stored relationally.

AI-generated results should be stored with enough metadata to understand how they were generated.

The database should support:

* Historical application tracking
* Skill analytics
* Match history
* Interview history
* Feedback analysis
* Resume versioning

---

# 33. Database Model

Core entities:

```text
User
CandidateProfile
Skill
CandidateSkill
Job
JobSkill
Application
ApplicationStatusHistory
Interview
FollowUp
Resume
PortfolioProject
Feedback
Notification
AIAnalysis
ProcessingJob
```

## Relationships

```text
User
 │
 └── CandidateProfile
       │
       ├── CandidateSkill ── Skill
       ├── Resume
       └── PortfolioProject

Job
 │
 ├── JobSkill ── Skill
 │
 └── Application
       │
       ├── ApplicationStatusHistory
       ├── Interview
       ├── FollowUp
       └── Feedback
```

---

# 34. API Architecture

## Jobs

```http
POST   /api/jobs
POST   /api/jobs/analyze
GET    /api/jobs
GET    /api/jobs/{id}
DELETE /api/jobs/{id}
```

## Matching

```http
POST /api/jobs/{id}/match
GET  /api/jobs/{id}/match
```

## Applications

```http
POST  /api/applications
GET   /api/applications
GET   /api/applications/{id}
PATCH /api/applications/{id}
POST  /api/applications/{id}/status
```

## Interviews

```http
POST  /api/interviews
GET   /api/interviews
PATCH /api/interviews/{id}
```

## Candidate

```http
GET   /api/candidate
PATCH /api/candidate
GET   /api/candidate/skills
POST  /api/candidate/skills
DELETE /api/candidate/skills/{id}
```

## Resumes

```http
POST /api/resumes
GET  /api/resumes
GET  /api/resumes/{id}
POST /api/resumes/{id}/analyze
```

## Analytics

```http
GET /api/analytics/overview
GET /api/analytics/funnel
GET /api/analytics/skills
GET /api/analytics/sources
```

---

# 35. Job Processing Pipeline

This is the core Python pipeline.

```text
                     JOB URL
                        │
                        ▼
               ┌─────────────────┐
               │ URL Validation   │
               └────────┬────────┘
                        ▼
               ┌─────────────────┐
               │ Canonicalize    │
               └────────┬────────┘
                        ▼
               ┌─────────────────┐
               │ Duplicate Check │
               └────────┬────────┘
                        ▼
               ┌─────────────────┐
               │ Source Detection│
               └────────┬────────┘
                        ▼
               ┌─────────────────┐
               │ Content Fetcher │
               └────────┬────────┘
                        ▼
               ┌─────────────────┐
               │ Content Extract │
               └────────┬────────┘
                        ▼
               ┌─────────────────┐
               │   Job Parser    │
               └────────┬────────┘
                        ▼
               ┌─────────────────┐
               │ Schema Validate │
               └────────┬────────┘
                        ▼
               ┌─────────────────┐
               │ Skill Extractor │
               └────────┬────────┘
                        ▼
               ┌─────────────────┐
               │ Skill Normalize │
               └────────┬────────┘
                        ▼
               ┌─────────────────┐
               │ Match Candidate │
               └────────┬────────┘
                        ▼
               ┌─────────────────┐
               │ Store Result    │
               └─────────────────┘
```

---

# 36. Background Processing

Simple operations may execute synchronously.

Expensive operations should eventually become asynchronous.

Examples:

* Browser extraction
* Large document processing
* AI analysis
* Resume analysis
* Portfolio analysis
* Batch analytics

## Async Architecture

```text
Frontend
   ↓
FastAPI
   ↓
Create ProcessingJob
   ↓
Queue
   ↓
Worker
   ↓
Python Processing Pipeline
   ↓
PostgreSQL
   ↓
Frontend retrieves result
```

## Initial MVP

Do not introduce Celery or Redis immediately.

Start with:

```text
FastAPI
+
PostgreSQL
```

Introduce workers when processing time or workload justifies them.

---

# 37. Security Architecture

Security must be built into every layer.

## Authentication

Use secure authentication.

## Authorization

Every resource must belong to the authenticated candidate.

Example:

```text
application.user_id == current_user.id
```

The backend must never rely solely on client-provided resource IDs.

## Required Controls

* HTTPS
* Secure cookies
* Authentication
* Authorization
* Input validation
* Rate limiting
* CORS controls
* Secure headers
* Secret management
* Audit logging

---

# 38. Privacy Requirements

Candidate information may include sensitive career information.

The system should:

* Minimize stored data.
* Protect data in transit.
* Restrict database access.
* Avoid unnecessary logging.
* Never log API keys.
* Support data deletion.
* Support data export.
* Clearly identify third-party AI processing.
* Avoid sending unnecessary candidate information to AI providers.

---

# 39. Error Handling

Errors should be categorized.

```text
VALIDATION_ERROR
AUTHENTICATION_ERROR
AUTHORIZATION_ERROR
NOT_FOUND
EXTERNAL_FETCH_ERROR
PARSER_ERROR
AI_ERROR
DATABASE_ERROR
RATE_LIMIT_ERROR
INTERNAL_ERROR
```

## User Experience

Instead of:

```text
500 Internal Server Error
```

show:

```text
We couldn't analyze this job posting.

The page could not be accessed. Try pasting the job
description manually instead.
```

Internal logs should retain technical details.

---

# 40. Observability

Every major operation should generate structured logs.

Example:

```json
{
  "level": "info",
  "event": "job_analysis_completed",
  "job_id": "123",
  "duration_ms": 6234,
  "match_score": 82
}
```

Important metrics:

```text
API latency
Job extraction latency
AI latency
Database latency
Error rate
Processing failures
Queue depth
Worker failures
```

Sensitive data must not be included unnecessarily.

---

# 41. UI/UX Requirements

The primary interaction should be extremely simple.

```text
┌─────────────────────────────────────────────┐
│ Paste Job Posting URL                       │
│                                             │
│ [ https://job-site.com/job/123        ]     │
│                                             │
│              [ Analyze Job ]                │
└─────────────────────────────────────────────┘
```

After processing:

```text
┌─────────────────────────────────────────────┐
│ Junior Software Developer                   │
│ Example Company                             │
│                                             │
│ Match Score                                 │
│ 82%                                         │
│                                             │
│ ✓ React                                     │
│ ✓ JavaScript                                │
│ ✓ REST API                                  │
│ △ Docker                                    │
│ ✗ AWS                                       │
│                                             │
│ Recommendation: APPLY                       │
│                                             │
│ [ Apply ] [ Save ] [ Skip ]                 │
└─────────────────────────────────────────────┘
```

The UI should emphasize:

* Clarity
* Speed
* Explainability
* Low cognitive load
* Useful actions

---

# 42. MVP Scope

## Candidate

* Candidate profile
* Education
* Skills
* Target roles
* Location preferences

## Jobs

* Paste URL
* Manual entry
* Job extraction
* Requirement extraction
* Skill extraction
* Duplicate detection

## Matching

* Match score
* Skill comparison
* Recommendation
* Explanation

## Applications

* Create application
* Track status
* Status history
* Notes

## Follow-up

* Follow-up date
* Reminder
* Notes

## Dashboard

* Application count
* Interview count
* Basic funnel
* Follow-ups due

---

# 43. V2 Scope

Add:

* Resume intelligence
* Portfolio intelligence
* Interview management
* Interview preparation
* Feedback engine
* Skill-gap analytics
* Source analytics
* Advanced notifications
* Background workers
* Calendar integration
* Email integration

---

# 44. V3 Scope

Potential capabilities:

* Personalized job recommendations
* Resume A/B testing
* Advanced career analytics
* Interview performance trends
* Salary intelligence
* Weekly career reports
* Local model support
* Semantic job retrieval
* Advanced recommendation models

Automation must remain human-approved for external application actions.

---

# 45. Implementation Roadmap

## Phase 1 — Backend Foundation

```text
Create repository
        ↓
Set up Python
        ↓
Set up FastAPI
        ↓
Configure PostgreSQL
        ↓
Configure SQLAlchemy
        ↓
Configure Alembic
        ↓
Create environment configuration
        ↓
Create authentication
```

---

## Phase 2 — Candidate System

```text
Candidate profile
        ↓
Education
        ↓
Skills
        ↓
Preferences
        ↓
Target roles
```

---

## Phase 3 — Job Pipeline

```text
URL validation
        ↓
Content fetching
        ↓
HTML extraction
        ↓
Job parsing
        ↓
Pydantic validation
        ↓
Skill extraction
        ↓
Skill normalization
        ↓
Persistence
```

---

## Phase 4 — Match Engine

```text
Candidate
    +
Job
    ↓
Match Engine
    ↓
Score
    ↓
Explanation
    ↓
Recommendation
```

---

## Phase 5 — Application Tracking

```text
Create Application
        ↓
Status Tracking
        ↓
Status History
        ↓
Notes
        ↓
Follow-up
```

---

## Phase 6 — Analytics

```text
Applications
        ↓
Aggregation
        ↓
Funnel Metrics
        ↓
Skill Trends
        ↓
Source Performance
```

---

## Phase 7 — Career Intelligence

```text
Resume
Portfolio
Interview
Feedback
        ↓
Career Intelligence
```

---

# 46. Testing Strategy

## Unit Testing

Test:

* URL validation
* Skill normalization
* Match scoring
* Recommendation rules
* Status transitions
* Pydantic schemas
* Business rules

## Integration Testing

Test:

```text
API
 ↓
Service
 ↓
Repository
 ↓
Database
```

## Pipeline Testing

Test:

```text
URL
 ↓
Fetch
 ↓
Extract
 ↓
Parse
 ↓
Normalize
 ↓
Match
```

## AI Testing

Test:

* Schema compliance
* Invalid output
* Missing fields
* Hallucinated skills
* Provider failures
* Prompt regression

## Security Testing

Test:

* Unauthorized access
* Cross-user data access
* SSRF
* Malformed URLs
* Rate limiting
* Authentication failures

---

# 47. Definition of Done

A feature is complete when:

* Requirements are implemented.
* API validation exists.
* Authentication is enforced.
* Authorization is enforced.
* Database migration exists.
* Tests pass.
* Errors are handled.
* Logging is appropriate.
* Documentation exists.
* No secrets are committed.
* Frontend integration works.
* Production behavior is observable.

---

# 48. Success Metrics

## Efficiency

```text
Average Job Analysis Time
Jobs Evaluated / Week
Time Saved Per Application
```

## Quality

```text
Application → Response Rate
Response → Interview Rate
Interview → Offer Rate
```

## Learning

```text
Most Common Skill Gaps
Most Common Rejection Reasons
Interview Weaknesses
Resume Improvement Trends
```

## Consistency

```text
Applications / Week
Follow-up Completion Rate
Interview Preparation Completion
```

The most important metric is:

> **Quality-adjusted application outcomes**

rather than total applications.

---

# 49. Product Principles

## Principle 1 — Human in the Loop

The candidate remains in control.

## Principle 2 — AI Assists, It Does Not Invent

The platform must never fabricate candidate information.

## Principle 3 — Explainability

Every major AI recommendation should have understandable reasoning.

## Principle 4 — Outcome Over Activity

The system should optimize for successful outcomes rather than application volume.

## Principle 5 — Simple Architecture First

Do not introduce infrastructure before it is needed.

## Principle 6 — Structured Data

Every application should create useful historical information.

## Principle 7 — Continuous Improvement

Every outcome should produce information that can improve future applications.

---

# 50. Future Opportunities

Potential future features:

## Career Recommendation Engine

```text
Candidate History
      ↓
Skills
      ↓
Applications
      ↓
Outcomes
      ↓
Career Pattern
      ↓
Recommended Roles
```

## Intelligent Weekly Planning

The system could generate:

```text
This Week

Priority Applications: 5
Follow-ups: 3
Interviews: 2

Top Skill to Improve:
Docker

Recommended Action:
Complete Docker networking practice.

Resume Action:
Add measurable project outcomes.
```

## Career Learning Loop

```text
Job Market
    ↓
Requirements
    ↓
Candidate Gaps
    ↓
Learning Plan
    ↓
Skill Improvement
    ↓
Better Resume
    ↓
Better Applications
    ↓
Better Outcomes
```

---

# 51. Final Architecture

The recommended production architecture is:

```text
                              USER
                               │
                               ▼
                    ┌────────────────────┐
                    │      Next.js       │
                    │ React + TypeScript │
                    │      Frontend      │
                    └─────────┬──────────┘
                              │
                              │ HTTPS / REST
                              ▼
                    ┌────────────────────┐
                    │      FastAPI       │
                    │       Python       │
                    │    API Backend     │
                    └─────────┬──────────┘
                              │
          ┌───────────────────┼────────────────────┐
          │                   │                    │
          ▼                   ▼                    ▼
 ┌────────────────┐  ┌─────────────────┐  ┌─────────────────┐
 │ Job Pipeline   │  │ AI Abstraction  │  │ Career Modules  │
 │                │  │                 │  │                 │
 │ URL Validation │  │ Job Analysis    │  │ Applications    │
 │ Fetching       │  │ Skill Analysis  │  │ Interviews      │
 │ Extraction     │  │ Resume Analysis │  │ Follow-ups      │
 │ Parsing        │  │ Matching        │  │ Feedback        │
 │ Normalization  │  │ Recommendations │  │ Analytics       │
 └───────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
                              ▼
                    ┌────────────────────┐
                    │    PostgreSQL      │
                    │   Source of Truth  │
                    └────────────────────┘
                              │
                              │
                    ┌─────────┴──────────┐
                    │                    │
                    ▼                    ▼
             Optional Queue       Optional Cache
                    │                    │
                    ▼                    ▼
              Python Workers           Redis
```

---

# Architecture Decision Summary

## Backend

**Python + FastAPI**

Python is responsible for:

```text
Job Processing
AI Integration
Text Processing
Matching
Analytics
Resume Processing
Background Tasks
Business Logic
```

## Frontend

**Next.js + TypeScript**

Next.js is responsible for:

```text
Dashboard
Forms
Job Views
Application UI
Analytics UI
Candidate Profile
Interview UI
```

## Database

**PostgreSQL**

PostgreSQL is responsible for:

```text
Candidate Data
Job Data
Application History
Interview History
Feedback
Analytics Data
AI Analysis Metadata
```

## Architecture

**Modular Monolith**

The first implementation should NOT use microservices.

Recommended:

```text
Next.js
   ↓
FastAPI
   ↓
PostgreSQL
```

Then add:

```text
Redis
   +
Workers
```

only when asynchronous workloads justify them.

---

# Recommended Python Project Structure

```text
job-hunt-pipeline/
│
├── backend/
│   │
│   ├── app/
│   │   ├── main.py
│   │   │
│   │   ├── api/
│   │   │   ├── dependencies.py
│   │   │   └── routes/
│   │   │       ├── jobs.py
│   │   │       ├── applications.py
│   │   │       ├── interviews.py
│   │   │       ├── candidates.py
│   │   │       ├── resumes.py
│   │   │       └── analytics.py
│   │   │
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── logging.py
│   │   │
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── candidate.py
│   │   │   ├── skill.py
│   │   │   ├── job.py
│   │   │   ├── application.py
│   │   │   ├── interview.py
│   │   │   ├── resume.py
│   │   │   └── feedback.py
│   │   │
│   │   ├── schemas/
│   │   │   ├── candidate.py
│   │   │   ├── job.py
│   │   │   ├── application.py
│   │   │   └── interview.py
│   │   │
│   │   ├── repositories/
│   │   │   ├── candidate_repository.py
│   │   │   ├── job_repository.py
│   │   │   └── application_repository.py
│   │   │
│   │   ├── services/
│   │   │   ├── candidate_service.py
│   │   │   ├── job_service.py
│   │   │   ├── matching_service.py
│   │   │   ├── application_service.py
│   │   │   ├── interview_service.py
│   │   │   └── analytics_service.py
│   │   │
│   │   ├── processing/
│   │   │   ├── url_validator.py
│   │   │   ├── source_detector.py
│   │   │   ├── content_fetcher.py
│   │   │   ├── content_extractor.py
│   │   │   ├── job_parser.py
│   │   │   ├── skill_extractor.py
│   │   │   └── normalizer.py
│   │   │
│   │   ├── matching/
│   │   │   ├── scorer.py
│   │   │   ├── rules.py
│   │   │   └── explainer.py
│   │   │
│   │   ├── ai/
│   │   │   ├── base.py
│   │   │   ├── factory.py
│   │   │   ├── prompts/
│   │   │   └── providers/
│   │   │       ├── openai.py
│   │   │       ├── anthropic.py
│   │   │       └── local.py
│   │   │
│   │   └── workers/
│   │       └── tasks.py
│   │
│   ├── migrations/
│   │
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── pipeline/
│   │
│   ├── pyproject.toml
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── dashboard/
│   │   │   ├── jobs/
│   │   │   ├── applications/
│   │   │   ├── interviews/
│   │   │   ├── analytics/
│   │   │   └── profile/
│   │   │
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── types/
│   │
│   └── package.json
│
├── docker-compose.yml
├── README.md
├── .gitignore
└── LICENSE
```

---

# Final Implementation Priority

The recommended build order is:

```text
1. Candidate Profile
        ↓
2. Paste Job URL
        ↓
3. Python Job Extraction
        ↓
4. Job Parsing
        ↓
5. Skill Extraction
        ↓
6. Skill Normalization
        ↓
7. Match Engine
        ↓
8. APPLY / REVIEW / SKIP
        ↓
9. Application Tracker
        ↓
10. Follow-up
        ↓
11. Dashboard
        ↓
12. Analytics
        ↓
13. Resume Intelligence
        ↓
14. Portfolio Intelligence
        ↓
15. Interview Intelligence
        ↓
16. Advanced Career Intelligence
```

# Final Product Loop

```text
                ┌───────────────┐
                │   DISCOVER    │
                └───────┬───────┘
                        ↓
                ┌───────────────┐
                │    CAPTURE    │
                └───────┬───────┘
                        ↓
                ┌───────────────┐
                │    QUALIFY    │
                └───────┬───────┘
                        ↓
                ┌───────────────┐
                │     APPLY     │
                └───────┬───────┘
                        ↓
                ┌───────────────┐
                │     TRACK     │
                └───────┬───────┘
                        ↓
                ┌───────────────┐
                │   FOLLOW UP   │
                └───────┬───────┘
                        ↓
                ┌───────────────┐
                │   INTERVIEW   │
                └───────┬───────┘
                        ↓
                ┌───────────────┐
                │    OUTCOME    │
                └───────┬───────┘
                        ↓
                ┌───────────────┐
                │   FEEDBACK    │
                └───────┬───────┘
                        ↓
                ┌───────────────┐
                │   ANALYTICS   │
                └───────┬───────┘
                        ↓
                ┌───────────────┐
                │    IMPROVE    │
                └───────┬───────┘
                        │
                        └──────────────→ APPLY AGAIN
```

---

# Final Recommendation

The recommended architecture is:

```text
┌─────────────────────────────────────┐
│             FRONTEND                │
│       Next.js + TypeScript          │
└──────────────────┬──────────────────┘
                   │
                   │ REST / HTTPS
                   ▼
┌─────────────────────────────────────┐
│              BACKEND                │
│          Python + FastAPI           │
│                                     │
│  Job Pipeline                       │
│  Matching Engine                    │
│  AI Integration                     │
│  Application Management             │
│  Analytics                          │
│  Resume / Portfolio Intelligence    │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│             DATABASE                │
│            PostgreSQL               │
└─────────────────────────────────────┘
```

Start with the simple architecture.

Do not begin with:

```text
Microservices
Kubernetes
Kafka
Complex Event Bus
Multiple Databases
Distributed AI Agents
```

Start with:

```text
Next.js
   +
FastAPI
   +
PostgreSQL
```

Then introduce background workers, Redis, advanced AI processing, and additional infrastructure only when the actual workload requires them.

The central engineering principle is:

> **Python owns the intelligence and processing pipeline. Next.js owns the user experience. PostgreSQL owns the persistent state. AI assists the pipeline but does not control the entire system.**

The ultimate objective is not to create a bot that applies to hundreds of jobs.

It is to create a system where:

```text
Every Job
    ↓
Produces Data
    ↓
Every Application
    ↓
Produces Feedback
    ↓
Every Outcome
    ↓
Produces Insight
    ↓
Every Insight
    ↓
Improves the Next Application
```

**That feedback loop is the actual product.**

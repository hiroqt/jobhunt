export interface CandidateSkill {
  id: string;
  candidate_id: string;
  skill_id: string;
  skill_name: string;
  skill_category: string;
  proficiency_level: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  years_experience: number;
  is_top_skill: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CandidateProfile {
  id: string;
  full_name: string;
  email?: string;
  headline?: string;
  summary?: string;
  target_roles: string[];
  preferred_locations: string[];
  workplace_types: string[];
  min_salary: number;
  target_salary: number;
  currency: string;
  years_of_experience: number;
  education_level?: string;
  portfolio_url?: string;
  github_url?: string;
  linkedin_url?: string;
  skills: CandidateSkill[];
  created_at: string;
  updated_at: string;
}

export interface SkillTaxonomyItem {
  id: string;
  name: string;
  category: string;
  description?: string;
  synonyms?: string;
}

export interface JobSkillInfo {
  name: string;
  category: string;
  is_required: boolean;
  years_required: number;
}

export interface Job {
  id: string;
  url?: string;
  canonical_url?: string;
  source: string;
  title: string;
  company: string;
  location?: string;
  workplace_type: string;
  employment_type: string;
  salary_min?: number;
  salary_max?: number;
  currency: string;
  experience_level?: string;
  min_years_experience: number;
  education_requirement?: string;
  raw_description?: string;
  summary?: string;
  responsibilities: string[];
  benefits: string[];
  match_score?: number;
  recommendation?: "APPLY" | "REVIEW" | "SKIP";
  match_summary?: string;
  matched_skills: string[];
  missing_critical_skills: string[];
  missing_preferred_skills: string[];
  created_at: string;
  updated_at: string;
}

export interface MatchBreakdown {
  technical_skills_score: number;
  role_compatibility_score: number;
  experience_score: number;
  education_score: number;
  location_score: number;
  other_score: number;
}

export interface SkillMatchDetail {
  skill_name: string;
  is_required: boolean;
  candidate_has: boolean;
  candidate_proficiency?: string;
  candidate_years: number;
  status: "MATCH" | "PARTIAL" | "MISSING";
}

export interface MatchResult {
  job_id: string;
  candidate_id: string;
  overall_score: number;
  recommendation: "APPLY" | "REVIEW" | "SKIP";
  summary: string;
  breakdown: MatchBreakdown;
  skills_detail: SkillMatchDetail[];
  matched_skills: string[];
  missing_critical_skills: string[];
  missing_preferred_skills: string[];
  strengths: string[];
  actionable_advice: string[];
}

export interface ApplicationTimelineEntry {
  id: string;
  application_id: string;
  previous_status?: string;
  new_status: string;
  notes?: string;
  created_at: string;
}

export type ApplicationStage =
  | "SAVED"
  | "QUALIFIED"
  | "APPLIED"
  | "APPLICATION_VIEWED"
  | "RECRUITER_CONTACTED"
  | "HR_SCREENING"
  | "TECHNICAL_INTERVIEW"
  | "FINAL_INTERVIEW"
  | "OFFER"
  | "REJECTED"
  | "WITHDRAWN"
  | "ARCHIVED";

export interface Application {
  id: string;
  candidate_id: string;
  job_id: string;
  resume_id?: string;
  status: ApplicationStage;
  applied_date?: string;
  salary_offered?: number;
  recruiter_name?: string;
  recruiter_email?: string;
  notes?: string;
  custom_cover_letter?: string;
  created_at: string;
  updated_at: string;
  job?: Job;
  timeline: ApplicationTimelineEntry[];
}

export interface Interview {
  id: string;
  application_id: string;
  round_name: string;
  scheduled_at?: string;
  interviewers?: string;
  meeting_link?: string;
  topics_covered: string[];
  prep_notes?: string;
  questions_asked: string[];
  debrief_notes?: string;
  confidence_rating?: number;
  outcome: "PENDING" | "PASSED" | "FAILED" | "RESCHEDULED" | "CANCELLED";
  job_title?: string;
  company_name?: string;
  created_at: string;
  updated_at: string;
}

export interface FollowUp {
  id: string;
  application_id: string;
  due_date: string;
  follow_up_type: string;
  recipient_name?: string;
  recipient_email?: string;
  email_subject?: string;
  email_body_template?: string;
  is_completed: boolean;
  completed_at?: string;
  notes?: string;
  job_title?: string;
  company_name?: string;
  created_at: string;
  updated_at: string;
}

export interface QuestionAndStarGuide {
  question: string;
  question_type: "TECHNICAL" | "BEHAVIORAL" | "SYSTEM_DESIGN" | "CULTURE";
  difficulty: string;
  concept_tested?: string;
  competency_tested?: string;
  star_guidance?: {
    Situation: string;
    Task: string;
    Action: string;
    Result: string;
  };
  suggested_answer_points: string[];
}

export interface InterviewPrepResponse {
  job_title: string;
  company: string;
  top_technical_questions: QuestionAndStarGuide[];
  top_behavioral_questions: QuestionAndStarGuide[];
  questions_to_ask_interviewer: string[];
  key_topics_to_review: string[];
  ai_provider_used: string;
}

export interface ResumeTailorResponse {
  job_title: string;
  company: string;
  suggested_summary: string;
  recommended_bullet_adjustments: Array<{
    original: string;
    improved: string;
    reason: string;
  }>;
  targeted_skills_to_highlight: string[];
  cover_letter_draft: string;
  ai_provider_used: string;
}

export interface FollowUpEmailGenResponse {
  subject: string;
  body: string;
  ai_provider_used: string;
}

export interface FunnelStageMetric {
  stage: string;
  count: number;
  conversion_rate_pct: number;
}

export interface SkillGapFrequency {
  skill_name: string;
  category: string;
  missing_count: number;
  percentage_of_rejections: number;
  learning_recommendation: string;
}

export interface SourceMetric {
  source: string;
  applications_count: number;
  interviews_count: number;
  offers_count: number;
  interview_rate_pct: number;
}

export interface DashboardOverview {
  total_applications: number;
  active_applications: number;
  interviews_scheduled: number;
  follow_ups_due: number;
  offers_received: number;
  response_rate_pct: number;
  interview_conversion_rate_pct: number;
  average_match_score: number;
  recent_activity_count: number;
  funnel: FunnelStageMetric[];
  top_skill_gaps: SkillGapFrequency[];
  source_breakdown: SourceMetric[];
}

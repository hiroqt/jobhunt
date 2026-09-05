import {
  CandidateProfile,
  SkillTaxonomyItem,
  Job,
  MatchResult,
  Application,
  ApplicationStage,
  Interview,
  FollowUp,
  InterviewPrepResponse,
  ResumeTailorResponse,
  FollowUpEmailGenResponse,
  DashboardOverview,
  JobSearch,
  SearchExecution,
  SearchRunResponse,
  SourceInfo,
  Notification,
  NotificationListResponse,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export function getGuestSessionId(): string {
  if (typeof window === "undefined") {
    return "guest_ssr";
  }
  let sid = window.sessionStorage.getItem("jobhunt_guest_session_id");
  if (!sid) {
    sid = "guest_" + (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15));
    window.sessionStorage.setItem("jobhunt_guest_session_id", sid);
  }
  return sid;
}

// Guest session persists for the duration of the browser tab via sessionStorage.
// Explicit resets can be triggered via the UI Reset Session button.


export async function resetGuestSession(): Promise<void> {
  const sid = getGuestSessionId();
  try {
    await fetch(`${API_BASE}/session/reset?session_id=${encodeURIComponent(sid)}`, {
      method: "POST",
      headers: {
        "X-Session-ID": sid,
      },
    });
  } catch (err) {
    console.warn("Could not notify server of session reset:", err);
  }
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem("jobhunt_guest_session_id");
    window.location.reload();
  }
}

async function fetchJSON<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const sessionId = getGuestSessionId();
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Session-ID": sessionId,
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    let errorDetail = `HTTP ${res.status}`;
    try {
      const errBody = await res.json();
      errorDetail = errBody.detail || JSON.stringify(errBody);
    } catch {
      errorDetail = await res.text();
    }
    throw new Error(errorDetail || `Request to ${endpoint} failed`);
  }

  if (res.status === 204) {
    return {} as T;
  }

  return res.json();
}

// Candidate APIs
export async function getCandidateProfile(): Promise<CandidateProfile> {
  return fetchJSON<CandidateProfile>("/candidate");
}

export async function updateCandidateProfile(data: Partial<CandidateProfile>): Promise<CandidateProfile> {
  return fetchJSON<CandidateProfile>("/candidate", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function uploadResume(
  file?: File | null,
  rawText?: string,
  provider: string = "fallback"
): Promise<CandidateProfile> {
  const formData = new FormData();
  if (file) {
    formData.append("file", file);
  }
  if (rawText) {
    formData.append("raw_text", rawText);
  }
  formData.append("provider", provider);

  const sessionId = getGuestSessionId();
  const res = await fetch(`${API_BASE}/candidate/resume/upload`, {
    method: "POST",
    headers: {
      "X-Session-ID": sessionId,
    },
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: "Failed to upload resume" }));
    throw new Error(errorData.detail || "Failed to upload resume");
  }
  return res.json();
}

export async function getSkillTaxonomy(): Promise<SkillTaxonomyItem[]> {
  return fetchJSON<SkillTaxonomyItem[]>("/candidate/skills/taxonomy");
}

export async function addCandidateSkill(
  params: {
    skill_id?: string;
    skill_name?: string;
    skill_category?: string;
    proficiency?: string;
    years?: number;
    is_top?: boolean;
  }
): Promise<any> {
  return fetchJSON("/candidate/skills", {
    method: "POST",
    body: JSON.stringify({
      skill_id: params.skill_id,
      skill_name: params.skill_name,
      skill_category: params.skill_category,
      proficiency_level: params.proficiency || "Intermediate",
      years_experience: params.years ?? 1,
      is_top_skill: params.is_top ?? false,
    }),
  });
}

export async function removeCandidateSkill(candidateSkillId: string): Promise<void> {
  return fetchJSON<void>(`/candidate/skills/${candidateSkillId}`, {
    method: "DELETE",
  });
}

// Job APIs
export async function extractAndAnalyzeJob(
  url?: string,
  raw_text?: string,
  provider?: string
): Promise<Job> {
  return fetchJSON<Job>("/jobs/extract", {
    method: "POST",
    body: JSON.stringify({ url, raw_text, provider }),
  });
}

export async function getJobs(options?: {
  search?: string;
  search_id?: string;
  location?: string;
  ph_only?: boolean;
  psoc_group?: number;
  recommendation?: string;
  workplace_type?: string;
  source?: string;
  min_score?: number;
  saved_only?: boolean;
  experience_level?: string;
  employment_type?: string;
}): Promise<Job[]> {
  const params = new URLSearchParams();
  if (options?.search) params.set("search", options.search);
  if (options?.search_id) params.set("search_id", options.search_id);
  if (options?.location) params.set("location", options.location);
  if (options?.ph_only) params.set("ph_only", "true");
  if (options?.psoc_group !== undefined) params.set("psoc_group", options.psoc_group.toString());
  if (options?.recommendation) params.set("recommendation", options.recommendation);
  if (options?.workplace_type) params.set("workplace_type", options.workplace_type);
  if (options?.source) params.set("source", options.source);
  if (options?.min_score !== undefined) params.set("min_score", options.min_score.toString());
  if (options?.saved_only) params.set("saved_only", "true");
  if (options?.experience_level) params.set("experience_level", options.experience_level);
  if (options?.employment_type) params.set("employment_type", options.employment_type);
  
  const query = params.toString() ? `?${params.toString()}` : "";
  return fetchJSON<Job[]>(`/jobs${query}`);
}

export async function getJob(jobId: string): Promise<Job> {
  return fetchJSON<Job>(`/jobs/${jobId}`);
}

export async function getJobMatchAnalysis(jobId: string): Promise<MatchResult> {
  return fetchJSON<MatchResult>(`/jobs/${jobId}/match`);
}

export async function saveJob(jobId: string): Promise<Job> {
  return fetchJSON<Job>(`/jobs/${jobId}/save`, {
    method: "POST",
  });
}

export async function unsaveJob(jobId: string): Promise<Job> {
  return fetchJSON<Job>(`/jobs/${jobId}/save`, {
    method: "DELETE",
  });
}

export async function getSavedJobs(): Promise<Job[]> {
  return fetchJSON<Job[]>("/jobs/saved");
}

export async function deleteJob(jobId: string): Promise<void> {
  return fetchJSON<void>(`/jobs/${jobId}`, {
    method: "DELETE",
  });
}

export async function verifyJobLink(jobId: string): Promise<any> {
  return fetchJSON(`/jobs/${jobId}/verify-link`, {
    method: "POST",
  });
}

// Automated Searches & Discovery APIs
export async function getSearches(): Promise<JobSearch[]> {
  return fetchJSON<JobSearch[]>("/searches");
}

export async function createSearch(data: Partial<JobSearch>): Promise<JobSearch> {
  return fetchJSON<JobSearch>("/searches", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getSearch(searchId: string): Promise<JobSearch> {
  return fetchJSON<JobSearch>(`/searches/${searchId}`);
}

export async function updateSearch(searchId: string, data: Partial<JobSearch>): Promise<JobSearch> {
  return fetchJSON<JobSearch>(`/searches/${searchId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteSearch(searchId: string): Promise<void> {
  return fetchJSON<void>(`/searches/${searchId}`, {
    method: "DELETE",
  });
}

export async function runSearch(searchId: string): Promise<SearchRunResponse> {
  return fetchJSON<SearchRunResponse>(`/searches/${searchId}/run`, {
    method: "POST",
  });
}

export async function getSearchExecutions(searchId: string): Promise<SearchExecution[]> {
  return fetchJSON<SearchExecution[]>(`/searches/${searchId}/executions`);
}

export async function getExecutionDetail(executionId: string): Promise<SearchExecution> {
  return fetchJSON<SearchExecution>(`/searches/executions/${executionId}`);
}

// Sources APIs
export async function getSources(): Promise<SourceInfo[]> {
  return fetchJSON<SourceInfo[]>("/sources");
}

// Notifications APIs
export async function getNotifications(limit: number = 50): Promise<NotificationListResponse> {
  return fetchJSON<NotificationListResponse>(`/notifications?limit=${limit}`);
}

export async function markNotificationRead(notificationId: string): Promise<Notification> {
  return fetchJSON<Notification>(`/notifications/${notificationId}/read`, {
    method: "PATCH",
    body: JSON.stringify({ read: true }),
  });
}

export async function markAllNotificationsRead(): Promise<{ message: string }> {
  return fetchJSON<{ message: string }>("/notifications/read-all", {
    method: "POST",
  });
}

export async function deleteNotification(notificationId: string): Promise<void> {
  return fetchJSON<void>(`/notifications/${notificationId}`, {
    method: "DELETE",
  });
}

// Application APIs
export async function getApplications(statusFilter?: string): Promise<Application[]> {
  const query = statusFilter ? `?status_filter=${encodeURIComponent(statusFilter)}` : "";
  return fetchJSON<Application[]>(`/applications${query}`);
}

export async function getApplication(id: string): Promise<Application> {
  return fetchJSON<Application>(`/applications/${id}`);
}

export async function createApplication(data: {
  job_id: string;
  status?: string;
  notes?: string;
  custom_cover_letter?: string;
  applied_date?: string;
  recruiter_name?: string;
  recruiter_email?: string;
}): Promise<Application> {
  return fetchJSON<Application>("/applications", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStage,
  notes?: string
): Promise<Application> {
  return fetchJSON<Application>(`/applications/${applicationId}/status`, {
    method: "POST",
    body: JSON.stringify({ status, notes }),
  });
}

export async function updateApplication(
  applicationId: string,
  data: Partial<Application>
): Promise<Application> {
  return fetchJSON<Application>(`/applications/${applicationId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteApplication(applicationId: string): Promise<void> {
  return fetchJSON<void>(`/applications/${applicationId}`, {
    method: "DELETE",
  });
}

// Interview APIs
export async function getInterviews(applicationId?: string): Promise<Interview[]> {
  const query = applicationId ? `?application_id=${encodeURIComponent(applicationId)}` : "";
  return fetchJSON<Interview[]>(`/interviews${query}`);
}

export async function createInterview(data: Partial<Interview>): Promise<Interview> {
  return fetchJSON<Interview>("/interviews", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateInterview(interviewId: string, data: Partial<Interview>): Promise<Interview> {
  return fetchJSON<Interview>(`/interviews/${interviewId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// Follow-Up APIs
export async function getFollowUps(completed?: boolean): Promise<FollowUp[]> {
  const query = completed !== undefined ? `?completed=${completed}` : "";
  return fetchJSON<FollowUp[]>(`/follow-ups${query}`);
}

export async function updateFollowUp(followUpId: string, data: Partial<FollowUp>): Promise<FollowUp> {
  return fetchJSON<FollowUp>(`/follow-ups/${followUpId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// AI APIs
export async function generateInterviewPrep(params: {
  job_id?: string;
  job_title?: string;
  company?: string;
  job_description?: string;
  provider?: string;
}): Promise<InterviewPrepResponse> {
  return fetchJSON<InterviewPrepResponse>("/ai/interview-prep", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function tailorResume(jobId: string, provider?: string): Promise<ResumeTailorResponse> {
  return fetchJSON<ResumeTailorResponse>("/ai/tailor-resume", {
    method: "POST",
    body: JSON.stringify({ job_id: jobId, provider }),
  });
}

export async function generateFollowUpEmail(params: {
  application_id: string;
  email_type?: string;
  interviewer_name?: string;
  topics_discussed?: string;
  provider?: string;
}): Promise<FollowUpEmailGenResponse> {
  return fetchJSON<FollowUpEmailGenResponse>("/ai/follow-up-email", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

// Analytics APIs
export async function getDashboardOverview(): Promise<DashboardOverview> {
  return fetchJSON<DashboardOverview>("/analytics/overview");
}

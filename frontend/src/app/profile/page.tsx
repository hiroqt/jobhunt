"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  UserCheck,
  Plus,
  Trash2,
  Save,
  Building,
  CheckCircle2,
  Layers,
  UploadCloud,
  FileText,
  Loader2,
  FileCheck,
} from "lucide-react";
import {
  getCandidateProfile,
  updateCandidateProfile,
  getSkillTaxonomy,
  addCandidateSkill,
  removeCandidateSkill,
  uploadResume,
} from "@/lib/api";
import { CandidateProfile, CandidateSkill, SkillTaxonomyItem } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

import { ResumeParsingLoader } from "@/components/profile/ResumeParsingLoader";

export default function ProfilePage() {
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [taxonomy, setTaxonomy] = useState<SkillTaxonomyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Resume Upload State
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [pastedResumeText, setPastedResumeText] = useState("");
  const [uploadMode, setUploadMode] = useState<"file" | "paste">("file");
  const [resumeProvider, setResumeProvider] = useState("openrouter");
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [resumeParseSuccess, setResumeParseSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [summary, setSummary] = useState("");
  const [targetRoles, setTargetRoles] = useState("");
  const [minSalary, setMinSalary] = useState(0);
  const [targetSalary, setTargetSalary] = useState(0);
  const [yearsExp, setYearsExp] = useState(0);
  const [education, setEducation] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  // Add Skill state
  const [skillInputName, setSkillInputName] = useState("");
  const [skillCategory, setSkillCategory] = useState("Frontend");
  const [proficiency, setProficiency] = useState("Intermediate");
  const [skillYears, setSkillYears] = useState(1);

  const populateFormFields = (profData: CandidateProfile) => {
    setProfile(profData);
    setFullName(profData.full_name || "");
    setHeadline(profData.headline || "");
    setSummary(profData.summary || "");
    setTargetRoles((profData.target_roles || []).join(", "));
    setMinSalary(profData.min_salary || 0);
    setTargetSalary(profData.target_salary || 0);
    setYearsExp(profData.years_of_experience || 0);
    setEducation(profData.education_level || "");
    setGithubUrl(profData.github_url || "");
    setLinkedinUrl(profData.linkedin_url || "");
  };

  const loadProfile = async () => {
    try {
      const [profData, taxData] = await Promise.all([
        getCandidateProfile(),
        getSkillTaxonomy(),
      ]);
      populateFormFields(profData);
      setTaxonomy(taxData);
    } catch (err) {
      console.error("Error loading candidate profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleResumeUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadMode === "file" && !resumeFile) {
      alert("Please choose a PDF or TXT resume file.");
      return;
    }
    if (uploadMode === "paste" && !pastedResumeText.trim()) {
      alert("Please paste your resume content.");
      return;
    }

    setIsParsingResume(true);
    setResumeParseSuccess(null);

    try {
      const updatedProfile = await uploadResume(
        uploadMode === "file" ? resumeFile : null,
        uploadMode === "paste" ? pastedResumeText : undefined,
        resumeProvider
      );
      populateFormFields(updatedProfile);
      setResumeParseSuccess(
        `Resume parsed successfully. Profile and ${updatedProfile.skills.length} skills auto-populated.`
      );
      setResumeFile(null);
      setPastedResumeText("");
      setTimeout(() => setResumeParseSuccess(null), 6000);
    } catch (err: any) {
      alert(err.message || "Failed to parse resume");
    } finally {
      setIsParsingResume(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const updated = await updateCandidateProfile({
        full_name: fullName,
        headline: headline,
        summary: summary,
        target_roles: targetRoles.split(",").map((r) => r.trim()).filter(Boolean),
        min_salary: Number(minSalary),
        target_salary: Number(targetSalary),
        years_of_experience: Number(yearsExp),
        education_level: education,
        github_url: githubUrl,
        linkedin_url: linkedinUrl,
      });
      populateFormFields(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillInputName.trim()) return;

    try {
      await addCandidateSkill({
        skill_name: skillInputName.trim(),
        skill_category: skillCategory,
        proficiency,
        years: Number(skillYears),
        is_top: false,
      });
      setSkillInputName("");
      loadProfile();
    } catch (err: any) {
      alert(err.message || "Skill already exists or could not be added");
    }
  };

  const handleRemoveSkill = async (candSkillId: string) => {
    try {
      await removeCandidateSkill(candSkillId);
      setProfile((prev) =>
        prev ? { ...prev, skills: prev.skills.filter((s) => s.id !== candSkillId) } : null
      );
    } catch (err: any) {
      alert(err.message || "Failed to remove skill");
    }
  };

  // If currently parsing resume, blank the whole page content and display the custom parsing loader animation
  if (isParsingResume) {
    return (
      <ResumeParsingLoader
        fileName={uploadMode === "file" ? resumeFile?.name : "Pasted Resume Document"}
        fileSize={uploadMode === "file" && resumeFile ? resumeFile.size : undefined}
        uploadMode={uploadMode}
        rawText={uploadMode === "paste" ? pastedResumeText : undefined}
        provider={resumeProvider}
      />
    );
  }

  // Group candidate skills by category
  const skillsByCategory: Record<string, CandidateSkill[]> = {};
  if (profile?.skills) {
    profile.skills.forEach((cs) => {
      const cat = cs.skill_category || "General";
      if (!skillsByCategory[cat]) skillsByCategory[cat] = [];
      skillsByCategory[cat].push(cs);
    });
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header: Clean typography, no gradient, no eyebrow */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight flex items-center gap-3">
            <UserCheck className="w-7 h-7 text-zinc-100" />
            Candidate Profile & Skill Matrix
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Upload your resume to automatically extract verified skills, target roles, and career details.
          </p>
        </div>
        {savedSuccess && (
          <Badge variant="success" className="text-xs font-semibold px-3 py-1.5 gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" /> Profile saved successfully
          </Badge>
        )}
      </div>

      {/* Resume Parser Card: Solid dark styling */}
      <Card className="border-border bg-card shadow-lg">
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-zinc-100">
                Resume Auto-Complete
              </h2>
              <p className="text-sm text-muted-foreground max-w-xl">
                Upload a PDF/TXT resume or paste plain text to automatically detect your experience and verified skill taxonomy.
              </p>
            </div>

            <div className="flex bg-muted p-1 rounded-lg border border-border shrink-0">
              <Button
                type="button"
                variant={uploadMode === "file" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setUploadMode("file")}
                className="h-8 text-xs font-semibold"
              >
                Upload PDF
              </Button>
              <Button
                type="button"
                variant={uploadMode === "paste" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setUploadMode("paste")}
                className="h-8 text-xs font-semibold"
              >
                Paste Text
              </Button>
            </div>
          </div>

          {resumeParseSuccess && (
            <Alert variant="success">
              <CheckCircle2 className="w-4 h-4" />
              <AlertTitle>Resume Parsed</AlertTitle>
              <AlertDescription>{resumeParseSuccess}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleResumeUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-8">
                {uploadMode === "file" ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    tabIndex={0}
                    role="button"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
                    }}
                    className="border border-dashed border-border hover:border-zinc-500 bg-background/50 rounded-xl p-6 text-center cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.txt"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setResumeFile(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                      aria-label="Upload PDF or TXT Resume"
                    />
                    {resumeFile ? (
                      <div className="flex items-center justify-center gap-2 text-foreground font-semibold text-sm">
                        <FileCheck className="w-5 h-5 text-emerald-400" />
                        <span>{resumeFile.name}</span>
                        <span className="text-muted-foreground font-mono text-xs">
                          ({(resumeFile.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <UploadCloud className="w-7 h-7 text-muted-foreground mx-auto" />
                        <p className="text-sm font-semibold text-zinc-100">
                          Click to select PDF or TXT Resume
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Supports standard PDF resume exports and plain text documents
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <Textarea
                    rows={4}
                    value={pastedResumeText}
                    onChange={(e) => setPastedResumeText(e.target.value)}
                    placeholder="Paste your full resume text here (Experience, Education, Skills, Links)..."
                    className="text-sm font-mono"
                  />
                )}
              </div>

              <div className="md:col-span-4 space-y-3">
                <div className="space-y-1.5">
                  <label htmlFor="resume-ai-provider" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Extraction Model
                  </label>
                  <select
                    id="resume-ai-provider"
                    value={resumeProvider}
                    onChange={(e) => setResumeProvider(e.target.value)}
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring font-medium h-10"
                  >
                    <option value="openrouter">OpenRouter Free (Nemotron 3 Ultra)</option>
                    <option value="fallback">Local Heuristic (Offline)</option>
                    <option value="nvidia">NVIDIA NIM (Llama 3.3)</option>
                    <option value="glm">Zhipu GLM (GLM-4-Flash)</option>
                    <option value="groq">Groq (Llama 3.3)</option>
                    <option value="gemini">Google Gemini (Gemini 2.5 Flash)</option>
                    <option value="openai">OpenAI (GPT-4o-mini)</option>
                  </select>
                </div>

                <Button
                  type="submit"
                  disabled={isParsingResume}
                  variant="default"
                  className="w-full h-10 text-sm font-semibold gap-2"
                >
                  {isParsingResume ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Parsing Resume...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      Auto-Populate Profile
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Master Details Form */}
        <Card className="lg:col-span-7 border-border bg-card shadow">
          <CardHeader className="p-6 pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Building className="w-4 h-4 text-zinc-100" />
              Master Career Information
            </CardTitle>
            <span className="text-xs text-muted-foreground font-mono">
              Master Profile
            </span>
          </CardHeader>

          <CardContent className="p-6 pt-2">
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="profile-fullname" className="block text-sm font-medium text-foreground">
                    Full Name
                  </label>
                  <Input
                    id="profile-fullname"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your Full Name"
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="profile-experience" className="block text-sm font-medium text-foreground">
                    Years of Experience
                  </label>
                  <Input
                    id="profile-experience"
                    type="number"
                    min="0"
                    value={yearsExp}
                    onChange={(e) => setYearsExp(Number(e.target.value))}
                    className="h-10 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="profile-headline" className="block text-sm font-medium text-foreground">
                  Professional Headline
                </label>
                <Input
                  id="profile-headline"
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Junior Full-Stack Developer | React & Python"
                  className="h-10 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="profile-target-roles" className="block text-sm font-medium text-foreground">
                  Target Roles (Comma-separated)
                </label>
                <Input
                  id="profile-target-roles"
                  type="text"
                  value={targetRoles}
                  onChange={(e) => setTargetRoles(e.target.value)}
                  placeholder="Junior Software Engineer, Full Stack Developer, Frontend Developer"
                  className="h-10 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="profile-min-salary" className="block text-sm font-medium text-foreground">
                    Minimum Annual Salary ($)
                  </label>
                  <Input
                    id="profile-min-salary"
                    type="number"
                    step="1000"
                    value={minSalary}
                    onChange={(e) => setMinSalary(Number(e.target.value))}
                    className="h-10 text-sm font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="profile-target-salary" className="block text-sm font-medium text-foreground">
                    Target Salary ($)
                  </label>
                  <Input
                    id="profile-target-salary"
                    type="number"
                    step="1000"
                    value={targetSalary}
                    onChange={(e) => setTargetSalary(Number(e.target.value))}
                    className="h-10 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="profile-education" className="block text-sm font-medium text-foreground">
                  Education Background
                </label>
                <Input
                  id="profile-education"
                  type="text"
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  placeholder="B.S. in Computer Science or Bootcamp Graduate"
                  className="h-10 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="profile-github" className="block text-sm font-medium text-foreground">
                    GitHub Profile URL
                  </label>
                  <Input
                    id="profile-github"
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username"
                    className="h-10 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="profile-linkedin" className="block text-sm font-medium text-foreground">
                    LinkedIn Profile URL
                  </label>
                  <Input
                    id="profile-linkedin"
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="h-10 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="profile-summary" className="block text-sm font-medium text-foreground">
                  Professional Summary
                </label>
                <Textarea
                  id="profile-summary"
                  rows={4}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Overview of your technical strengths, core projects, and career background..."
                  className="text-sm"
                />
              </div>

              <div className="flex justify-end pt-3 border-t border-border">
                <Button
                  type="submit"
                  disabled={saving}
                  variant="default"
                  className="gap-2 font-semibold text-sm h-10 px-5"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? "Saving..." : "Save Master Profile"}</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Right 5 Cols: Skill Taxonomy & Inventory Management */}
        <div className="lg:col-span-5 space-y-6">
          {/* Add Skill to Profile */}
          <Card className="border-border bg-card">
            <CardHeader className="p-6 pb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                Add Skill to Inventory
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <form onSubmit={handleAddSkill} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label htmlFor="add-skill-name" className="block text-sm font-medium text-foreground">
                    Skill Name
                  </label>
                  <Input
                    id="add-skill-name"
                    type="text"
                    required
                    list="taxonomy-suggestions"
                    placeholder="e.g. Next.js, FastAPI, Docker, PyTorch"
                    value={skillInputName}
                    onChange={(e) => setSkillInputName(e.target.value)}
                    className="h-10 text-sm"
                  />
                  <datalist id="taxonomy-suggestions">
                    {taxonomy.map((item) => (
                      <option key={item.id} value={item.name} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="add-skill-category" className="block text-sm font-medium text-foreground">
                    Skill Category
                  </label>
                  <select
                    id="add-skill-category"
                    value={skillCategory}
                    onChange={(e) => setSkillCategory(e.target.value)}
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring font-medium h-10"
                  >
                    <option value="Frontend">Frontend</option>
                    <option value="Backend">Backend</option>
                    <option value="Database">Database</option>
                    <option value="DevOps">DevOps</option>
                    <option value="Cloud">Cloud</option>
                    <option value="AI">AI / Machine Learning</option>
                    <option value="Testing">Testing & QA</option>
                    <option value="Architecture">Architecture & System Design</option>
                    <option value="Methodology">Methodology & Management</option>
                    <option value="General">General / Other</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label htmlFor="add-skill-proficiency" className="block text-sm font-medium text-foreground">
                      Proficiency
                    </label>
                    <select
                      id="add-skill-proficiency"
                      value={proficiency}
                      onChange={(e) => setProficiency(e.target.value)}
                      className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring font-medium h-10"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Expert">Expert</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="add-skill-years" className="block text-sm font-medium text-foreground">
                      Years of Use
                    </label>
                    <Input
                      id="add-skill-years"
                      type="number"
                      min="0"
                      value={skillYears}
                      onChange={(e) => setSkillYears(Number(e.target.value))}
                      className="h-10 text-sm font-mono"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="secondary"
                  className="w-full h-10 text-sm font-semibold gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add to Skill Inventory</span>
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Active Skill Inventory by Category */}
          <Card className="border-border bg-card">
            <CardHeader className="p-6 pb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-zinc-100" />
                Verified Skill Inventory ({profile?.skills.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              {profile?.skills && profile.skills.length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(skillsByCategory).map(([category, items]) => (
                    <div key={category} className="space-y-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                        {category}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {items.map((cs) => (
                          <div
                            key={cs.id}
                            className="bg-muted/40 border border-border hover:border-zinc-600 rounded-lg px-3 py-1.5 text-sm flex items-center gap-2 group transition-all"
                          >
                            <span className="font-medium text-foreground">
                              {cs.skill_name}
                            </span>
                            <Badge variant="outline" className="text-xs font-mono px-1.5 py-0">
                              {cs.proficiency_level}
                            </Badge>
                            <button
                              onClick={() => handleRemoveSkill(cs.id)}
                              className="text-muted-foreground hover:text-rose-400 transition-colors"
                              aria-label={`Remove skill ${cs.skill_name}`}
                              title="Remove skill"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 bg-muted/20 border border-dashed border-border rounded-xl text-center space-y-2 text-sm text-muted-foreground">
                  <p className="font-semibold text-zinc-100">No skills recorded yet</p>
                  <p className="text-xs text-muted-foreground">
                    Upload your resume above to automatically discover and verify your skills.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

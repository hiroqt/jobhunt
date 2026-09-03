"use client";

import React, { useEffect, useState } from "react";
import {
  GraduationCap,
  Loader2,
  ChevronDown,
  ChevronUp,
  Brain,
  Copy,
  Check,
  Target,
  FileQuestion,
} from "lucide-react";
import { getJobs, getApplications, generateInterviewPrep } from "@/lib/api";
import { Job, Application, InterviewPrepResponse } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AiPrepLoader } from "@/components/prep/AiPrepLoader";

export default function PrepPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [selectedProvider, setSelectedProvider] = useState("openrouter");
  const [loading, setLoading] = useState(false);
  const [prepData, setPrepData] = useState<InterviewPrepResponse | null>(null);
  const [expandedTech, setExpandedTech] = useState<Record<number, boolean>>({});
  const [expandedBehav, setExpandedBehav] = useState<Record<number, boolean>>({});
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [jobsData, appsData] = await Promise.all([getJobs(), getApplications()]);
        setJobs(jobsData);
        setApplications(appsData);
        if (jobsData.length > 0) {
          setSelectedJobId(jobsData[0].id);
        }
      } catch (err) {
        console.error("Error loading jobs for prep:", err);
      }
    }
    loadData();
  }, []);

  const handleGeneratePrep = async () => {
    if (!selectedJobId) return;
    setLoading(true);
    setPrepData(null);
    try {
      const data = await generateInterviewPrep({
        job_id: selectedJobId,
        provider: selectedProvider,
      });
      setPrepData(data);
      setExpandedTech({ 0: true });
      setExpandedBehav({ 0: true });
    } catch (err: any) {
      alert(err.message || "Failed to generate interview prep kit");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(identifier);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const selectedJobObj = jobs.find((j) => j.id === selectedJobId);

  const techQuestions = prepData?.top_technical_questions || [];
  const behavQuestions = prepData?.top_behavioral_questions || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header: Clean typography, no gradient, no eyebrow */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight flex items-center gap-3">
            <GraduationCap className="w-7 h-7 text-zinc-100" />
            AI Prep Studio
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Generate role-tailored technical questions, STAR behavioral frameworks, and questions for the interviewer.
          </p>
        </div>
      </div>

      {/* Selector & Generator Card */}
      <Card className="border-border bg-card p-6 shadow">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-6 space-y-1.5">
            <label htmlFor="select-role-prep" className="block text-sm font-semibold text-foreground">
              Select Target Opportunity
            </label>
            <select
              id="select-role-prep"
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring font-medium h-10"
            >
              {jobs.map((job) => (
                <option key={job.id} value={job.id} className="bg-background text-foreground">
                  {job.title} @ {job.company} ({job.workplace_type})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3 space-y-1.5">
            <label htmlFor="select-ai-prep" className="block text-sm font-semibold text-foreground">
              AI Provider
            </label>
            <select
              id="select-ai-prep"
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
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

          <div className="md:col-span-3">
            <Button
              onClick={handleGeneratePrep}
              disabled={loading || !selectedJobId}
              variant="default"
              className="w-full h-10 text-sm font-semibold gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Prep Kit...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  Generate Prep Kit
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Generated Content View */}
      {loading ? (
        <Card className="border-border bg-card shadow-sm">
          <AiPrepLoader
            jobTitle={selectedJobObj?.title}
            company={selectedJobObj?.company}
            provider={selectedProvider}
          />
        </Card>
      ) : prepData ? (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="p-6 bg-card border border-border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow">
            <div>
              <h2 className="text-xl font-bold text-zinc-100">
                {selectedJobObj?.title} @ {selectedJobObj?.company}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Target preparation kit tailored to this posting's exact requirements
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-mono">
                {techQuestions.length} Technical
              </Badge>
              <Badge variant="outline" className="text-xs font-mono">
                {behavQuestions.length} Behavioral
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Column 1: Technical Questions */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <Brain className="w-5 h-5 text-zinc-100" />
                <h3 className="text-base font-bold text-zinc-100">
                  Role Technical Questions
                </h3>
              </div>

              <div className="space-y-3">
                {techQuestions.map((tq, idx) => {
                  const isExpanded = !!expandedTech[idx];
                  const answerText = tq.suggested_answer_points?.join("\n• ") || "";

                  return (
                    <Card
                      key={idx}
                      className="border-border bg-card overflow-hidden shadow-sm"
                    >
                      <div
                        onClick={() =>
                          setExpandedTech((prev) => ({ ...prev, [idx]: !prev[idx] }))
                        }
                        tabIndex={0}
                        role="button"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            setExpandedTech((prev) => ({ ...prev, [idx]: !prev[idx] }));
                          }
                        }}
                        className="p-4 cursor-pointer hover:bg-accent/40 flex items-start justify-between gap-3 select-none outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-muted-foreground">
                              Q{idx + 1}
                            </span>
                            {tq.concept_tested && (
                              <Badge variant="outline" className="text-xs font-mono">
                                {tq.concept_tested}
                              </Badge>
                            )}
                          </div>
                          <h4 className="text-sm font-semibold text-zinc-100 leading-snug">
                            {tq.question}
                          </h4>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                        )}
                      </div>

                      {isExpanded && (
                        <div className="p-4 pt-0 border-t border-border bg-muted/20 space-y-3 text-sm">
                          {tq.suggested_answer_points && tq.suggested_answer_points.length > 0 && (
                            <div>
                              <span className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
                                Suggested Answer Talking Points:
                              </span>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                {tq.suggested_answer_points.map((pt, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span className="text-zinc-400 mt-0.5">•</span>
                                    <span>{pt}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div className="flex justify-end pt-2">
                            <Button
                              onClick={() => copyToClipboard(answerText, `tech-${idx}`)}
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs gap-1"
                            >
                              {copiedIndex === `tech-${idx}` ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy Points</span>
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Column 2: Behavioral STAR Questions */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <Target className="w-5 h-5 text-zinc-100" />
                <h3 className="text-base font-bold text-zinc-100">
                  Behavioral STAR Scenarios
                </h3>
              </div>

              <div className="space-y-3">
                {behavQuestions.map((bq, idx) => {
                  const isExpanded = !!expandedBehav[idx];
                  const star = bq.star_guidance;
                  const starText = star
                    ? `Situation: ${star.Situation}\nTask: ${star.Task}\nAction: ${star.Action}\nResult: ${star.Result}`
                    : "";

                  return (
                    <Card
                      key={idx}
                      className="border-border bg-card overflow-hidden shadow-sm"
                    >
                      <div
                        onClick={() =>
                          setExpandedBehav((prev) => ({ ...prev, [idx]: !prev[idx] }))
                        }
                        tabIndex={0}
                        role="button"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            setExpandedBehav((prev) => ({ ...prev, [idx]: !prev[idx] }));
                          }
                        }}
                        className="p-4 cursor-pointer hover:bg-accent/40 flex items-start justify-between gap-3 select-none outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-muted-foreground">
                              B{idx + 1}
                            </span>
                            {(bq.competency_tested || bq.concept_tested) && (
                              <Badge variant="outline" className="text-xs font-mono">
                                {bq.competency_tested || bq.concept_tested}
                              </Badge>
                            )}
                          </div>
                          <h4 className="text-sm font-semibold text-zinc-100 leading-snug">
                            {bq.question}
                          </h4>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                        )}
                      </div>

                      {isExpanded && (
                        <div className="p-4 pt-0 border-t border-border bg-muted/20 space-y-4 text-sm">
                          {star && (
                            <div className="space-y-2">
                              <span className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                                Recommended STAR Structure:
                              </span>
                              <div className="grid grid-cols-1 gap-2">
                                <div className="p-2.5 bg-background rounded-md border border-border">
                                  <span className="text-xs font-bold text-emerald-400 block mb-0.5">
                                    [S] Situation
                                  </span>
                                  <p className="text-xs text-muted-foreground leading-relaxed">
                                    {star.Situation}
                                  </p>
                                </div>
                                <div className="p-2.5 bg-background rounded-md border border-border">
                                  <span className="text-xs font-bold text-sky-400 block mb-0.5">
                                    [T] Task
                                  </span>
                                  <p className="text-xs text-muted-foreground leading-relaxed">
                                    {star.Task}
                                  </p>
                                </div>
                                <div className="p-2.5 bg-background rounded-md border border-border">
                                  <span className="text-xs font-bold text-amber-400 block mb-0.5">
                                    [A] Action
                                  </span>
                                  <p className="text-xs text-muted-foreground leading-relaxed">
                                    {star.Action}
                                  </p>
                                </div>
                                <div className="p-2.5 bg-background rounded-md border border-border">
                                  <span className="text-xs font-bold text-purple-400 block mb-0.5">
                                    [R] Result
                                  </span>
                                  <p className="text-xs text-muted-foreground leading-relaxed">
                                    {star.Result}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex justify-end pt-2">
                            <Button
                              onClick={() => copyToClipboard(starText, `behav-${idx}`)}
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs gap-1"
                            >
                              {copiedIndex === `behav-${idx}` ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy STAR Story</span>
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Questions to Ask Interviewer */}
          {prepData.questions_to_ask_interviewer && prepData.questions_to_ask_interviewer.length > 0 && (
            <Card className="border-border bg-card p-6 shadow">
              <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2 mb-4">
                <FileQuestion className="w-5 h-5 text-zinc-100" />
                High-Signal Questions for the Interviewer
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {prepData.questions_to_ask_interviewer.map((q, i) => (
                  <div key={i} className="p-4 bg-muted/40 rounded-lg border border-border text-sm text-foreground">
                    <span className="font-mono text-xs text-muted-foreground block mb-1">
                      Option {i + 1}
                    </span>
                    {q}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      ) : (
        <Card className="border-border bg-card p-12 text-center space-y-3">
          <GraduationCap className="w-10 h-10 text-muted-foreground mx-auto" />
          <h3 className="text-base font-semibold text-zinc-100">Select an opportunity to begin prep</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Choose any tracked job posting above and click "Generate Prep Kit" to create technical and behavioral question frameworks.
          </p>
        </Card>
      )}
    </div>
  );
}

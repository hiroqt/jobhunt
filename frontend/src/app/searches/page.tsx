"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  JobSearch,
  SearchExecution,
  SourceInfo,
  SearchRunResponse,
} from "@/types";
import {
  getSearches,
  createSearch,
  deleteSearch,
  runSearch,
  getSources,
  getSearchExecutions,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatSalary, formatSalaryRange, getCurrencyFlag, getCurrencySymbol } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Compass01Icon as Compass,
  ChartRadarIcon as Radar,
  PlayIcon as Play,
  Add01Icon as Plus,
  Delete02Icon as Trash2,
  RefreshIcon as RefreshCw,
  Clock01Icon as Clock,
  CheckmarkCircle02Icon as CheckCircle2,
  AlertCircleIcon as AlertCircle,
  Activity01Icon as Activity,
  Layers01Icon as Layers,
  RadioIcon as Radio,
  File01Icon as FileText,
  SlidersHorizontalIcon as Sliders,
  ArrowRight01Icon as ArrowRight,
  Briefcase01Icon as Briefcase
} from "hugeicons-react";
import { useOnboarding } from "@/context/OnboardingContext";

function formatSourceName(src: string): string {
  const map: Record<string, string> = {
    jobstreet: "JobStreet PH",
    kalibrr: "Kalibrr PH",
    onlinejobs: "OnlineJobs.ph",
    bossjob: "Bossjob PH",
    philjobnet: "PhilJobNet (DOLE)",
    linkedin: "LinkedIn",
    indeed: "Indeed",
    remoteok: "RemoteOK",
    public: "Company Careers",
  };
  return map[src.toLowerCase()] || src;
}

export default function SearchesPage() {
  const router = useRouter();
  const { currentStepIndex, isOpen, jumpToStep } = useOnboarding();
  const [searches, setSearches] = useState<JobSearch[]>([]);
  const [sources, setSources] = useState<SourceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningSearchId, setRunningSearchId] = useState<string | null>(null);

  // Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedExecutions, setSelectedExecutions] = useState<SearchExecution[]>([]);
  const [selectedSearchName, setSelectedSearchName] = useState("");
  const [lastRunResult, setLastRunResult] = useState<SearchRunResponse | null>(null);
  const [resultModalOpen, setResultModalOpen] = useState(false);

  // Modal 1-by-1 Sequential Step Glow State
  const [modalGlowStep, setModalGlowStep] = useState<number>(1);
  const [hasExecutedDiscovery, setHasExecutedDiscovery] = useState<boolean>(false);

  // Form State
  const [formName, setFormName] = useState("");
  const [formSources, setFormSources] = useState<string[]>([
    "jobstreet",
    "kalibrr",
    "onlinejobs",
    "bossjob",
    "philjobnet",
    "linkedin",
    "indeed",
    "remoteok",
    "public",
  ]);
  const [formKeywords, setFormKeywords] = useState("");
  const [formLocations, setFormLocations] = useState("Philippines");
  const [formRemoteType, setFormRemoteType] = useState("Remote");
  const [formMinSalary, setFormMinSalary] = useState(50000);
  const [formMaxSalary, setFormMaxSalary] = useState(90000);
  const [formCurrency, setFormCurrency] = useState("PHP");
  const [formFrequency, setFormFrequency] = useState<"MANUAL" | "HOURLY" | "DAILY" | "WEEKLY">("DAILY");
  const [submitting, setSubmitting] = useState(false);

  // Derived step completion states
  const isStep1Done = formName.trim().length >= 3;
  const isStep2Done = formSources.length > 0;
  const isStep3Done = formKeywords.trim().length >= 2;
  const isStep4Done = formMinSalary > 0 || formMaxSalary > 0;

  // Advance step strictly forward to next pending step (never cycles back to done steps)
  const advanceNextStep = (fromStep: number) => {
    if (fromStep === 1) {
      if (!isStep2Done) {
        setModalGlowStep(2);
      } else if (!isStep3Done) {
        setModalGlowStep(3);
      } else if (!isStep4Done) {
        setModalGlowStep(4);
      } else {
        setModalGlowStep(5);
      }
    } else if (fromStep === 2) {
      if (!isStep3Done) {
        setModalGlowStep(3);
      } else if (!isStep4Done) {
        setModalGlowStep(4);
      } else {
        setModalGlowStep(5);
      }
    } else if (fromStep === 3) {
      if (!isStep4Done) {
        setModalGlowStep(4);
      } else {
        setModalGlowStep(5);
      }
    } else if (fromStep === 4) {
      setModalGlowStep(5);
    }
  };

  // When modal opens: clear background highlights and focus Step 1
  useEffect(() => {
    if (createModalOpen) {
      document.querySelectorAll(".tour-highlight-active").forEach((el) => {
        if (!el.closest('[role="dialog"]')) {
          el.classList.remove("tour-highlight-active");
        }
      });
      setModalGlowStep(1);
    }
  }, [createModalOpen]);

  // Data-driven forward progression: When Name is filled -> advance forward
  useEffect(() => {
    if (!createModalOpen) return;

    if (modalGlowStep === 1 && formName.trim().length >= 3) {
      const timer = setTimeout(() => {
        if (formSources.length > 0) {
          setModalGlowStep(formKeywords.trim().length >= 2 ? 4 : 3);
        } else {
          setModalGlowStep(2);
        }
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [formName, modalGlowStep, createModalOpen, formSources.length, formKeywords]);

  // Data-driven forward progression: When Keywords is filled -> advance forward to Salary (Step 4)
  useEffect(() => {
    if (!createModalOpen) return;

    if (modalGlowStep === 3 && formKeywords.trim().length >= 3) {
      const timer = setTimeout(() => {
        setModalGlowStep(4);
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [formKeywords, modalGlowStep, createModalOpen]);

  // Scroll active glow element into view inside modal
  useEffect(() => {
    if (!createModalOpen) return;

    const stepIdMap: Record<number, string> = {
      1: "tour-form-name",
      2: "tour-form-sources",
      3: "tour-form-keywords-loc",
      4: "tour-form-salary",
      5: "tour-form-submit",
    };

    const targetId = stepIdMap[modalGlowStep];
    if (targetId) {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [modalGlowStep, createModalOpen]);

  // Step 2 Tour: Step-by-Step Glowing Progression
  // 1. If active searches exist: "Discover Now" on the card glows!
  // 2. While scanning: glowing is cleared.
  // 3. When discovery completes: "View Discovered Jobs" in the modal glows!
  // 4. Clicking "View Discovered Jobs" moves directly to Step 3 (Job Explorer).
  useEffect(() => {
    if (!isOpen || currentStepIndex !== 2) return;

    const clearHighlights = () => {
      document.querySelectorAll(".tour-highlight-active").forEach((el) => {
        el.classList.remove("tour-highlight-active");
      });
    };

    // Priority 1: When Discovery results modal is open, glow "View Discovered Jobs"!
    if (resultModalOpen) {
      clearHighlights();
      const timer = setTimeout(() => {
        const viewJobsBtn = document.getElementById("tour-view-discovered-jobs");
        if (viewJobsBtn) {
          viewJobsBtn.classList.add("tour-highlight-active");
          viewJobsBtn.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 120);
      return () => {
        clearTimeout(timer);
        clearHighlights();
      };
    }

    // Priority 2: If Create Search modal is open, or search is scanning, or still loading:
    // clear background highlights so completed tasks do not glow!
    if (createModalOpen || runningSearchId || loading) {
      clearHighlights();
      return;
    }

    // Priority 3: If active search configuration cards exist, glow "Discover Now" on the first card!
    if (searches.length > 0) {
      clearHighlights();
      const timer = setTimeout(() => {
        const discoverBtn = document.getElementById("tour-search-card-run");
        if (discoverBtn) {
          discoverBtn.classList.add("tour-highlight-active");
          discoverBtn.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 150);
      return () => {
        clearTimeout(timer);
        clearHighlights();
      };
    }

    // Priority 4: If no search configuration exists yet, glow "+ New Search"
    if (searches.length === 0) {
      clearHighlights();
      const timer = setTimeout(() => {
        const newSearchBtn = document.getElementById("tour-searches-new-btn");
        if (newSearchBtn) {
          newSearchBtn.classList.add("tour-highlight-active");
          newSearchBtn.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }, 150);
      return () => {
        clearTimeout(timer);
        clearHighlights();
      };
    }
  }, [
    isOpen,
    currentStepIndex,
    loading,
    searches.length,
    createModalOpen,
    resultModalOpen,
    runningSearchId,
  ]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [sData, srcData] = await Promise.all([getSearches(), getSources()]);
      setSearches(sData);
      setSources(srcData);
    } catch (e) {
      console.error("Failed to load searches data", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateSearch(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const kwList = formKeywords.split(",").map((s) => s.trim()).filter(Boolean);
      const locList = formLocations.split(",").map((s) => s.trim()).filter(Boolean);

      await createSearch({
        name: formName,
        sources: formSources,
        keywords: kwList,
        locations: locList,
        remote_types: [formRemoteType],
        employment_types: ["Full-time"],
        experience_levels: ["Junior", "Entry Level"],
        salary_min: formMinSalary > 0 ? formMinSalary : undefined,
        salary_max: formMaxSalary > 0 ? formMaxSalary : undefined,
        currency: formCurrency,
        schedule_frequency: formFrequency,
        enabled: true,
      });

      setCreateModalOpen(false);
      // Remove any glow from the modal submit button
      document.querySelectorAll(".tour-highlight-active").forEach((el) => {
        el.classList.remove("tour-highlight-active");
      });
      await loadData();

      // Smoothly scroll directly to Discover Now button on the newly saved card
      setTimeout(() => {
        const runBtn = document.getElementById("tour-search-card-run");
        if (runBtn) {
          runBtn.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 350);
    } catch (err: any) {
      alert(`Error creating search: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRunSearch(searchId: string) {
    // Instantly remove glow because user just clicked Discover Now - task is completed!
    document.querySelectorAll(".tour-highlight-active").forEach((el) => {
      el.classList.remove("tour-highlight-active");
    });
    setHasExecutedDiscovery(true);
    setRunningSearchId(searchId);
    try {
      const res = await runSearch(searchId);
      setLastRunResult(res);
      setResultModalOpen(true);
      await loadData();
    } catch (err: any) {
      alert(`Search execution failed: ${err.message}`);
    } finally {
      setRunningSearchId(null);
    }
  }

  async function handleDeleteSearch(searchId: string) {
    if (!confirm("Are you sure you want to remove this search configuration?")) return;
    try {
      await deleteSearch(searchId);
      setSearches((prev) => prev.filter((s) => s.id !== searchId));
    } catch (err: any) {
      alert(`Failed to delete search: ${err.message}`);
    }
  }

  async function handleViewHistory(search: JobSearch) {
    setSelectedSearchName(search.name);
    try {
      const execs = await getSearchExecutions(search.id);
      setSelectedExecutions(execs);
      setHistoryModalOpen(true);
    } catch (err: any) {
      alert(`Failed to load executions: ${err.message}`);
    }
  }

  const toggleSource = (src: string) => {
    setFormSources((prev) =>
      prev.includes(src) ? prev.filter((s) => s !== src) : [...prev, src]
    );
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5 sm:pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Radar className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Discover a Job</h1>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Configure multi-source continuous job discovery. Collect, normalize, deduplicate, and qualify opportunities automatically.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="h-9 sm:h-10 text-xs font-semibold flex-1 sm:flex-initial">
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
          <Button id="tour-searches-new-btn" size="sm" onClick={() => setCreateModalOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm h-9 sm:h-10 text-xs font-semibold flex-1 sm:flex-initial">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            <span>New Search</span>
          </Button>
        </div>
      </div>

      {/* Connected Source Adapters Health Bar */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs sm:text-sm font-semibold flex items-center gap-2 text-foreground">
            <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
            <span>Connected Job Sources ({sources.length})</span>
          </h3>
          <span className="text-[11px] sm:text-xs text-muted-foreground">Source-Agnostic Acquisition Engine</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
          {sources.map((src) => (
            <div
              key={src.source_name}
              className="p-3.5 rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm shadow-xs flex flex-col justify-between space-y-2 hover:border-border transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-foreground truncate">{src.display_name}</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    src.status === "HEALTHY" ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{src.status}</span>
                <span className="font-mono text-[10px]">{src.latency_ms}ms</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Saved Searches Grid */}
      <div id="tour-searches-active-config" className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Sliders className="w-4 h-4 text-primary" />
            Active Search Configurations
          </h3>
          <span className="text-xs text-muted-foreground">
            {searches.length} configured search{searches.length === 1 ? "" : "es"}
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse h-48 bg-muted/40" />
            ))}
          </div>
        ) : searches.length === 0 ? (
          <Card className="border-dashed border-2 p-12 text-center bg-card/40">
            <div className="flex flex-col items-center justify-center space-y-3 max-w-md mx-auto">
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <Compass className="w-8 h-8" />
              </div>
              <h4 className="font-semibold text-lg">No Search Configurations Yet</h4>
              <p className="text-sm text-muted-foreground">
                Define what opportunities you are looking for. The platform will continuously scan supported job sources, normalize results, and score them against your profile.
              </p>
              <Button onClick={() => setCreateModalOpen(true)} className="mt-2">
                <Plus className="w-4 h-4 mr-2" />
                Create First Search
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {searches.map((search, idx) => {
              const isRunning = runningSearchId === search.id;
              const executions = search.executions || [];
              const latestExec = executions[0];

              return (
                <Card
                  key={search.id}
                  id={idx === 0 ? "tour-active-search-card" : undefined}
                  className="flex flex-col justify-between border-border/70 bg-card hover:shadow-md transition-all duration-200"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base font-bold text-foreground leading-tight">
                          {search.name}
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          Runs {search.schedule_frequency.toLowerCase()}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="text-[11px] uppercase tracking-wider bg-primary/5 text-primary border-primary/20">
                        {search.enabled ? "Active" : "Paused"}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 text-xs pb-4">
                    {/* Sources Badge Row */}
                    <div>
                      <span className="text-[11px] font-medium text-muted-foreground block mb-1.5">Sources</span>
                      <div className="flex flex-wrap gap-1">
                        {search.sources.map((src) => (
                          <Badge key={src} variant="secondary" className="text-[10px] font-normal">
                            {formatSourceName(src)}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Keywords */}
                    <div>
                      <span className="text-[11px] font-medium text-muted-foreground block mb-1.5">Target Keywords</span>
                      <div className="flex flex-wrap gap-1">
                        {search.keywords.map((kw) => (
                          <span
                            key={kw}
                            className="px-2 py-0.5 rounded bg-muted text-foreground/80 font-mono text-[11px]"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Meta stats */}
                    <div className="pt-2 border-t border-border/40 grid grid-cols-2 gap-2 text-muted-foreground text-[11px]">
                      <div>
                        <span>Location: </span>
                        <span className="font-medium text-foreground">
                          {search.locations?.join(", ") || "Remote"}
                        </span>
                      </div>
                      <div>
                        <span>Salary Range: </span>
                        <span className="font-medium text-foreground">
                          {search.salary_min || search.salary_max
                            ? formatSalaryRange(search.salary_min, search.salary_max, search.currency, true)
                            : "Any"}
                        </span>
                      </div>
                    </div>

                    {/* Execution status snippet */}
                    {latestExec && (
                      <div className="p-2.5 rounded-lg bg-muted/50 border border-border/40 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-primary" />
                          <span className="text-muted-foreground">Last Run:</span>
                          <span className="font-semibold text-foreground">{latestExec.jobs_normalized} found</span>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            latestExec.status === "COMPLETED"
                              ? "text-emerald-500 border-emerald-500/30"
                              : "text-amber-500 border-amber-500/30"
                          }`}
                        >
                          {latestExec.status}
                        </Badge>
                      </div>
                    )}
                  </CardContent>

                  {/* Actions Footer */}
                  <div className="px-6 py-3.5 bg-muted/20 border-t border-border/40 flex items-center justify-between gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-8 text-muted-foreground hover:text-foreground"
                      onClick={() => handleViewHistory(search)}
                    >
                      <Layers className="w-3.5 h-3.5 mr-1" />
                      History
                    </Button>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteSearch(search.id)}
                        title="Delete Search"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>

                      <Button
                        id={idx === 0 ? "tour-search-card-run" : undefined}
                        data-tour-done={isRunning ? "true" : "false"}
                        size="sm"
                        className="h-8 bg-primary text-primary-foreground hover:bg-primary/90 text-xs shadow-xs font-medium"
                        onClick={() => handleRunSearch(search.id)}
                        disabled={isRunning}
                      >
                        {isRunning ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                            Scanning...
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
                            Discover Now
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Create Search */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Compass className="w-4 h-4" />
              </span>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">New Search Configuration</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Follow steps 1–5 below to configure your automated crawler, then click Save.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Step-by-Step Flow Instructions Banner inside Modal */}
          <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                </span>
                <span className="font-bold text-foreground text-xs">
                  Step {modalGlowStep} of 5:{" "}
                  {modalGlowStep === 1 && "Search Name & Target Role"}
                  {modalGlowStep === 2 && "Pick Target Sources"}
                  {modalGlowStep === 3 && "Keywords & Locations"}
                  {modalGlowStep === 4 && "Salary Range & Currency"}
                  {modalGlowStep === 5 && "Save Configuration"}
                </span>
              </div>

              {/* Stepper Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setModalGlowStep((prev) => (prev > 1 ? prev - 1 : 1))}
                  disabled={modalGlowStep === 1}
                  className="px-2 py-0.5 rounded border border-border/70 text-[10px] font-semibold bg-background hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  title="Previous Step"
                >
                  ◀ Prev
                </button>
                <button
                  type="button"
                  onClick={() => setModalGlowStep((prev) => (prev < 5 ? prev + 1 : 5))}
                  disabled={modalGlowStep === 5}
                  className="px-2 py-0.5 rounded border border-border/70 text-[10px] font-semibold bg-background hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  title="Next Step"
                >
                  Next ▶
                </button>
              </div>
            </div>

            {/* 1-by-1 Step Navigation Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-[11px] pt-0.5">
              {[
                { step: 1, label: "1. Name", sub: "Target Role", isDone: isStep1Done },
                { step: 2, label: "2. Sources", sub: "Portals", isDone: isStep2Done },
                { step: 3, label: "3. Keywords", sub: "& Location", isDone: isStep3Done },
                { step: 4, label: "4. Salary", sub: "Min/Max", isDone: isStep4Done },
                { step: 5, label: "5. Save", sub: "Create Radar", isDone: false },
              ].map((s) => {
                const isActive = modalGlowStep === s.step;
                const isCompleted = s.isDone && modalGlowStep > s.step;
                return (
                  <button
                    type="button"
                    key={s.step}
                    onClick={() => setModalGlowStep(s.step)}
                    className={`p-1.5 rounded-lg border text-center transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-sm scale-[1.03] ring-2 ring-primary/40"
                        : isCompleted
                        ? "bg-emerald-500/10 border-emerald-500/30 text-foreground hover:bg-emerald-500/15"
                        : "bg-background border-border/60 hover:border-border text-muted-foreground hover:bg-muted/40"
                    } ${s.step === 5 ? "col-span-2 sm:col-span-1" : ""}`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {isCompleted && !isActive && <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />}
                      <span className={`font-bold block text-[10px] ${
                        isActive
                          ? "text-primary-foreground"
                          : isCompleted
                          ? "text-emerald-600 dark:text-emerald-400"
                          : s.step === 5
                          ? "text-primary"
                          : "text-foreground"
                      }`}>
                        {s.label}
                      </span>
                    </div>
                    <span className={`text-[10px] truncate block ${
                      isActive
                        ? "text-primary-foreground/90 font-medium"
                        : isCompleted
                        ? "text-emerald-600/80 dark:text-emerald-400/80"
                        : "text-muted-foreground"
                    }`}>
                      {isCompleted && !isActive ? "Done" : s.sub}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleCreateSearch} className="space-y-4 pt-1">
            {/* Step 1: Search Name & Presets */}
            <div
              id="tour-form-name"
              className={`p-3.5 rounded-xl border transition-all duration-300 space-y-2.5 ${
                modalGlowStep === 1
                  ? "tour-highlight-active ring-2 ring-primary border-primary bg-primary/5"
                  : isStep1Done
                  ? "border-emerald-500/30 bg-card/60 shadow-xs"
                  : "border-border/80 bg-card/60"
              }`}
            >
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground flex items-center gap-2">
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    modalGlowStep === 1
                      ? "bg-primary text-primary-foreground ring-2 ring-primary/50 animate-pulse"
                      : isStep1Done
                      ? "bg-emerald-600 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {isStep1Done && modalGlowStep !== 1 ? "✓" : "1"}
                  </span>
                  <span>Search Name & Target Role</span>
                </label>
                {isStep1Done && modalGlowStep !== 1 ? (
                  <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Done
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground font-mono">Required</span>
                )}
              </div>
              <Input
                value={formName}
                onFocus={() => setModalGlowStep(1)}
                onChange={(e) => setFormName(e.target.value)}
                onBlur={() => {
                  if (formName.trim()) {
                    advanceNextStep(1);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (formName.trim()) {
                      advanceNextStep(1);
                    }
                  }
                }}
                placeholder="e.g. PH Remote Full Stack, Python Engineer, or Senior React Architect"
                className="text-xs h-9"
                required
              />

              {/* Quick role preset shortcuts */}
              <div id="tour-form-presets" className="pt-1">
                <span className="text-[11px] text-muted-foreground block mb-1.5 font-medium">
                  ⚡ Quick Presets (Click to autofill):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { name: "PH Remote Full Stack", kw: "Laravel, React, TypeScript, PHP", label: "🇵🇭 PH Full Stack", loc: "Philippines, Remote" },
                    { name: "BGC / Makati Tech Hub", kw: "Python, Golang, AWS, Node.js", label: "🇵🇭 BGC / Makati", loc: "Metro Manila, BGC, Taguig, Makati" },
                    { name: "OnlineJobs.ph Remote Roles", kw: "Virtual Assistant, Customer Support, CSR", label: "🇵🇭 Remote VA / CSR", loc: "Remote (Philippines)" },
                    { name: "Cebu Tech Park", kw: "React, Vue, Java, Spring", label: "🇵🇭 Cebu IT Park", loc: "Cebu City, Central Visayas" },
                    { name: "Global Remote Engineer", kw: "Next.js, Tailwind, PostgreSQL", label: "🌐 Global Remote", loc: "Worldwide, Remote" },
                  ].map((preset) => (
                    <button
                      type="button"
                      key={preset.label}
                      onClick={() => {
                        setFormName(preset.name);
                        setFormKeywords(preset.kw);
                        setFormLocations(preset.loc);
                        // Name, sources & keywords are filled -> step forward directly to Step 4 (Salary)
                        setModalGlowStep(4);
                      }}
                      className="px-2 py-0.5 rounded-md border border-border/70 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                    >
                      + {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Inline Step 1 Footer */}
              <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[11px]">
                {isStep1Done && modalGlowStep !== 1 ? (
                  <>
                    <span className="text-emerald-500 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Role configured: {formName}
                    </span>
                    <button
                      type="button"
                      onClick={() => setModalGlowStep(1)}
                      className="text-[11px] text-muted-foreground hover:text-foreground hover:underline"
                    >
                      Edit
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-muted-foreground">
                      {isStep1Done ? "✓ Role Name entered" : "Step 1 of 5"}
                    </span>
                    <button
                      type="button"
                      onClick={() => advanceNextStep(1)}
                      className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                    >
                      Next: {formSources.length > 0 ? "Keywords & Location ➔" : "Target Sources ➔"}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Step 2: Target Sources */}
            <div
              id="tour-form-sources"
              className={`p-3.5 rounded-xl border transition-all duration-300 space-y-2 ${
                modalGlowStep === 2
                  ? "tour-highlight-active ring-2 ring-primary border-primary bg-primary/5"
                  : isStep2Done && modalGlowStep > 2
                  ? "border-emerald-500/30 bg-card/60 shadow-xs"
                  : "border-border/80 bg-card/60"
              }`}
            >
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground flex items-center gap-2">
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    modalGlowStep === 2
                      ? "bg-primary text-primary-foreground ring-2 ring-primary/50 animate-pulse"
                      : isStep2Done && modalGlowStep > 2
                      ? "bg-emerald-600 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {isStep2Done && modalGlowStep > 2 ? "✓" : "2"}
                  </span>
                  <span>Target Sources ({formSources.length} selected)</span>
                </label>
                {isStep2Done && modalGlowStep > 2 ? (
                  <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Done ({formSources.length} sources)
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground">Select portals to crawl</span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: "jobstreet", name: "JobStreet PH" },
                  { id: "kalibrr", name: "Kalibrr PH" },
                  { id: "onlinejobs", name: "OnlineJobs.ph" },
                  { id: "bossjob", name: "Bossjob PH" },
                  { id: "philjobnet", name: "PhilJobNet (DOLE)" },
                  { id: "linkedin", name: "LinkedIn" },
                  { id: "indeed", name: "Indeed" },
                  { id: "remoteok", name: "RemoteOK" },
                  { id: "public", name: "Public ATS" },
                ].map((src) => (
                  <button
                    type="button"
                    key={src.id}
                    onClick={() => {
                      toggleSource(src.id);
                      if (formName.trim()) {
                        advanceNextStep(2);
                      }
                    }}
                    className={`p-2.5 rounded-lg border text-xs font-medium text-left flex items-center justify-between transition-colors ${
                      formSources.includes(src.id)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="truncate">{src.name}</span>
                    {formSources.includes(src.id) && <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 ml-1" />}
                  </button>
                ))}
              </div>

              {/* Inline Step 2 Footer */}
              <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[11px]">
                {isStep2Done && modalGlowStep > 2 ? (
                  <>
                    <span className="text-emerald-500 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {formSources.length} job portals active
                    </span>
                    <button
                      type="button"
                      onClick={() => setModalGlowStep(2)}
                      className="text-[11px] text-muted-foreground hover:text-foreground hover:underline"
                    >
                      Edit
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-muted-foreground">
                      {formSources.length} sources selected
                    </span>
                    <button
                      type="button"
                      onClick={() => advanceNextStep(2)}
                      className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                    >
                      Next: Keywords & Location ➔
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Step 3: Keywords & Location */}
            <div
              id="tour-form-keywords-loc"
              className={`p-3.5 rounded-xl border transition-all duration-300 space-y-3 ${
                modalGlowStep === 3
                  ? "tour-highlight-active ring-2 ring-primary border-primary bg-primary/5"
                  : isStep3Done && modalGlowStep > 3
                  ? "border-emerald-500/30 bg-card/60 shadow-xs"
                  : "border-border/80 bg-card/60"
              }`}
            >
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground flex items-center gap-2">
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    modalGlowStep === 3
                      ? "bg-primary text-primary-foreground ring-2 ring-primary/50 animate-pulse"
                      : isStep3Done && modalGlowStep > 3
                      ? "bg-emerald-600 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {isStep3Done && modalGlowStep > 3 ? "✓" : "3"}
                  </span>
                  <span>Keywords & Location Filters</span>
                </label>
                {isStep3Done && modalGlowStep > 3 ? (
                  <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Done
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground">Crawler search queries</span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">Target Keywords (comma-separated)</label>
                  <Input
                    value={formKeywords}
                    onFocus={() => setModalGlowStep(3)}
                    onChange={(e) => setFormKeywords(e.target.value)}
                    onBlur={() => {
                      if (formKeywords.trim()) {
                        advanceNextStep(3);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (formKeywords.trim()) {
                          advanceNextStep(3);
                        }
                      }
                    }}
                    placeholder="e.g. Laravel, PHP, React, TypeScript"
                    className="text-xs h-9"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">Locations</label>
                  <Input
                    value={formLocations}
                    onFocus={() => setModalGlowStep(3)}
                    onChange={(e) => setFormLocations(e.target.value)}
                    placeholder="Philippines, Remote, or Makati"
                    className="text-xs h-9"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">Work Arrangement</label>
                  <select
                    value={formRemoteType}
                    onFocus={() => setModalGlowStep(3)}
                    onChange={(e) => setFormRemoteType(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Onsite">Onsite</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">Scan Frequency</label>
                  <select
                    value={formFrequency}
                    onFocus={() => setModalGlowStep(3)}
                    onChange={(e) => setFormFrequency(e.target.value as any)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="MANUAL">Manual Only</option>
                    <option value="HOURLY">Hourly</option>
                    <option value="DAILY">Daily (Recommended)</option>
                    <option value="WEEKLY">Weekly</option>
                  </select>
                </div>
              </div>

              {/* Inline Step 3 Footer */}
              <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[11px]">
                {isStep3Done && modalGlowStep > 3 ? (
                  <>
                    <span className="text-emerald-500 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Queries: {formKeywords} ({formLocations})
                    </span>
                    <button
                      type="button"
                      onClick={() => setModalGlowStep(3)}
                      className="text-[11px] text-muted-foreground hover:text-foreground hover:underline"
                    >
                      Edit
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-muted-foreground">
                      {formKeywords.trim() ? "✓ Keywords entered" : "Step 3 of 5"}
                    </span>
                    <button
                      type="button"
                      onClick={() => advanceNextStep(3)}
                      className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                    >
                      Next: Salary Range ➔
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Step 4: Salary Range & Compensation */}
            <div
              id="tour-form-salary"
              className={`p-3.5 rounded-xl border transition-all duration-300 space-y-2.5 ${
                modalGlowStep === 4
                  ? "tour-highlight-active ring-2 ring-primary border-primary bg-primary/5"
                  : isStep4Done && modalGlowStep > 4
                  ? "border-emerald-500/30 bg-card/60 shadow-xs"
                  : "border-border/70 bg-muted/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-2">
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    modalGlowStep === 4
                      ? "bg-primary text-primary-foreground ring-2 ring-primary/50 animate-pulse"
                      : isStep4Done && modalGlowStep > 4
                      ? "bg-emerald-600 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {isStep4Done && modalGlowStep > 4 ? "✓" : "4"}
                  </span>
                  <span>Salary Range & Currency</span>
                </span>
                {isStep4Done && modalGlowStep > 4 ? (
                  <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Done: {formatSalaryRange(formMinSalary, formMaxSalary, formCurrency, true)}
                  </span>
                ) : (
                  <span className="text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                    {formatSalaryRange(formMinSalary, formMaxSalary, formCurrency, true)}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-0.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground block">
                    Currency
                  </label>
                  <select
                    value={formCurrency}
                    onFocus={() => setModalGlowStep(4)}
                    onChange={(e) => setFormCurrency(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium shadow-sm focus:outline-none focus:ring-1 focus:ring-ring font-sans"
                  >
                    <option value="PHP">🇵🇭 PHP (₱)</option>
                    <option value="USD">🇺🇸 USD ($)</option>
                    <option value="SGD">🇸🇬 SGD (S$)</option>
                    <option value="EUR">🇪🇺 EUR (€)</option>
                    <option value="GBP">🇬🇧 GBP (£)</option>
                    <option value="CAD">🇨🇦 CAD (CA$)</option>
                    <option value="AUD">🇦🇺 AUD (AU$)</option>
                    <option value="JPY">🇯🇵 JPY (¥)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground block">
                    Min Salary ({getCurrencySymbol(formCurrency)})
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground pointer-events-none">
                      {getCurrencySymbol(formCurrency)}
                    </span>
                    <Input
                      type="number"
                      step="1000"
                      value={formMinSalary || ""}
                      onFocus={() => setModalGlowStep(4)}
                      onBlur={() => advanceNextStep(4)}
                      onChange={(e) => setFormMinSalary(parseInt(e.target.value) || 0)}
                      placeholder="50,000"
                      className="pl-7 pr-2 h-9 text-xs font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground block">
                    Max Salary ({getCurrencySymbol(formCurrency)})
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground pointer-events-none">
                      {getCurrencySymbol(formCurrency)}
                    </span>
                    <Input
                      type="number"
                      step="1000"
                      value={formMaxSalary || ""}
                      onFocus={() => setModalGlowStep(4)}
                      onBlur={() => advanceNextStep(4)}
                      onChange={(e) => setFormMaxSalary(parseInt(e.target.value) || 0)}
                      placeholder="90,000"
                      className="pl-7 pr-2 h-9 text-xs font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>
              </div>

              {/* Inline Step 4 Footer */}
              <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[11px]">
                {isStep4Done && modalGlowStep > 4 ? (
                  <>
                    <span className="text-emerald-500 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Salary configured
                    </span>
                    <button
                      type="button"
                      onClick={() => setModalGlowStep(4)}
                      className="text-[11px] text-muted-foreground hover:text-foreground hover:underline"
                    >
                      Edit
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-muted-foreground">
                      ✓ Salary configured
                    </span>
                    <button
                      type="button"
                      onClick={() => advanceNextStep(4)}
                      className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      Next: Save Configuration ➔
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Step 5: Save Configuration */}
            <DialogFooter className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button
                id="tour-form-submit"
                type="submit"
                size="sm"
                onMouseEnter={() => setModalGlowStep(5)}
                disabled={submitting || formSources.length === 0}
                className={`font-semibold gap-1.5 shadow-sm transition-all duration-300 ${
                  modalGlowStep === 5 && !submitting
                    ? "tour-highlight-active ring-4 ring-emerald-500/80 bg-primary text-primary-foreground scale-105"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>5. Save Configuration</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Execution Result */}
      <Dialog open={resultModalOpen} onOpenChange={setResultModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Discovery Run Completed
            </DialogTitle>
            <DialogDescription>
              {lastRunResult?.message}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 py-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 block">
                {lastRunResult?.jobs_discovered}
              </span>
              <span className="text-xs font-medium text-muted-foreground">New Jobs Discovered</span>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 block">
                {lastRunResult?.jobs_deduplicated}
              </span>
              <span className="text-xs font-medium text-muted-foreground">Duplicates Filtered</span>
            </div>
          </div>

          <DialogFooter>
            <Button
              id="tour-view-discovered-jobs"
              size="default"
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 h-10 shadow-lg text-sm gap-2 cursor-pointer"
              onClick={() => {
                const targetUrl = lastRunResult?.search_id
                  ? `/jobs?search_id=${lastRunResult.search_id}`
                  : "/jobs";
                setResultModalOpen(false);
                document.querySelectorAll(".tour-highlight-active").forEach((el) => {
                  el.classList.remove("tour-highlight-active");
                });
                jumpToStep(3);
                router.push(targetUrl);
              }}
            >
              <Briefcase className="w-4 h-4 mr-1.5" />
              <span>View Discovered Jobs</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Execution History */}
      <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              Execution History: {selectedSearchName}
            </DialogTitle>
            <DialogDescription>
              Chronological log of discovery runs, deduplication counts, and timestamps.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3">
            {selectedExecutions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No execution runs recorded yet.</p>
            ) : (
              selectedExecutions.map((exec) => (
                <div
                  key={exec.id}
                  className="p-3.5 rounded-xl border border-border/70 bg-card text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          exec.status === "COMPLETED"
                            ? "text-emerald-500 border-emerald-500/30"
                            : "text-amber-500 border-amber-500/30"
                        }
                      >
                        {exec.status}
                      </Badge>
                      <span className="text-muted-foreground font-mono">
                        {new Date(exec.started_at).toLocaleString()}
                      </span>
                    </div>
                    <span className="font-semibold text-foreground">
                      {exec.jobs_normalized} new jobs
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] text-muted-foreground">
                    <div>Raw Scanned: <span className="text-foreground font-medium">{exec.jobs_found}</span></div>
                    <div>Saved: <span className="text-emerald-500 font-medium">{exec.jobs_normalized}</span></div>
                    <div>Deduplicated: <span className="text-amber-500 font-medium">{exec.jobs_deduplicated}</span></div>
                    <div>Failed: <span className="text-destructive font-medium">{exec.jobs_failed}</span></div>
                  </div>

                  {exec.logs && exec.logs.length > 0 && (
                    <details className="mt-2 text-[10px] font-mono text-muted-foreground bg-muted/40 p-2 rounded">
                      <summary className="cursor-pointer font-sans text-[11px] text-primary">View Pipeline Logs ({exec.logs.length})</summary>
                      <div className="mt-1 space-y-1">
                        {exec.logs.map((log, i) => (
                          <div key={i} className="truncate">
                            <span className="text-muted-foreground">[{log.timestamp.slice(11, 19)}]</span>{" "}
                            <span className={log.level === "ERROR" ? "text-destructive" : log.level === "WARNING" ? "text-amber-500" : "text-foreground"}>
                              {log.message}
                            </span>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

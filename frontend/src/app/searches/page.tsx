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
  Compass,
  Play,
  Plus,
  Trash2,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Activity,
  Layers,
  Radio,
  FileText,
  Sliders,
} from "lucide-react";

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
  ]);
  const [formKeywords, setFormKeywords] = useState("");
  const [formLocations, setFormLocations] = useState("Philippines");
  const [formRemoteType, setFormRemoteType] = useState("Remote");
  const [formMinSalary, setFormMinSalary] = useState(50000);
  const [formMaxSalary, setFormMaxSalary] = useState(90000);
  const [formCurrency, setFormCurrency] = useState("PHP");
  const [formFrequency, setFormFrequency] = useState<"MANUAL" | "HOURLY" | "DAILY" | "WEEKLY">("DAILY");
  const [submitting, setSubmitting] = useState(false);

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
      await loadData();
    } catch (err: any) {
      alert(`Error creating search: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRunSearch(searchId: string) {
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
              <Compass className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Automated Discovery & Saved Searches</h1>
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
          <Button size="sm" onClick={() => setCreateModalOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm h-9 sm:h-10 text-xs font-semibold flex-1 sm:flex-initial">
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
      <div className="space-y-4">
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
            {searches.map((search) => {
              const isRunning = runningSearchId === search.id;
              const executions = search.executions || [];
              const latestExec = executions[0];

              return (
                <Card
                  key={search.id}
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
                        size="sm"
                        className="h-8 bg-primary text-primary-foreground hover:bg-primary/90 text-xs shadow-xs"
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
        <DialogContent className="sm:max-w-[620px]">
          <DialogHeader>
            <DialogTitle>New Search Configuration</DialogTitle>
            <DialogDescription>
              Define target keywords, candidate preferences, and source platforms to scan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSearch} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Search Name</label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Laravel Backend Remote, Python Engineer, or React Developer"
                required
              />
            </div>

            {/* Quick role preset shortcuts */}
            <div>
              <span className="text-[11px] text-muted-foreground block mb-1.5 font-medium">Quick Presets:</span>
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
                    }}
                    className="px-2 py-0.5 rounded-md border border-border/70 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                  >
                    + {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1.5">
                Target Sources
              </label>
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
                    onClick={() => toggleSource(src.id)}
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Keywords (comma-separated)</label>
                <Input
                  value={formKeywords}
                  onChange={(e) => setFormKeywords(e.target.value)}
                  placeholder="e.g. Laravel, PHP or React, Node.js"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Locations</label>
                <Input
                  value={formLocations}
                  onChange={(e) => setFormLocations(e.target.value)}
                  placeholder="Remote, Worldwide, or city"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Work Arrangement</label>
                <select
                  value={formRemoteType}
                  onChange={(e) => setFormRemoteType(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Onsite">Onsite</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Scan Frequency</label>
                <select
                  value={formFrequency}
                  onChange={(e) => setFormFrequency(e.target.value as any)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="MANUAL">Manual Only</option>
                  <option value="HOURLY">Hourly</option>
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                </select>
              </div>
            </div>

            {/* Compensation & Salary Range (High-Visibility Dedicated Section) */}
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/70 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <span>Salary Range & Currency</span>
                </span>
                <span className="text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                  {formatSalaryRange(formMinSalary, formMaxSalary, formCurrency, true)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-0.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground block">
                    Currency
                  </label>
                  <select
                    value={formCurrency}
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
                      onChange={(e) => setFormMaxSalary(parseInt(e.target.value) || 0)}
                      placeholder="90,000"
                      className="pl-7 pr-2 h-9 text-xs font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>
              </div>
            </div>


            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || formSources.length === 0}>
                {submitting ? "Saving..." : "Save Configuration"}
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
              onClick={() => {
                const targetUrl = lastRunResult?.search_id
                  ? `/jobs?search_id=${lastRunResult.search_id}`
                  : "/jobs";
                setResultModalOpen(false);
                router.push(targetUrl);
              }}
            >
              View Discovered Jobs
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

"use client";

import React, { useState, useEffect } from "react";
import {
  Copy01Icon as Copy,
  Tick02Icon as Check,
  CommandLineIcon as Terminal,
  FlashIcon as Zap,
  ViewIcon as Eye,
  ViewOffSlashIcon as EyeOff,
  Key01Icon as Key,
  CheckmarkCircle01Icon as CheckCircle,
  HelpCircleIcon as HelpCircle,
  BotIcon as Bot
} from "hugeicons-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getGuestSessionId } from "@/lib/api";

export default function McpPage() {
  const [sessionId, setSessionId] = useState<string>("guest_default");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showSessionId, setShowSessionId] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSessionId(getGuestSessionId());
    }
  }, []);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Instant Prompt for Claude (recognized immediately in Claude Web & Desktop without errors)
  const claudePrompt = `You are my Sakto Ka Job Hunt Pipeline AI Assistant.
Your mission is to help me find remote and local jobs, evaluate if I qualify based on my skills, prepare for interviews, and organize my job applications.

How you help me:
1. Job Search & Fit: When I ask for jobs (e.g. "find remote software engineer jobs"), help me discover relevant opportunities and analyze my qualification score.
2. Qualification Scoring: Evaluate job requirements against my background:
   - 80%+ -> Strong Match (APPLY)
   - 60-79% -> Moderate Fit (REVIEW)
   - Below 60% -> Skill Gap (SKIP)
3. Interview & Prep: Help generate tailored technical questions, STAR behavioral frameworks, and follow-up emails.

Endpoints for live data:
- MCP SSE Endpoint: https://jobhunt-1e11.onrender.com/mcp/sse
- OpenAPI Specs: https://saktoka.click/openapi.json
- Authentication: None required (Public Guest Access)

Please confirm you are ready by introducing yourself as my Sakto Ka Job Assistant and ask what roles or skills I want to focus on!`;

  // 1-Line Terminal Auto-Setup for Claude Desktop
  const claudeTerminalCommand = `curl -s https://saktoka.click/setup-claude.sh | bash`;

  // Claude Desktop manual config JSON
  const claudeDesktopConfigJson = JSON.stringify(
    {
      mcpServers: {
        "sakto-ka": {
          "command": "npx",
          "args": ["-y", "mcp-remote", "https://jobhunt-1e11.onrender.com/mcp/sse"]
        }
      }
    },
    null,
    2
  );

  // Instant Prompt for ChatGPT & Codex
  const chatGptPrompt = `You are my Sakto Ka Job Hunt Pipeline AI Assistant.
Your mission is to help me discover jobs, evaluate qualification match scores, prepare for interviews, and manage my job search.

When I chat with you:
1. Job Search: Help me find remote or local opportunities matching my skills and experience.
2. Match Scoring: When I share job descriptions or links, score my match percentage (Apply / Review / Skip).
3. Interview Prep: Generate technical questions, STAR-method answers, and polite follow-up emails.

Live Endpoints:
- OpenAPI Action Schema: https://saktoka.click/openapi.json
- MCP SSE Stream: https://jobhunt-1e11.onrender.com/mcp/sse
- Authentication: None required (Public Guest Access)

Please confirm your readiness by introducing yourself as my Sakto Ka Job Assistant and ask me what kind of jobs I am looking for!`;

  // OpenAPI action URL for ChatGPT Custom GPT Actions
  const openApiSchemaUrl = "https://saktoka.click/openapi.json";

  // Cursor / AI Agent MCP snippet
  const agentMcpSnippet = JSON.stringify(
    {
      mcpServers: {
        "sakto-ka": {
          "url": "https://jobhunt-1e11.onrender.com/mcp/sse"
        }
      }
    },
    null,
    2
  );

  const samplePrompts = [
    {
      id: "search",
      title: "Find Remote Software Engineer Jobs",
      category: "Job Search",
      prompt:
        "Find me remote software engineer jobs with no minimum salary. Match them against my resume and show me the top 3 best fits.",
    },
    {
      id: "evaluate",
      title: "Check Fit for a Specific Job Link",
      category: "Match Check",
      prompt:
        "Here is a job posting: https://example.com/job-post. Review the requirements and tell me if I am qualified and what skills I might be missing.",
    },
    {
      id: "save",
      title: "Save an Opportunity to My Tracker",
      category: "Track Applications",
      prompt:
        "Save the top matching job to my sakto ka applications board so I can track it.",
    },
    {
      id: "prep",
      title: "Prepare for an Upcoming Interview",
      category: "Interview Help",
      prompt:
        "I have an interview coming up for a Software Engineer role at CloudScale AI. Give me likely technical questions and sample STAR-method answers.",
    },
    {
      id: "followup",
      title: "Write a Follow-Up Email",
      category: "Email Draft",
      prompt:
        "It's been 5 days since I submitted my application for the remote developer position. Draft a polite, friendly follow-up email for me.",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-background to-secondary/15 border border-border p-6 md:p-10">
        <div className="space-y-3 max-w-3xl">
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-foreground">
            Chat with Your AI Assistant to <span className="text-primary">Find & Manage Jobs</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
            Connect <span className="font-semibold text-foreground">Claude</span> (Web & Desktop) or <span className="font-semibold text-foreground">ChatGPT / Codex</span> to{" "}
            <span className="font-semibold text-foreground capitalize">sakto ka</span>. Simply copy the setup prompt below to start searching for remote roles, scoring your qualifications, and preparing interview answers directly in conversation.
          </p>
        </div>
      </div>

      {/* Main Connection Hub */}
      <Card className="p-6 md:p-8 border-border bg-card">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/60">
            <div>
              <h2 className="text-lg md:text-xl font-bold text-foreground">Choose Your Assistant</h2>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                Copy the prompt or run the 1-click command for your platform.
              </p>
            </div>

            {/* Session ID Viewer */}
            <div className="flex items-center gap-2 bg-muted/60 border border-border px-3 py-1.5 rounded-xl self-start sm:self-auto">
              <Key className="w-4 h-4 text-primary shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">Your Session ID</span>
                <span className="font-mono text-xs text-foreground font-medium">
                  {showSessionId ? sessionId : `${sessionId.slice(0, 10)}••••••••`}
                </span>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowSessionId(!showSessionId)}
                  className="h-7 w-7 p-0 cursor-pointer text-muted-foreground hover:text-foreground"
                  title={showSessionId ? "Hide Session ID" : "Show Session ID"}
                >
                  {showSessionId ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopy("session-id", sessionId)}
                  className="h-7 w-7 p-0 cursor-pointer text-muted-foreground hover:text-foreground"
                  title="Copy Session ID"
                >
                  {copiedKey === "session-id" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>
          </div>

          <Tabs defaultValue="claude" className="w-full">
            <TabsList className="grid grid-cols-2 w-full max-w-sm">
              <TabsTrigger value="claude" className="text-xs md:text-sm">Claude (Web & Desktop)</TabsTrigger>
              <TabsTrigger value="chatgpt" className="text-xs md:text-sm">ChatGPT & Codex</TabsTrigger>
            </TabsList>

            {/* CLAUDE TAB */}
            <TabsContent value="claude" className="space-y-6 pt-4">
              {/* Option 1: Instant Prompt for Any Claude Chat */}
              <div className="p-4 md:p-5 rounded-xl border-2 border-primary/30 bg-primary/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm md:text-base text-foreground flex items-center gap-2">
                      <Zap className="w-4 h-4 text-primary" />
                      1. Copy & Paste Setup Prompt (Claude Web & Desktop)
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Paste this directly into Claude. Claude will immediately introduce itself as your Sakto Ka assistant with zero setup errors.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleCopy("claude-prompt", claudePrompt)}
                    className="gap-1.5 text-xs shadow-sm cursor-pointer shrink-0"
                  >
                    {copiedKey === "claude-prompt" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>Copied Prompt!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Prompt</span>
                      </>
                    )}
                  </Button>
                </div>
                <pre className="p-3.5 rounded-lg bg-background/90 border border-border font-mono text-xs whitespace-pre-wrap text-foreground max-h-56 overflow-y-auto">
                  {claudePrompt}
                </pre>
              </div>

              {/* Option 2: 1-Click Terminal Setup for Claude Desktop */}
              <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-primary" />
                      2. Automatic 1-Click Setup for Claude Desktop (macOS / Linux)
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Want Claude Desktop to run live searches natively? Run this single command in your Terminal:
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleCopy("claude-terminal", claudeTerminalCommand)}
                    className="gap-1.5 text-xs shadow-sm cursor-pointer shrink-0"
                  >
                    {copiedKey === "claude-terminal" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Copied Command!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Command</span>
                      </>
                    )}
                  </Button>
                </div>
                <div className="bg-background px-3.5 py-2.5 rounded-lg border border-border font-mono text-xs text-foreground overflow-x-auto flex items-center justify-between">
                  <code>{claudeTerminalCommand}</code>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  This command automatically configures <code className="bg-muted px-1 py-0.5 rounded text-foreground font-mono">claude_desktop_config.json</code>. Restart Claude Desktop after running.
                </p>
              </div>

              {/* Option 3: Manual JSON Config */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">
                  Or manual Claude Desktop config (<code className="font-mono text-primary">claude_desktop_config.json</code>):
                </p>
                <div className="relative">
                  <pre className="p-4 rounded-xl bg-muted/60 border border-border font-mono text-xs overflow-x-auto text-foreground">
                    {claudeDesktopConfigJson}
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopy("claude-desktop-json", claudeDesktopConfigJson)}
                    className="absolute top-3 right-3 gap-1.5 text-xs cursor-pointer bg-background/80 hover:bg-background border border-border shadow-sm"
                  >
                    {copiedKey === "claude-desktop-json" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Install Permanently in Claude Web */}
              <div className="p-4 rounded-xl border border-border bg-background space-y-2">
                <h4 className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-primary" />
                  Install Permanently in Claude Web (Projects)
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  To keep Sakto Ka permanently in your Claude Web sidebar like an installed plugin: go to{" "}
                  <span className="font-medium text-foreground">claude.ai ➔ Projects ➔ Create Project</span> ("Sakto Ka"), and paste the setup prompt above into{" "}
                  <span className="font-medium text-foreground">Project Instructions</span>. Every chat created inside that project will automatically act as your Job Search Assistant without pasting prompts again!
                </p>
              </div>
            </TabsContent>

            {/* CHATGPT & CODEX TAB */}
            <TabsContent value="chatgpt" className="space-y-6 pt-4">
              {/* Option 1: Instant Prompt for ChatGPT Chat */}
              <div className="p-4 md:p-5 rounded-xl border-2 border-primary/30 bg-primary/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm md:text-base text-foreground flex items-center gap-2">
                      <Zap className="w-4 h-4 text-primary" />
                      1. Copy & Paste Setup Prompt (ChatGPT & Codex)
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Paste this into any ChatGPT or Codex chat window. The AI recognizes it immediately with zero errors.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleCopy("chatgpt-prompt", chatGptPrompt)}
                    className="gap-1.5 text-xs shadow-sm cursor-pointer shrink-0"
                  >
                    {copiedKey === "chatgpt-prompt" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>Copied Prompt!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Prompt</span>
                      </>
                    )}
                  </Button>
                </div>
                <pre className="p-3.5 rounded-lg bg-background/90 border border-border font-mono text-xs whitespace-pre-wrap text-foreground max-h-56 overflow-y-auto">
                  {chatGptPrompt}
                </pre>
              </div>

              {/* Option 2: ChatGPT Custom GPT / Action Connection */}
              <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-3">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  2. Add to ChatGPT Custom GPT (1-Click Action)
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  To give ChatGPT live tool-calling abilities to search jobs and score resumes:
                </p>
                <ol className="list-decimal list-inside text-xs text-muted-foreground space-y-1.5 pl-1">
                  <li>In ChatGPT, open <span className="font-semibold text-foreground">Explore GPTs ➔ Create a GPT</span>.</li>
                  <li>Click <span className="font-semibold text-foreground">Configure ➔ Create new action</span>.</li>
                  <li>Click <span className="font-semibold text-foreground">Import from URL</span> and paste the OpenAPI schema URL below:</li>
                  <li>Set Authentication to <span className="font-semibold text-foreground">None</span> (Public Guest Session, no API key required).</li>
                </ol>

                <div className="flex items-center justify-between bg-background px-3 py-2 rounded-lg border border-border font-mono text-xs text-foreground">
                  <span className="truncate mr-2">{openApiSchemaUrl}</span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleCopy("openapi-url", openApiSchemaUrl)}
                    className="h-7 text-xs gap-1 cursor-pointer shrink-0"
                  >
                    {copiedKey === "openapi-url" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    Copy Schema URL
                  </Button>
                </div>
              </div>

              {/* Option 3: Cursor, Windsurf & AI Coding Agents */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">
                  For Cursor, Windsurf, Claude Code, or Codex Agent config:
                </p>
                <div className="relative">
                  <pre className="p-4 rounded-xl bg-muted/60 border border-border font-mono text-xs overflow-x-auto text-foreground">
                    {agentMcpSnippet}
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopy("agent-mcp", agentMcpSnippet)}
                    className="absolute top-3 right-3 gap-1.5 text-xs cursor-pointer bg-background/80 hover:bg-background border border-border shadow-sm"
                  >
                    {copiedKey === "agent-mcp" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Config</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Install Permanently in ChatGPT Web */}
              <div className="p-4 rounded-xl border border-border bg-background space-y-2">
                <h4 className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-primary" />
                  Install Permanently in ChatGPT Web (Custom GPT)
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Once you import the action above (<code className="font-mono text-primary font-medium">https://saktoka.click/openapi.json</code>) and save your Custom GPT, it permanently appears in your ChatGPT left sidebar like an installed app. You can also share the link so anyone can click and use it with zero setup!
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Card>

      {/* Prompts to Try After Connecting */}
      <Card className="p-6 md:p-8 border-border bg-card">
        <div className="space-y-6">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-foreground">Example Prompts to Try in Chat</h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Once you paste the setup prompt, try asking your assistant any of these questions:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {samplePrompts.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-xl border border-border bg-background hover:border-primary/50 transition-colors flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-foreground">{p.title}</h3>
                    <span className="text-[11px] text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded">
                      {p.category}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed bg-muted/40 p-3 rounded-lg border border-border/40 font-normal">
                    "{p.prompt}"
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopy(p.id, p.prompt)}
                  className="w-full gap-1.5 text-xs cursor-pointer"
                >
                  {copiedKey === p.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Copied to Clipboard</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Prompt</span>
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

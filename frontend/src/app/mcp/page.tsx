"use client";

import React, { useState, useEffect } from "react";
import {
  Copy01Icon as Copy,
  Tick02Icon as Check,
  BotIcon as Bot,
  CommandLineIcon as Terminal,
  FlashIcon as Zap,
  ViewIcon as Eye,
  ViewOffSlashIcon as EyeOff,
  Key01Icon as Key
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

  const claudeDesktopConfigJson = JSON.stringify(
    {
      mcpServers: {
        "job-hunt-pipeline": {
          "command": "npx",
          "args": ["-y", "mcp-remote", "https://saktoka.click/mcp/sse"]
        }
      }
    },
    null,
    2
  );

  const claudeSetupPrompt = `Connect to sakto ka MCP server. Use endpoint: https://saktoka.click/mcp/sse
If configuring claude_desktop_config.json:
{
  "mcpServers": {
    "job-hunt-pipeline": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://saktoka.click/mcp/sse"]
    }
  }
}
Session ID: ${sessionId}
Once connected, list available tools and confirm ready to search jobs and review applications.`;

  const chatGptCodexSetupPrompt = `Connect to sakto ka Job Hunt Pipeline via OpenAPI schema:
URL: https://saktoka.click/openapi.json
MCP SSE Stream: https://saktoka.click/mcp/sse
Session Header: x-session-id: ${sessionId}

Please import these actions/tools to find jobs, score job qualifications against my resume, prepare for interviews, and manage my job pipeline. Confirm when connected!`;

  const chatGptActionOpenApiUrl = "https://saktoka.click/openapi.json";

  const codexPythonSnippet = `# OpenAI Codex / Assistants API Integration with sakto ka
import openai

client = openai.OpenAI()

# 1. Connect using the live OpenAPI specification:
OPENAPI_SCHEMA_URL = "https://saktoka.click/openapi.json"

# 2. Or query the live Job Hunt Pipeline SSE endpoint:
MCP_SSE_URL = "https://saktoka.click/mcp/sse"

# Your active session identifier:
SESSION_HEADER = {"x-session-id": "${sessionId}"}

print(f"Connected Codex to sakto ka at {MCP_SSE_URL}")`;

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
      {/* User-Friendly Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-background to-secondary/15 border border-border p-6 md:p-10">
        <div className="space-y-3 max-w-3xl">
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-foreground">
            Chat with Your AI Assistant to <span className="text-primary">Find & Manage Jobs</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
            Skip the manual searching and clicking. Connect <span className="font-semibold text-foreground">Claude</span> (Web or Desktop) or <span className="font-semibold text-foreground">ChatGPT / Codex</span> to{" "}
            <span className="font-semibold text-foreground capitalize">sakto ka</span>. You can simply ask your AI to find remote openings, check how well they match your background, prepare interview answers, and organize your job applications—all through conversation.
          </p>
        </div>
      </div>

      {/* Easy Setup Guide for Claude & ChatGPT/Codex */}
      <Card className="p-6 md:p-8 border-border bg-card">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/60">
            <div>
              <h2 className="text-lg md:text-xl font-bold text-foreground">Connect Claude or ChatGPT</h2>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                Choose your assistant below to view the setup steps and configuration.
              </p>
            </div>

            {/* Guest Session ID Toggle & Viewer */}
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
              <TabsTrigger value="chatgpt" className="text-xs md:text-sm">ChatGPT / Codex</TabsTrigger>
            </TabsList>

            {/* CLAUDE (WEB & DESKTOP) TAB */}
            <TabsContent value="claude" className="space-y-6 pt-4">
              {/* Auto Setup Prompt */}
              <div className="p-4 md:p-5 rounded-xl border-2 border-primary/30 bg-primary/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm md:text-base text-foreground flex items-center gap-2">
                      <Zap className="w-4 h-4 text-primary" />
                      Auto-Setup Prompt (Paste Directly into Claude)
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Copy this prompt and paste it into Claude Web or Desktop to automatically set up the connection.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleCopy("claude-prompt", claudeSetupPrompt)}
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
                <pre className="p-3.5 rounded-lg bg-background/90 border border-border font-mono text-xs whitespace-pre-wrap text-foreground">
                  {claudeSetupPrompt}
                </pre>
              </div>

              {/* Desktop Config Section */}
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground space-y-1.5">
                  <p className="font-semibold text-foreground text-sm">Manual Claude Desktop Config:</p>
                  <ol className="list-decimal list-inside space-y-1 pl-1">
                    <li>In Claude Desktop, open <span className="font-semibold text-foreground">Settings ➔ Developer ➔ Edit Config</span> (<code className="bg-muted px-1.5 py-0.5 rounded font-mono text-primary font-semibold">claude_desktop_config.json</code>).</li>
                    <li>Paste the snippet below and restart Claude:</li>
                  </ol>
                </div>

                <div className="relative">
                  <pre className="p-4 rounded-xl bg-muted/70 border border-border font-mono text-xs overflow-x-auto text-foreground">
                    {claudeDesktopConfigJson}
                  </pre>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleCopy("claude-desktop", claudeDesktopConfigJson)}
                    className="absolute top-3 right-3 gap-1.5 text-xs shadow-sm cursor-pointer"
                  >
                    {copiedKey === "claude-desktop" ? (
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

              {/* Web Section */}
              <div className="p-4 rounded-xl border border-border bg-background space-y-2">
                <h3 className="font-semibold text-sm text-foreground">For Claude Web (claude.ai):</h3>
                <p className="text-xs text-muted-foreground">
                  In Claude Web Projects or custom MCP connectors, connect directly to the live server endpoint:
                </p>
                <div className="flex items-center justify-between bg-muted/60 px-3 py-2 rounded-lg font-mono text-xs text-foreground border border-border">
                  <span>https://saktoka.click/mcp/sse</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopy("claude-web", "https://saktoka.click/mcp/sse")}
                    className="h-7 text-xs gap-1 cursor-pointer"
                  >
                    {copiedKey === "claude-web" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    Copy URL
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* CHATGPT / CODEX TAB */}
            <TabsContent value="chatgpt" className="space-y-6 pt-4">
              {/* Auto Setup Prompt for ChatGPT/Codex */}
              <div className="p-4 md:p-5 rounded-xl border-2 border-primary/30 bg-primary/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm md:text-base text-foreground flex items-center gap-2">
                      <Zap className="w-4 h-4 text-primary" />
                      Auto-Setup Prompt (Paste into ChatGPT / Codex)
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Copy this prompt and paste it into ChatGPT or Codex to automatically load the schema and tools.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleCopy("chatgpt-prompt", chatGptCodexSetupPrompt)}
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
                <pre className="p-3.5 rounded-lg bg-background/90 border border-border font-mono text-xs whitespace-pre-wrap text-foreground">
                  {chatGptCodexSetupPrompt}
                </pre>
              </div>

              {/* ChatGPT Custom GPT / Actions */}
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground space-y-1.5">
                  <p className="font-semibold text-foreground text-sm">For ChatGPT (Custom GPT / Actions):</p>
                  <ol className="list-decimal list-inside space-y-1 pl-1">
                    <li>In ChatGPT, open <span className="font-semibold text-foreground">Explore GPTs</span> ➔ <span className="font-semibold text-foreground">Create a GPT</span> (or edit your existing GPT).</li>
                    <li>Go to the <span className="font-semibold text-foreground">Configure</span> tab and click <span className="font-semibold text-foreground">Create new action</span>.</li>
                    <li>Click <span className="font-semibold text-foreground">Import from URL</span> and paste the OpenAPI URL below.</li>
                    <li>Click Import — ChatGPT will automatically load all the job search, qualification, and prep tools!</li>
                  </ol>
                </div>

                <div className="flex items-center justify-between bg-muted/60 px-3 py-2.5 rounded-xl font-mono text-xs text-foreground border border-border">
                  <span>{chatGptActionOpenApiUrl}</span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleCopy("chatgpt-url", chatGptActionOpenApiUrl)}
                    className="h-8 text-xs gap-1.5 cursor-pointer shadow-sm"
                  >
                    {copiedKey === "chatgpt-url" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Codex / Developers */}
              <div className="space-y-3 pt-2">
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="font-semibold text-foreground text-sm">For OpenAI Codex / API Developers:</p>
                  <p>Use the live endpoint in your OpenAI Assistants API or Python script:</p>
                </div>

                <div className="relative">
                  <pre className="p-4 rounded-xl bg-muted/70 border border-border font-mono text-xs overflow-x-auto text-foreground">
                    {codexPythonSnippet}
                  </pre>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleCopy("codex", codexPythonSnippet)}
                    className="absolute top-3 right-3 gap-1.5 text-xs shadow-sm cursor-pointer"
                  >
                    {copiedKey === "codex" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Card>

      {/* Friendly Prompts You Can Try */}
      <Card className="p-6 md:p-8 border-border bg-card">
        <div className="space-y-6">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-foreground">Example Prompts You Can Try</h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Once connected, you can copy and send any of these prompts directly to Claude or ChatGPT.
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

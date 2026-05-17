"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Code2,
  Eye,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  Globe,
} from "lucide-react";
import { DesignSession, ElementorTemplate } from "@/lib/types";

type Tab = "preview" | "json";
type ConvertState = "idle" | "loading" | "done" | "error";

export default function PreviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [session, setSession] = useState<DesignSession | null>(null);
  const [sessionError, setSessionError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("preview");

  const [convertState, setConvertState] = useState<ConvertState>("idle");
  const [elementorJson, setElementorJson] = useState<ElementorTemplate | null>(null);
  const [convertError, setConvertError] = useState("");

  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");

  // Load session
  useEffect(() => {
    if (!id) return;
    fetch(`/api/session/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setSessionError(data.error);
        else setSession(data);
      })
      .catch(() => setSessionError("Failed to load design session"));
  }, [id]);

  const handleConvert = useCallback(async () => {
    if (!session || convertState === "loading") return;
    setConvertState("loading");
    setConvertError("");
    setActiveTab("json");

    try {
      const res = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Conversion failed");
      setElementorJson(data.elementorJson);
      setConvertState("done");
    } catch (err: unknown) {
      setConvertError(err instanceof Error ? err.message : "Conversion failed");
      setConvertState("error");
    }
  }, [session, convertState, id]);

  const handleDownload = () => {
    if (!elementorJson) return;
    const blob = new Blob([JSON.stringify(elementorJson, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(session?.title || "claudementor-design")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    if (!elementorJson) return;
    await navigator.clipboard.writeText(JSON.stringify(elementorJson, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const jsonString = elementorJson
    ? JSON.stringify(elementorJson, null, 2)
    : "";

  if (sessionError) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="mx-auto text-red-400" size={40} />
          <p className="text-text-secondary">{sessionError}</p>
          <button
            onClick={() => router.push("/")}
            className="text-accent hover:underline text-sm"
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-surface-border shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-sm transition-colors"
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">New design</span>
          </button>
          <div className="w-px h-4 bg-surface-border" />
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-accent flex items-center justify-center">
              <Sparkles size={10} className="text-white" />
            </div>
            <span className="text-text-primary text-sm font-medium truncate max-w-[200px] sm:max-w-[400px]">
              {session.title}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Convert button */}
          {convertState === "idle" && (
            <button
              onClick={handleConvert}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-colors"
            >
              <Code2 size={13} />
              <span>Export to Elementor</span>
            </button>
          )}
          {convertState === "loading" && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-raised border border-surface-border text-text-secondary text-xs">
              <Loader2 size={13} className="animate-spin" />
              <span>Converting...</span>
            </div>
          )}
          {convertState === "done" && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleConvert}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-raised border border-surface-border text-text-secondary hover:text-text-primary text-xs transition-colors"
                title="Regenerate"
              >
                <RefreshCw size={12} />
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-raised border border-surface-border text-text-secondary hover:text-text-primary text-xs transition-colors"
              >
                {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                <span className="hidden sm:inline">{copied ? "Copied!" : "Copy"}</span>
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-colors"
              >
                <Download size={12} />
                <span>Download JSON</span>
              </button>
            </div>
          )}
          {convertState === "error" && (
            <button
              onClick={handleConvert}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 text-xs transition-colors"
            >
              <RefreshCw size={12} />
              <span>Retry</span>
            </button>
          )}
        </div>
      </header>

      {/* Tab bar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-surface-border shrink-0">
        <button
          onClick={() => setActiveTab("preview")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === "preview"
              ? "bg-surface-raised text-text-primary"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <Eye size={13} />
          Preview
        </button>
        <button
          onClick={() => {
            setActiveTab("json");
            if (convertState === "idle") handleConvert();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === "json"
              ? "bg-surface-raised text-text-primary"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <Code2 size={13} />
          Elementor JSON
          {convertState === "done" && (
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
          )}
        </button>

        {/* Viewport toggle (preview only) */}
        {activeTab === "preview" && (
          <div className="ml-auto flex items-center gap-1 bg-surface-raised border border-surface-border rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("desktop")}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                viewMode === "desktop"
                  ? "bg-surface text-text-primary"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              <Globe size={11} />
              <span className="hidden sm:inline">Desktop</span>
            </button>
            <button
              onClick={() => setViewMode("mobile")}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                viewMode === "mobile"
                  ? "bg-surface text-text-primary"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              📱
              <span className="hidden sm:inline">Mobile</span>
            </button>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {/* Preview tab */}
        {activeTab === "preview" && (
          <div className="h-full flex items-start justify-center bg-[#111] p-4 overflow-auto">
            <div
              className={`transition-all duration-300 bg-white shadow-2xl ${
                viewMode === "mobile" ? "w-[390px]" : "w-full max-w-6xl"
              }`}
              style={{ minHeight: "calc(100vh - 200px)" }}
            >
              <iframe
                srcDoc={session.html}
                className="w-full border-0"
                style={{ height: "calc(100vh - 140px)", minHeight: "600px" }}
                title="Website preview"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>
        )}

        {/* JSON tab */}
        {activeTab === "json" && (
          <div className="h-full overflow-auto bg-[#0a0a0a] font-mono text-xs leading-relaxed">
            {convertState === "loading" && (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-text-secondary">
                <Loader2 size={28} className="animate-spin text-accent" />
                <div className="text-center">
                  <p className="font-medium text-text-primary text-sm">
                    Converting to Elementor JSON...
                  </p>
                  <p className="text-xs mt-1 text-text-muted">
                    Claude is mapping your design to Elementor widgets
                  </p>
                </div>
              </div>
            )}

            {convertState === "error" && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-text-secondary">
                <AlertCircle size={28} className="text-red-400" />
                <p className="text-red-400 text-sm">{convertError}</p>
                <button
                  onClick={handleConvert}
                  className="text-accent hover:underline text-xs"
                >
                  Try again
                </button>
              </div>
            )}

            {convertState === "idle" && (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-text-secondary">
                <Code2 size={28} className="text-text-muted" />
                <div className="text-center">
                  <p className="text-sm font-medium text-text-primary">
                    Ready to convert
                  </p>
                  <p className="text-xs mt-1 text-text-muted">
                    Click &quot;Export to Elementor&quot; to generate the JSON
                  </p>
                </div>
                <button
                  onClick={handleConvert}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors"
                >
                  <Code2 size={14} />
                  Generate Elementor JSON
                </button>
              </div>
            )}

            {convertState === "done" && elementorJson && (
              <div className="p-6">
                {/* Stats bar */}
                <div className="flex items-center gap-4 mb-4 text-text-muted text-xs">
                  <span className="text-green-400 font-medium">✓ Ready to import</span>
                  <span>{elementorJson.content.length} sections</span>
                  <span>
                    {elementorJson.content.reduce(
                      (acc, s) =>
                        acc +
                        s.elements.reduce((a, c) => a + c.elements.length, 0),
                      0
                    )}{" "}
                    widgets
                  </span>
                  <span>{(jsonString.length / 1024).toFixed(1)} KB</span>
                </div>

                {/* Import instructions */}
                <div className="mb-4 p-3 rounded-lg bg-accent/10 border border-accent/20 text-xs text-accent/90">
                  <strong>How to import:</strong> WordPress Dashboard → Templates → Saved Templates → Import Templates → Upload this JSON file
                </div>

                {/* JSON code */}
                <pre className="text-[#c9d1d9] whitespace-pre-wrap break-all leading-5">
                  <JsonHighlight json={jsonString} />
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function JsonHighlight({ json }: { json: string }) {
  // Simple syntax highlighting without external deps
  const highlighted = json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"(version|title|type|content|page_settings|elType|widgetType|settings|elements|id)"/g,
      '<span style="color:#79b8ff">"$1"</span>')
    .replace(/"([^"]+)":/g, '<span style="color:#b392f0">"$1"</span>:')
    .replace(/: "([^"]*)"/g, ': <span style="color:#9ecbff">"$1"</span>')
    .replace(/: (true|false)/g, ': <span style="color:#f97583">$1</span>')
    .replace(/: (-?\d+\.?\d*)/g, ': <span style="color:#f8e3a1">$1</span>');

  return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
}

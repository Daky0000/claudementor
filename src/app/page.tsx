"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, Globe, Plus, Sparkles, X } from "lucide-react";

const EXAMPLE_PROMPTS = [
  "A SaaS landing page with hero, features grid, pricing table, and CTA",
  "A portfolio site for a freelance photographer with gallery and contact form",
  "An e-commerce product page with image slider, reviews, and add to cart",
  "A restaurant website with menu, reservation form, and location map",
  "A startup homepage with animated hero, team section, and investor logos",
  "A blog layout with featured post, sidebar, and newsletter signup",
];

export default function Home() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 280) + "px";
  };

  const handleSubmit = async () => {
    const trimmed = prompt.trim();
    if (!trimmed || isLoading) return;
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate design");
      }

      const { id } = await res.json();
      router.push(`/preview/${id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  return (
    <main className="min-h-screen bg-surface flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
            <Sparkles size={14} className="text-white" />
          </div>
          <span className="text-text-primary font-semibold text-sm tracking-wide">
            Claudementor
          </span>
        </div>
        <div className="flex items-center gap-2 text-text-secondary text-xs">
          <Globe size={12} />
          <span>Elementor JSON Generator</span>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-24">
        {/* Heading */}
        <div className="text-center mb-10 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-semibold text-text-primary mb-3 tracking-tight">
            Welcome to Claudementor
          </h1>
          <p className="text-text-secondary text-base md:text-lg max-w-lg mx-auto leading-relaxed">
            Describe any website. Claude designs it, you export it as Elementor JSON.
          </p>
        </div>

        {/* Input card */}
        <div className="w-full max-w-2xl animate-slide-up">
          <div
            className={`rounded-2xl border transition-colors duration-200 ${
              error
                ? "border-red-500/50 bg-surface-raised"
                : "border-surface-border bg-surface-raised hover:border-[#3a3a3a]"
            }`}
          >
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                autoResize();
              }}
              onKeyDown={handleKeyDown}
              placeholder="What website shall we design? (e.g. A modern SaaS landing page with dark hero section, feature cards, and pricing...)"
              className="w-full bg-transparent text-text-primary placeholder-text-muted text-sm leading-relaxed px-5 pt-5 pb-2 resize-none min-h-[120px] max-h-[280px]"
              rows={4}
              disabled={isLoading}
            />

            {/* Bottom bar */}
            <div className="flex items-center justify-between px-4 pb-4 pt-1">
              <div className="flex items-center gap-2">
                <button className="w-7 h-7 rounded-full border border-surface-border flex items-center justify-center text-text-muted hover:text-text-secondary hover:border-[#444] transition-colors">
                  <Plus size={14} />
                </button>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface border border-surface-border text-text-secondary text-xs font-medium">
                  <Globe size={11} />
                  <span>Web</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-text-muted text-xs hidden sm:block">
                  ⌘ Enter to generate
                </span>
                <button
                  onClick={handleSubmit}
                  disabled={!prompt.trim() || isLoading}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                    prompt.trim() && !isLoading
                      ? "bg-accent hover:bg-accent-hover text-white shadow-lg shadow-accent/20"
                      : "bg-surface-border text-text-muted cursor-not-allowed"
                  }`}
                >
                  {isLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <ArrowUp size={14} />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-3 flex items-start gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <X size={12} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="mt-6 text-center animate-fade-in">
            <p className="text-text-secondary text-sm">
              Claude is designing your website...
            </p>
            <div className="flex items-center justify-center gap-1.5 mt-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Example prompts */}
        {!isLoading && (
          <div className="mt-8 flex flex-wrap justify-center gap-2 max-w-2xl animate-fade-in">
            {EXAMPLE_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPrompt(p);
                  textareaRef.current?.focus();
                  setTimeout(autoResize, 0);
                }}
                className="px-3 py-1.5 rounded-full bg-surface-raised border border-surface-border text-text-secondary text-xs hover:text-text-primary hover:border-[#3a3a3a] transition-colors truncate max-w-[280px]"
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center pb-6 text-text-muted text-xs">
        Powered by{" "}
        <span className="text-accent">Claude AI</span> · Exports to Elementor JSON
      </footer>
    </main>
  );
}

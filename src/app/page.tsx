"use client";

import { useState, useRef, useCallback } from "react";

const PRESETS = [
  { id: "platformer", label: "Platformer", emoji: "🏃", hint: "Side-scrolling jump & run" },
  { id: "shooter", label: "Space Shooter", emoji: "🚀", hint: "Top-down or side-scrolling" },
  { id: "puzzle", label: "Puzzle", emoji: "🧩", hint: "Match, slide, or logic" },
  { id: "racing", label: "Racing", emoji: "🏎️", hint: "Top-down or endless road" },
  { id: "arcade", label: "Arcade", emoji: "👾", hint: "Classic retro style" },
  { id: "survival", label: "Survival", emoji: "🧟", hint: "Waves of enemies" },
];

type GameState = "idle" | "generating" | "playing" | "error";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [gameHtml, setGameHtml] = useState<string | null>(null);
  const [state, setState] = useState<GameState>("idle");
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const generate = useCallback(async () => {
    if (!prompt.trim() && !selectedPreset) return;
    setState("generating");
    setError(null);
    setGameHtml(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), preset: selectedPreset }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      setGameHtml(data.html);
      setState("playing");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      setState("error");
    }
  }, [prompt, selectedPreset]);

  const exportGame = useCallback(() => {
    if (!gameHtml) return;
    const blob = new Blob([gameHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vibe-game.html";
    a.click();
    URL.revokeObjectURL(url);
  }, [gameHtml]);

  const reset = useCallback(() => {
    setState("idle");
    setGameHtml(null);
    setError(null);
    setPrompt("");
    setSelectedPreset(null);
  }, []);

  if (state === "playing" && gameHtml) {
    return (
      <div className="flex flex-col h-screen">
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
          <button
            onClick={reset}
            className="text-sm px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
          >
            ← New Game
          </button>
          <span className="text-sm text-zinc-500 font-mono">vibe game generator</span>
          <button
            onClick={exportGame}
            className="text-sm px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
          >
            Export HTML ↓
          </button>
        </div>
        <iframe
          ref={iframeRef}
          srcDoc={gameHtml}
          className="flex-1 w-full border-0 bg-black"
          sandbox="allow-scripts allow-same-origin"
          title="Generated Game"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-zinc-800/50 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="text-2xl">🎮</div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Vibe Game Generator</h1>
            <p className="text-xs text-zinc-500">Describe it. Play it. Ship it.</p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl space-y-8">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-3">Quick Start</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPreset(selectedPreset === p.id ? null : p.id)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all cursor-pointer ${
                    selectedPreset === p.id
                      ? "border-indigo-500 bg-indigo-500/10 text-white"
                      : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
                  }`}
                >
                  <span className="text-xl">{p.emoji}</span>
                  <span className="text-xs font-medium">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              {selectedPreset ? "Customize your game (optional)" : "Describe your game"}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                selectedPreset
                  ? "e.g., Set in an underwater world with jellyfish enemies and coral platforms..."
                  : "e.g., A retro-style snake game with neon colors, power-ups, and increasing speed..."
              }
              rows={4}
              className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 resize-none text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) generate();
              }}
            />
            <p className="text-xs text-zinc-600 mt-1">⌘+Enter to generate</p>
          </div>

          <button
            onClick={generate}
            disabled={state === "generating" || (!prompt.trim() && !selectedPreset)}
            className={`w-full py-3 px-6 rounded-lg font-medium text-sm transition-all cursor-pointer ${
              state === "generating"
                ? "bg-indigo-700 text-indigo-200 cursor-wait"
                : !prompt.trim() && !selectedPreset
                  ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
            }`}
          >
            {state === "generating" ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating your game...
              </span>
            ) : (
              "Generate Game ✨"
            )}
          </button>

          {state === "error" && error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <p className="text-center text-xs text-zinc-600">
            Powered by Claude — games are generated as self-contained HTML5 files
          </p>
        </div>
      </main>
    </div>
  );
}

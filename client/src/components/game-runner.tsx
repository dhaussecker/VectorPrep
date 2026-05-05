import { useState, useCallback, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

declare global {
  interface Window {
    loadPyodide: (config: any) => Promise<any>;
    _pyodideInstance: any;
    _pyodideLoading: Promise<any> | null;
  }
}

async function getPyodide(): Promise<any> {
  if (window._pyodideInstance) return window._pyodideInstance;
  if (window._pyodideLoading) return window._pyodideLoading;
  window._pyodideLoading = (async () => {
    if (!window.loadPyodide) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js";
        script.onload = () => resolve();
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    window._pyodideInstance = await window.loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/",
    });
    return window._pyodideInstance;
  })();
  return window._pyodideLoading;
}

interface GameState {
  grid: string[][];
  message: string;
  inventory: string[];
  stats: Record<string, any>;
  collected?: number;
  total?: number;
  won?: boolean;
}

// Visual config for each cell type
const CELL_CONFIG: Record<string, { emoji: string; bg: string; border: string }> = {
  WALL:         { emoji: "",   bg: "bg-stone-900",       border: "border-stone-700" },
  FLOOR:        { emoji: "",   bg: "bg-amber-950/50",    border: "border-amber-900/20" },
  HERO:         { emoji: "🧙", bg: "bg-amber-950/50",    border: "border-amber-900/20" },
  CHEST:        { emoji: "📦", bg: "bg-amber-950/50",    border: "border-yellow-600/40" },
  OPEN_CHEST:   { emoji: "🟫", bg: "bg-amber-950/30",    border: "border-amber-900/20" },
  EXIT_LOCKED:  { emoji: "🔒", bg: "bg-stone-950/80",    border: "border-red-900/40" },
  EXIT_OPEN:    { emoji: "🚪", bg: "bg-green-950/60",    border: "border-green-600/40" },
  ENEMY:        { emoji: "👾", bg: "bg-red-950/50",      border: "border-red-800/40" },
  NPC:          { emoji: "👤", bg: "bg-blue-950/50",     border: "border-blue-800/40" },
  ITEM:         { emoji: "💎", bg: "bg-purple-950/50",   border: "border-purple-700/40" },
};

export function GameRunner({ initCode }: { initCode: string }) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loadStatus, setLoadStatus] = useState<"loading" | "ready" | "error">("loading");
  const [running, setRunning] = useState(false);
  const [input, setInput] = useState("");
  const [cmdHistory, setCmdHistory] = useState<{ cmd: string; error?: string }[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [loadError, setLoadError] = useState<string | null>(null);
  const consoleRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const parseState = (stdout: string): GameState | null => {
    for (const line of stdout.split("\n")) {
      if (line.startsWith("GAME:")) {
        try { return JSON.parse(line.slice(5)); } catch {}
      }
    }
    return null;
  };

  const exec = useCallback(async (code: string, isInit = false) => {
    setRunning(true);
    try {
      const py = await getPyodide();
      py.runPython(`
import sys
from io import StringIO
_cap = StringIO()
sys.stdout = _cap
sys.stderr = _cap
`);
      let errText: string | undefined;
      try {
        py.runPython(code);
      } catch (e: any) {
        errText = (e.message ?? String(e)).split("\n").slice(-2).join(" ").trim();
      }
      const out: string = py.runPython("_cap.getvalue()");
      py.runPython("sys.stdout = sys.__stdout__\nsys.stderr = sys.__stderr__");
      const state = parseState(out);
      if (state) setGameState(state);
      if (!isInit) {
        setCmdHistory(h => [...h, { cmd: code, error: errText }]);
        setHistoryIdx(-1);
      }
      if (isInit) setLoadStatus("ready");
    } catch (e: any) {
      setLoadError(`Failed to load Python runtime: ${e.message}`);
      setLoadStatus("error");
    } finally {
      setRunning(false);
    }
  }, []);

  useEffect(() => { exec(initCode.trim(), true); }, []);

  useEffect(() => {
    if (consoleRef.current) consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
  }, [cmdHistory]);

  const handleRun = () => {
    const cmd = input.trim();
    if (!cmd || running || loadStatus !== "ready") return;
    setInput("");
    exec(cmd);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { handleRun(); return; }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const cmds = cmdHistory.map(h => h.cmd);
      const next = Math.min(historyIdx + 1, cmds.length - 1);
      if (cmds[cmds.length - 1 - next]) { setInput(cmds[cmds.length - 1 - next]); setHistoryIdx(next); }
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = historyIdx - 1;
      if (next < 0) { setInput(""); setHistoryIdx(-1); }
      else { const cmds = cmdHistory.map(h => h.cmd); setInput(cmds[cmds.length - 1 - next] ?? ""); setHistoryIdx(next); }
    }
  };

  if (loadStatus === "loading") {
    return (
      <div className="my-4 rounded-xl border-2 border-purple-700/60 bg-[#0f0f1e] flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto" />
          <p className="text-purple-300 text-sm font-mono">Loading Python runtime…</p>
          <p className="text-purple-500 text-xs font-mono">(first load takes ~10 seconds)</p>
        </div>
      </div>
    );
  }

  if (loadStatus === "error") {
    return (
      <div className="my-4 rounded-xl border-2 border-red-700/60 bg-[#1a0a0a] p-4">
        <p className="text-red-400 font-mono text-sm">{loadError}</p>
      </div>
    );
  }

  const cols = gameState?.grid[0]?.length ?? 1;

  return (
    <div className="my-4 rounded-xl overflow-hidden border-2 border-purple-700/50 bg-[#0f0f1e] select-none">

      {/* Title bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#1a1a3e] border-b border-purple-700/40">
        <span className="text-xs font-mono font-bold text-purple-300">🎮 Python Dungeon</span>
        {gameState?.collected !== undefined && (
          <span className={`text-xs font-mono font-bold ${gameState.collected === gameState.total ? "text-green-300" : "text-yellow-300"}`}>
            {gameState.won ? "🏆 Escaped!" : `⬛ ${gameState.collected}/${gameState.total} collected`}
          </span>
        )}
      </div>

      {/* Game area: grid + stats side by side */}
      <div className="flex flex-col sm:flex-row">

        {/* Map grid */}
        {gameState?.grid && (
          <div className="flex items-center justify-center p-3 bg-[#080814]">
            <div
              className="grid gap-px"
              style={{ gridTemplateColumns: `repeat(${cols}, 2rem)` }}
            >
              {gameState.grid.map((row, y) =>
                row.map((cell, x) => {
                  const cfg = CELL_CONFIG[cell] ?? CELL_CONFIG.FLOOR;
                  return (
                    <div
                      key={`${x}-${y}`}
                      className={`w-8 h-8 flex items-center justify-center text-sm ${cfg.bg} border ${cfg.border}`}
                    >
                      {cell === "WALL" ? (
                        <div className="w-full h-full bg-gradient-to-br from-stone-700 to-stone-900" />
                      ) : (
                        <span>{cfg.emoji}</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Stats panel */}
        {gameState && (
          <div className="flex-1 p-3 bg-[#0d0d28] border-t sm:border-t-0 sm:border-l border-purple-700/30 min-w-0">
            <p className="text-[9px] font-mono font-bold text-purple-400 uppercase tracking-widest mb-2">Stats</p>
            <div className="space-y-1">
              {Object.entries(gameState.stats).map(([k, v]) => (
                <div key={k} className="flex gap-2 text-xs font-mono">
                  <span className="text-purple-300 shrink-0">{k}</span>
                  <span className="text-green-300 truncate">{JSON.stringify(v)}</span>
                </div>
              ))}
            </div>

            {gameState.inventory.length > 0 && (
              <>
                <p className="text-[9px] font-mono font-bold text-purple-400 uppercase tracking-widest mt-3 mb-1">Inventory</p>
                <div className="space-y-0.5">
                  {gameState.inventory.map((item, i) => (
                    <p key={i} className="text-xs font-mono text-yellow-300 truncate">• {item}</p>
                  ))}
                </div>
              </>
            )}

            <p className="text-[9px] font-mono font-bold text-purple-400 uppercase tracking-widest mt-3 mb-1">Hints</p>
            <div className="text-[10px] font-mono text-gray-500 space-y-0.5">
              <p>move('north')</p>
              <p>move('south')</p>
              <p>move('east')</p>
              <p>move('west')</p>
              <p>look()</p>
              <p>status()</p>
              <p>help()</p>
            </div>
          </div>
        )}
      </div>

      {/* Message bar */}
      {gameState?.message && (
        <div className="px-3 py-2 bg-[#0a0a20] border-t border-purple-700/30">
          <p className="text-sm font-mono text-cyan-200 leading-snug">{gameState.message}</p>
        </div>
      )}

      {/* Console history */}
      <div
        ref={consoleRef}
        className="max-h-24 overflow-y-auto px-3 py-2 bg-[#070710] border-t border-purple-700/20 space-y-px"
        onClick={() => inputRef.current?.focus()}
      >
        {cmdHistory.length === 0 ? (
          <p className="text-[11px] font-mono text-gray-600 italic">Type a command and press Enter…</p>
        ) : (
          cmdHistory.map((h, i) => (
            <div key={i}>
              <p className="text-[11px] font-mono text-purple-300">{'>>> '}{h.cmd}</p>
              {h.error && <p className="text-[11px] font-mono text-red-400 pl-4 break-all">{h.error}</p>}
            </div>
          ))
        )}
      </div>

      {/* Input row */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#070710] border-t border-purple-700/30">
        <span className="text-purple-400 font-mono text-sm shrink-0">{'>>>'}</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="move('north')  |  look()  |  help()"
          className="flex-1 bg-transparent text-green-300 font-mono text-sm outline-none placeholder:text-gray-700 min-w-0"
          disabled={running}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
        />
        <button
          onClick={handleRun}
          disabled={running || !input.trim()}
          className="shrink-0 px-3 py-1 rounded bg-purple-700 text-white text-xs font-bold disabled:opacity-40 hover:bg-purple-600 transition-colors"
        >
          {running ? <Loader2 className="w-3 h-3 animate-spin" /> : "Run"}
        </button>
      </div>
    </div>
  );
}

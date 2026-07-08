import { useState, useCallback } from "react";
import { Play, Loader2, RotateCcw } from "lucide-react";

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

export function PythonRunner({ initialCode, minRows = 4 }: { initialCode: string; minRows?: number }) {
  const [code, setCode] = useState(initialCode.trim());
  const [output, setOutput] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "running" | "done" | "error">("idle");

  const run = useCallback(async () => {
    setStatus("loading");
    setOutput(null);
    try {
      const pyodide = await getPyodide();
      setStatus("running");
      pyodide.runPython(`
import sys
from io import StringIO
_cap = StringIO()
sys.stdout = _cap
sys.stderr = _cap
`);
      try {
        pyodide.runPython(code);
      } catch (err: any) {
        const msg = err.message ?? String(err);
        setOutput(`❌ ${msg}`);
        setStatus("error");
        pyodide.runPython("sys.stdout = sys.__stdout__\nsys.stderr = sys.__stderr__");
        return;
      }
      const out: string = pyodide.runPython("_cap.getvalue()");
      pyodide.runPython("sys.stdout = sys.__stdout__\nsys.stderr = sys.__stderr__");
      setOutput(out.trim() || "(no output)");
      setStatus("done");
    } catch (err: any) {
      setOutput(`Failed to load Python runtime: ${err.message}`);
      setStatus("error");
    }
  }, [code]);

  const reset = () => {
    setCode(initialCode.trim());
    setOutput(null);
    setStatus("idle");
  };

  return (
    <div className="my-4 rounded-xl overflow-hidden border-2 border-foreground shadow-hard">
      <div className="flex items-center justify-between px-3 py-2 bg-[#1e1e2e]">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold text-[#cba6f7]">🐍 Python</span>
          <div className="flex gap-1">
            {["#f38ba8", "#a6e3a1", "#f9e2af"].map((c, i) => (
              <div key={i} style={{ background: c }} className="w-2.5 h-2.5 rounded-full opacity-80" />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={reset} className="p-1 rounded text-[#6c7086] hover:text-[#cdd6f4] transition-colors" title="Reset code">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] text-[#6c7086] font-mono hidden sm:inline">⌘↵</span>
          <button
            onClick={run}
            disabled={status === "loading" || status === "running"}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-bold transition-all disabled:opacity-50 active:scale-95"
          >
            {(status === "loading" || status === "running")
              ? <><Loader2 className="w-3 h-3 animate-spin" />{status === "loading" ? "Loading…" : "Running…"}</>
              : <><Play className="w-3 h-3" />Run</>}
          </button>
        </div>
      </div>

      <textarea
        value={code}
        onChange={e => setCode(e.target.value)}
        spellCheck={false}
        rows={Math.max(minRows, code.split("\n").length + 1)}
        className="w-full bg-[#1e1e2e] text-[#cdd6f4] font-mono text-sm px-4 py-3 outline-none resize-none leading-relaxed"
        style={{ tabSize: 4 }}
        onKeyDown={e => {
          if (e.key === "Tab") {
            e.preventDefault();
            const el = e.currentTarget;
            const s = el.selectionStart;
            const end = el.selectionEnd;
            const next = code.slice(0, s) + "    " + code.slice(end);
            setCode(next);
            requestAnimationFrame(() => {
              el.selectionStart = el.selectionEnd = s + 4;
            });
          }
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            if (status !== "loading" && status !== "running") run();
          }
        }}
      />

      {output !== null && (
        <div className="bg-[#11111b] border-t-2 border-[#313244] px-4 py-3">
          <p className="text-[9px] font-mono font-bold text-[#6c7086] uppercase tracking-widest mb-1.5">Output</p>
          <pre className={`text-sm font-mono whitespace-pre-wrap leading-relaxed ${status === "error" ? "text-[#f38ba8]" : "text-[#a6e3a1]"}`}>
            {output}
          </pre>
        </div>
      )}
    </div>
  );
}

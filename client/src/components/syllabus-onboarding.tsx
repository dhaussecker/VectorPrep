import { useState, useRef } from "react";
import { Upload, Loader2, ChevronDown, ChevronRight, ArrowRight, FileText } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { CLASSES } from "@shared/classes";

interface ScanResult {
  courseName: string;
  sections: { title: string; skills: string[] }[];
}

interface Props {
  onDone: () => void;
}

export function SyllabusOnboarding({ onDone }: Props) {
  const [dragging, setDragging] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Set<number>>(new Set());
  const [creatingCourse, setCreatingCourse] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [classCode, setClassCode] = useState<string>(CLASSES[0]);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(fileList: File[]) {
    const files = fileList.filter(f => f.name.toLowerCase().endsWith(".pdf"));
    if (files.length === 0) { setError("Please upload PDF files."); return; }
    setError(null);
    setScanning(true);
    setScanResult(null);
    setUploadedFiles(files);

    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      const form = new FormData();
      form.append("file", files[0]);

      const res = await fetch("/api/user/syllabus-scan", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(body.message || "Scan failed");
      }
      const data: ScanResult = await res.json();
      setScanResult(data);
      setOpenSections(new Set(data.sections.map((_, i) => i)));
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setScanning(false);
    }
  }

  async function handleBuildCourse() {
    if (!scanResult || uploadedFiles.length === 0) return;
    setCreatingCourse(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      const form = new FormData();
      for (const file of uploadedFiles) form.append("files", file);
      form.append("courseName", scanResult.courseName);
      form.append("classCode", classCode);
      await fetch("/api/user/syllabus-upload", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
    } catch {}
    onDone();
  }

  function toggleSection(i: number) {
    setOpenSections(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", color: "white" }} className="pb-32 md:pb-10">
      <div style={{ maxWidth: 580, margin: "0 auto", padding: "48px 24px 24px", width: "100%" }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 11, fontFamily: "monospace", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 8 }}>
            {scanResult ? "Scan complete" : "Getting started"}
          </p>
          <h1 style={{ fontSize: 40, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.05, marginBottom: 10 }}>
            {scanResult ? scanResult.courseName : "Upload your syllabus."}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14 }}>
            {scanResult
              ? `${scanResult.sections.length} sections · ${scanResult.sections.reduce((s, sec) => s + sec.skills.length, 0)} skills to master`
              : "Drop your syllabus and lecture notes — the more you give us, the better the skills we build. We'll map out everything you need to know."}
          </p>
        </div>

        {/* Upload zone */}
        {!scanResult && (
          <>
            <div
              onClick={() => !scanning && inputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => {
                e.preventDefault(); setDragging(false);
                const files = Array.from(e.dataTransfer.files);
                if (files.length > 0) handleFiles(files);
              }}
              style={{
                border: `1.5px dashed ${dragging ? "#4ade80" : "rgba(255,255,255,0.12)"}`,
                borderRadius: 20, padding: "52px 24px", textAlign: "center",
                cursor: scanning ? "default" : "pointer",
                background: dragging ? "rgba(74,222,128,0.04)" : "#111",
                transition: "border-color 0.15s, background 0.15s",
              }}
            >
              <input ref={inputRef} type="file" accept=".pdf" multiple style={{ display: "none" }}
                onChange={e => { const files = Array.from(e.target.files ?? []); if (files.length > 0) handleFiles(files); }} />
              {scanning ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                  <Loader2 style={{ width: 36, height: 36, color: "#4ade80" }} className="animate-spin" />
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 600 }}>Scanning your syllabus…</p>
                  <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>Mapping skills by section</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(74,222,128,0.08)", border: "1.5px solid rgba(74,222,128,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Upload style={{ width: 24, height: 24, color: "#4ade80" }} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Drop your syllabus and notes here</p>
                    <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>or click to browse · PDF only · multiple files ok</p>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: 13 }}>
                {error}
              </div>
            )}

            <button
              onClick={onDone}
              style={{ marginTop: 16, width: "100%", background: "transparent", color: "rgba(255,255,255,0.25)", borderRadius: 12, padding: "12px 20px", fontWeight: 600, fontSize: 13, border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}
            >
              Skip for now
            </button>
          </>
        )}

        {/* Scan results */}
        {scanResult && (
          <>
            {uploadedFiles.length > 1 && (
              <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 10, background: "#111", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
                Scanned {uploadedFiles[0].name} · {uploadedFiles.length - 1} more file{uploadedFiles.length > 2 ? "s" : ""} will also be used when building your course
              </div>
            )}

            {scanResult.sections.map((section, i) => {
              const open = openSections.has(i);
              return (
                <div key={i} style={{ marginBottom: 8 }}>
                  <button
                    onClick={() => toggleSection(i)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 12,
                      background: "#111", border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: open ? "14px 14px 0 0" : 14,
                      padding: "14px 16px", cursor: "pointer", textAlign: "left",
                    }}
                  >
                    <FileText style={{ width: 15, height: 15, color: "#4ade80", flexShrink: 0 }} />
                    <span style={{ flex: 1, fontWeight: 700, fontSize: 14, color: "white" }}>{section.title}</span>
                    <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, fontFamily: "monospace", marginRight: 8 }}>
                      {section.skills.length} skills
                    </span>
                    {open
                      ? <ChevronDown style={{ width: 14, height: 14, color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
                      : <ChevronRight style={{ width: 14, height: 14, color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
                    }
                  </button>
                  {open && (
                    <div style={{ background: "#0e0e0e", border: "1px solid rgba(255,255,255,0.07)", borderTop: "none", borderRadius: "0 0 14px 14px", padding: "4px 0 8px" }}>
                      {section.skills.map((skill, j) => (
                        <div key={j} style={{
                          display: "flex", alignItems: "center", gap: 10, padding: "9px 16px",
                          borderBottom: j < section.skills.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                        }}>
                          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ade80", flexShrink: 0, opacity: 0.7 }} />
                          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>{skill}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            <div style={{ marginTop: 20 }}>
              <label style={{ display: "block", color: "rgba(255,255,255,0.35)", fontSize: 11, fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
                Which class is this?
              </label>
              <select
                value={classCode}
                onChange={e => setClassCode(e.target.value)}
                style={{
                  width: "100%", background: "#111", color: "white", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10, padding: "11px 12px", fontSize: 14, outline: "none",
                }}
              >
                {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <p style={{ marginTop: 6, color: "rgba(255,255,255,0.25)", fontSize: 12 }}>
                This adds you to {classCode}'s weekly skill sheet emails too, and your uploads help build better skills for everyone in the class.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
              <button
                onClick={handleBuildCourse}
                disabled={creatingCourse}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  background: "#4ade80", color: "black", borderRadius: 12,
                  padding: "15px 20px", fontWeight: 900, fontSize: 15, border: "none",
                  cursor: creatingCourse ? "default" : "pointer", opacity: creatingCourse ? 0.7 : 1,
                }}
              >
                {creatingCourse
                  ? <><Loader2 className="animate-spin" style={{ width: 16, height: 16 }} /> Building your course…</>
                  : <><span>Build my course</span><ArrowRight style={{ width: 16, height: 16 }} /></>
                }
              </button>
              <button
                onClick={onDone}
                style={{ background: "transparent", color: "rgba(255,255,255,0.35)", borderRadius: 12, padding: "12px 20px", fontWeight: 600, fontSize: 13, border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer" }}
              >
                Skip for now
              </button>
            </div>

            <button onClick={() => { setScanResult(null); setError(null); setUploadedFiles([]); }} style={{ marginTop: 12, background: "none", border: "none", color: "rgba(255,255,255,0.2)", fontSize: 12, cursor: "pointer", padding: 0 }}>
              ← Upload different files
            </button>
          </>
        )}
      </div>
    </div>
  );
}

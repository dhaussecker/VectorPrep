import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ChevronDown, Upload } from "lucide-react";
import React from "react";

const G = "#31C754";   // green
const T = "#111111";   // text
const M = "#6B7280";   // muted
const C = "#F9FAFB";   // card bg
const BD = "#E5E7EB";  // border
const MONO = "ui-monospace, 'SF Mono', 'Roboto Mono', Menlo, Consolas, monospace"; // data/eyebrow face

// ─── Scroll-reveal wrapper ────────────────────────────────────────────────────

function SR({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar({ onCTA }: { onCTA: () => void }) {
  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 100,
      background: "rgba(255,255,255,0.92)",
      backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
      borderBottom: `1px solid ${BD}`,
    }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 900, fontSize: 20, color: T, letterSpacing: "-0.01em" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundImage: "url('/quisly-mascot.png')", backgroundSize: "210%", backgroundPosition: "50% 12%", flexShrink: 0 }} />
          Quisly
        </div>
        <button
          onClick={onCTA}
          style={{ background: G, color: "white", border: "none", borderRadius: 100, padding: "10px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer", transition: "opacity 0.15s" }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.82")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
        >
          Get Started
        </button>
      </div>
    </nav>
  );
}

// ─── Announcement bar ─────────────────────────────────────────────────────────

function Bar() {
  return (
    <div style={{ background: G, textAlign: "center", padding: "11px 24px" }}>
      <p style={{ color: "white", fontWeight: 600, fontSize: 14, margin: 0 }}>
        I'm Quisly, your free academic sidekick for skill sheets, tutors, and exam prep. →
      </p>
    </div>
  );
}

// ─── iPhone mockup with live form ─────────────────────────────────────────────

const TOPIC_OPTIONS = ["Calculus", "Mechanics", "Programming", "Circuits"];
const GOAL_OPTIONS = ["Get ahead", "Catch up and pass", "Move faster, less time"];

type ClassRow = { name: string; fileName: string };

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: selected ? G : "#2C2C2E",
        color: selected ? "white" : "rgba(255,255,255,0.65)",
        border: selected ? "none" : "1px solid rgba(255,255,255,0.15)",
        borderRadius: 100, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function Phone({
  name, setName, email, setEmail, university, setUniversity,
  topics, toggleTopic, goals, toggleGoal,
  classRows, updateClassName, updateClassFile, addClassRow, removeClassRow,
  onSubmit, submitted, loading, error,
}: {
  name: string; setName: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  university: string; setUniversity: (v: string) => void;
  topics: string[]; toggleTopic: (t: string) => void;
  goals: string[]; toggleGoal: (g: string) => void;
  classRows: ClassRow[];
  updateClassName: (i: number, v: string) => void;
  updateClassFile: (i: number, f: File | null) => void;
  addClassRow: () => void;
  removeClassRow: (i: number) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitted: boolean; loading: boolean; error?: boolean;
}) {
  const inputStyle: React.CSSProperties = {
    display: "block", width: "100%", background: "#2C2C2E", border: "none", borderRadius: 10,
    padding: "9px 12px", color: "white", fontSize: 13, outline: "none", marginBottom: 7, boxSizing: "border-box",
  };
  const sectionLabel: React.CSSProperties = {
    color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: "12px 0 7px",
  };
  return (
    <div style={{
      width: 296,
      background: "linear-gradient(170deg, #3d3d3d 0%, #1a1a1a 100%)",
      borderRadius: 50,
      padding: "14px 5px",
      boxShadow: "0 60px 120px rgba(0,0,0,0.2), 0 0 0 1.5px rgba(255,255,255,0.1), inset 0 0 0 1px rgba(0,0,0,0.6)",
      position: "relative",
      flexShrink: 0,
    }}>
      {/* Physical buttons */}
      <div style={{ position: "absolute", left: -3, top: 108, width: 3, height: 30, background: "#4a4a4a", borderRadius: "2px 0 0 2px" }} />
      <div style={{ position: "absolute", left: -3, top: 148, width: 3, height: 56, background: "#4a4a4a", borderRadius: "2px 0 0 2px" }} />
      <div style={{ position: "absolute", left: -3, top: 212, width: 3, height: 56, background: "#4a4a4a", borderRadius: "2px 0 0 2px" }} />
      <div style={{ position: "absolute", right: -3, top: 158, width: 3, height: 76, background: "#4a4a4a", borderRadius: "0 2px 2px 0" }} />

      {/* Screen */}
      <div style={{ background: "#000", borderRadius: 42, overflow: "hidden", display: "flex", flexDirection: "column", height: 660 }}>

        {/* Status bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 22px 4px", background: "#000", flexShrink: 0 }}>
          <span style={{ color: "white", fontSize: 13, fontWeight: 700 }}>9:41</span>
          {/* Dynamic island */}
          <div style={{ width: 100, height: 28, background: "#000", borderRadius: 20, border: "2px solid #222" }} />
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {/* Signal bars */}
            <svg width="18" height="12" viewBox="0 0 18 12" fill="white">
              <rect x="0"   y="9"   width="3" height="3"  rx="1" />
              <rect x="5"   y="6"   width="3" height="6"  rx="1" />
              <rect x="10"  y="3"   width="3" height="9"  rx="1" />
              <rect x="15"  y="0"   width="3" height="12" rx="1" />
            </svg>
            {/* 5G label */}
            <span style={{ color: "white", fontSize: 11, fontWeight: 700, letterSpacing: "-0.5px" }}>5G</span>
            {/* Battery */}
            <svg width="27" height="13" viewBox="0 0 27 13" fill="none">
              <rect x="0.5" y="0.5" width="23" height="12" rx="3.5" stroke="white" strokeOpacity="0.4" />
              <rect x="2"   y="2"   width="19" height="9"  rx="2.5" fill="white" />
              <path d="M24.5 4.5v4c1-.5 1.5-1.2 1.5-2s-.5-1.5-1.5-2z" fill="white" fillOpacity="0.45" />
            </svg>
          </div>
        </div>

        {/* Back + header */}
        <div style={{ background: "#111", padding: "8px 14px 12px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0, borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}>
          {/* Back chevron */}
          <svg width="10" height="16" viewBox="0 0 10 16" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2" strokeLinecap="round">
            <path d="M8 2L2 8l6 6" />
          </svg>
          {/* Avatar */}
          <div style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0, backgroundImage: "url('/quisly-mascot.png')", backgroundSize: "210%", backgroundPosition: "50% 12%" }} />
          <div style={{ flex: 1, textAlign: "center", marginRight: 24 }}>
            <p style={{ color: "white", fontWeight: 600, fontSize: 15, margin: 0, lineHeight: 1.2 }}>Quisly</p>
            <p style={{ color: G, fontSize: 11, margin: 0 }}>Online</p>
          </div>
          {/* Phone icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
          </svg>
        </div>

        {/* Messages */}
        <div style={{ flexShrink: 0, padding: "14px 10px", background: "#000" }}>
          <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, backgroundImage: "url('/quisly-mascot.png')", backgroundSize: "210%", backgroundPosition: "50% 12%" }} />
            <div style={{ background: "#3A3A3C", color: "white", borderRadius: "16px 16px 16px 4px", padding: "9px 13px", maxWidth: "82%", fontSize: 13, lineHeight: 1.45 }}>
              Hey! 👋 Let's get you set up. Tell me a bit about yourself and I'll build your first skill sheet.
            </div>
          </div>
        </div>

        {/* Signup form */}
        <div style={{ flex: 1, overflowY: "auto", background: "#1C1C1E", padding: "10px 12px 16px", borderTop: "0.5px solid rgba(255,255,255,0.08)" }}>
          {submitted ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <p style={{ color: "white", fontWeight: 700, fontSize: 14, margin: 0 }}>Ok! I just sent you a message.</p>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, margin: "4px 0 0" }}>Check your inbox.</p>
            </div>
          ) : (
            <form onSubmit={onSubmit}>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                style={inputStyle}
              />
              <input
                id="email-input"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@gmail.com"
                style={inputStyle}
              />
              <input
                value={university}
                onChange={e => setUniversity(e.target.value)}
                placeholder="University"
                style={inputStyle}
              />

              <p style={sectionLabel}>What do you need help with?</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {TOPIC_OPTIONS.map(t => (
                  <Chip key={t} label={t} selected={topics.includes(t)} onClick={() => toggleTopic(t)} />
                ))}
              </div>

              <p style={sectionLabel}>Your classes</p>
              {classRows.map((row, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                    <input
                      value={row.name}
                      onChange={e => updateClassName(i, e.target.value)}
                      placeholder="e.g. MATH 133"
                      style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
                    />
                    {classRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeClassRow(i)}
                        style={{ background: "#2C2C2E", color: "rgba(255,255,255,0.5)", border: "none", borderRadius: 10, width: 32, flexShrink: 0, cursor: "pointer", fontSize: 16 }}
                      >
                        &times;
                      </button>
                    )}
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, background: "#2C2C2E", borderRadius: 10, padding: "7px 12px", color: row.fileName ? G : "rgba(255,255,255,0.45)", fontSize: 12, cursor: "pointer" }}>
                    <Upload size={12} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.fileName || "Upload syllabus"}</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      style={{ display: "none" }}
                      onChange={e => updateClassFile(i, e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>
              ))}
              <button
                type="button"
                onClick={addClassRow}
                style={{ background: "none", border: "none", color: G, fontSize: 12, fontWeight: 700, cursor: "pointer", padding: "2px 0 6px" }}
              >
                + Add another class
              </button>

              <p style={sectionLabel}>What are you looking for?</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                {GOAL_OPTIONS.map(g => (
                  <Chip key={g} label={g} selected={goals.includes(g)} onClick={() => toggleGoal(g)} />
                ))}
              </div>

              {error && (
                <p style={{ color: "#FF6B6B", fontSize: 12, margin: "0 0 8px" }}>
                  Something went wrong sending that. Try again in a moment.
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                style={{ display: "block", width: "100%", background: G, color: "white", border: "none", borderRadius: 10, padding: "11px", fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.72 : 1 }}
              >
                {loading ? "Sending…" : "Send Message →"}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}

// ─── Exam-ready proof card (the signature visual) ─────────────────────────────

function ExamReadyCard() {
  return (
    <div style={{
      width: 400, maxWidth: "100%",
      background: "white",
      border: `1px solid ${BD}`,
      borderRadius: 24,
      padding: "26px 28px 22px",
      boxShadow: "0 30px 70px rgba(0,0,0,0.14), 0 4px 14px rgba(0,0,0,0.06)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 26 }}>
        <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: M }}>
          Time to exam-ready
        </span>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: G, boxShadow: `0 0 0 4px ${G}22` }} />
      </div>

      <div style={{ position: "relative", paddingTop: 26 }}>
        {/* PASS threshold line spanning both tracks */}
        <div style={{ position: "absolute", left: "22%", top: 0, bottom: 6, width: 2, background: G, opacity: 0.35 }} />
        <div style={{ position: "absolute", left: "22%", top: 0, transform: "translateX(-50%)", fontFamily: MONO, color: G, fontSize: 11, fontWeight: 800, letterSpacing: "0.08em" }}>
          PASS
        </div>

        {/* Track: studying alone */}
        <div style={{ marginBottom: 34 }}>
          <p style={{ color: M, fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Studying alone</p>
          <div style={{ position: "relative", height: 12, borderRadius: 999, background: "#F3F4F6" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "88%", borderRadius: 999, background: "#D1D5DB" }} />
            <div style={{ position: "absolute", left: "88%", top: "50%", transform: "translate(-50%, -50%)", width: 12, height: 12, borderRadius: "50%", background: "#9CA3AF", boxShadow: "0 0 0 4px white" }} />
          </div>
          <p style={{ fontFamily: MONO, color: "#9CA3AF", fontSize: 12, fontWeight: 700, marginTop: 8 }}>~10+ HRS</p>
        </div>

        {/* Track: with Quisly */}
        <div>
          <p style={{ color: T, fontSize: 13, fontWeight: 700, marginBottom: 10 }}>With Quisly</p>
          <div style={{ position: "relative", height: 12, borderRadius: 999, background: "#F3F4F6" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "22%" }}
              transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
              style={{ position: "absolute", top: 0, bottom: 0, left: 0, borderRadius: 999, background: `linear-gradient(90deg, #22b04a, ${G})` }}
            />
            <div style={{ position: "absolute", left: "22%", top: "50%", transform: "translate(-50%, -50%)", width: 12, height: 12, borderRadius: "50%", background: G, boxShadow: `0 0 0 4px white, 0 0 0 6px ${G}33` }} />
          </div>
          <p style={{ fontFamily: MONO, color: G, fontSize: 12, fontWeight: 800, marginTop: 8 }}>3 HRS</p>
        </div>
      </div>

      <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 20, lineHeight: 1.5 }}>
        Based on a typical first-year calc/engineering weekly topic.
      </p>
    </div>
  );
}

// ─── Hero section ─────────────────────────────────────────────────────────────

function Hero({ onCTA }: { onCTA: () => void }) {
  return (
    <section style={{ maxWidth: 1080, margin: "0 auto", padding: "72px 24px 96px", display: "flex", alignItems: "center", gap: 60, flexWrap: "wrap" }}>

      {/* Left */}
      <div style={{ flex: "1 1 380px", minWidth: 300 }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p style={{ color: M, fontFamily: MONO, fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 12px" }}>
            The problem
          </p>
          <p style={{ color: T, fontSize: "clamp(19px, 2.4vw, 24px)", fontWeight: 600, lineHeight: 1.4, letterSpacing: "-0.01em", maxWidth: 520, margin: "0 0 28px" }}>
            Classes take months to get through. Between problem sets, labs, and everything else, <span style={{ color: G }}>time management</span> is what decides who gets ahead and who falls behind.
          </p>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{ fontSize: "clamp(40px, 5vw, 64px)", fontWeight: 900, lineHeight: 1.08, letterSpacing: "-0.03em", color: T, margin: "0 0 28px" }}
        >
          Knowing nothing to passing,<br />
          in as little as <span style={{ color: G }}>3 hours.</span>
        </motion.h1>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
              backgroundImage: "url('/quisly-mascot.png')", backgroundSize: "210%", backgroundPosition: "50% 12%",
            }} />
            <p style={{ color: M, fontSize: 15, margin: 0 }}>
              I'm <strong style={{ color: T }}>Quisly</strong>. I turn your classes into simple skill sheets you can actually learn from, then bring in real tutors so you learn fast.
            </p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.42 }}>
          <button
            onClick={onCTA}
            style={{ background: G, color: "white", border: "none", borderRadius: 100, padding: "16px 30px", fontWeight: 800, fontSize: 16, cursor: "pointer", boxShadow: `0 12px 28px ${G}40`, transition: "transform 0.15s, box-shadow 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 16px 34px ${G}55`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 12px 28px ${G}40`; }}
          >
            Get my first skill sheet, free →
          </button>
        </motion.div>
      </div>

      {/* Right – proof visual */}
      <motion.div
        initial={{ opacity: 0, x: 40, y: 8 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.7, delay: 0.18, ease: "easeOut" }}
        style={{ flexShrink: 0, margin: "0 auto" }}
      >
        <ExamReadyCard />
      </motion.div>

    </section>
  );
}

// ─── How it works ─────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    { n: "1", icon: "📄", eyebrow: "Every week", title: "Free skill sheets delivered to you", body: "Spend less time confused in lectures: the material's already broken down before you walk in." },
    { n: "2", icon: "🤝", eyebrow: "The moment you're stuck", title: "Connected with local tutors, immediately", body: "Personalized help, on demand, not a form you fill out and wait on." },
    { n: "3", icon: "🎯", eyebrow: "Before every exam", title: "Notified about review sessions", body: "So the last week before an exam isn't the first time you're seriously reviewing." },
  ];
  return (
    <section style={{ padding: "80px 24px", maxWidth: 1080, margin: "0 auto" }}>
      <style>{`
        .qs-step { position: relative; transition: transform 0.22s ease, box-shadow 0.22s ease; }
        .qs-step:hover { transform: translateY(-6px); box-shadow: 0 20px 40px rgba(0,0,0,0.09); }
        @media (min-width: 860px) {
          .qs-steps-grid > *:not(:last-child) .qs-step::after {
            content: '';
            position: absolute;
            top: 30px;
            left: 100%;
            width: 20px;
            height: 2px;
            background: repeating-linear-gradient(90deg, ${G} 0 4px, transparent 4px 8px);
          }
        }
      `}</style>
      <SR>
        <p style={{ color: M, fontFamily: MONO, fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>
          How you get there
        </p>
        <h2 style={{ fontSize: "clamp(26px, 3.5vw, 42px)", fontWeight: 900, color: T, letterSpacing: "-0.02em", marginBottom: 16 }}>
          From nothing to passing, in three steps.
        </h2>
        <p style={{ color: M, fontSize: 16, maxWidth: 620, lineHeight: 1.6, marginBottom: 40 }}>
          I analyze your syllabus and deliver customized content scheduled for exactly when you need it: not a generic study guide, a plan built around your actual course.
        </p>
      </SR>
      <div className="qs-steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
        {steps.map((s, i) => (
          <SR key={s.n} delay={i * 0.1}>
            <div className="qs-step" style={{ position: "relative", background: C, borderRadius: 20, padding: "32px 28px", border: `1px solid ${BD}`, overflow: "hidden" }}>
              <span style={{ position: "absolute", top: 12, right: 16, fontSize: 40, opacity: 0.12, lineHeight: 1 }}>{s.icon}</span>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: G, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 900, fontSize: 17, marginBottom: 16, boxShadow: `0 0 0 6px ${G}1F` }}>
                {s.n}
              </div>
              <p style={{ color: G, fontFamily: MONO, fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 8px" }}>{s.eyebrow}</p>
              <h3 style={{ fontWeight: 800, fontSize: 17, color: T, margin: "0 0 10px", letterSpacing: "-0.01em", lineHeight: 1.35 }}>{s.title}</h3>
              <p style={{ color: M, fontSize: 14, lineHeight: 1.6, margin: 0 }}>{s.body}</p>
            </div>
          </SR>
        ))}
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  const faq = [
    { q: "Who is this for?", a: "Students taking first-year calculus and engineering classes who want to get ahead, go from knowing nothing to passing, and move faster than the rest of the class." },
    { q: "Is it actually free?", a: "Yes. All of the skill sheets given out for the first half of this term are completely free." },
    { q: "Do I need to upload my syllabus?", a: "No, but it's how I schedule content for exactly when you need it." },
    { q: "What if I'm not in calculus or engineering?", a: "That's who I'm built for right now. More classes are coming." },
  ];
  return (
    <section style={{ padding: "0 24px 96px", maxWidth: 620, margin: "0 auto" }}>
      <SR>
        <h2 style={{ fontSize: "clamp(24px, 3vw, 34px)", fontWeight: 900, color: T, letterSpacing: "-0.02em", marginBottom: 24 }}>
          FAQ
        </h2>
        <div style={{ background: "#111", borderRadius: 20, padding: "8px 32px" }}>
          {faq.map((item, i) => (
            <div key={item.q} style={{ borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.1)" }}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, width: "100%", textAlign: "left", padding: "18px 0", background: "none", border: "none", cursor: "pointer" }}
              >
                <span style={{ color: "white", fontSize: 15, fontWeight: 700 }}>{item.q}</span>
                <ChevronDown
                  size={16}
                  style={{ color: "rgba(255,255,255,0.5)", flexShrink: 0, transition: "transform 0.2s", transform: open === i ? "rotate(180deg)" : "rotate(0deg)" }}
                />
              </button>
              <motion.div
                initial={false}
                animate={{ height: open === i ? "auto" : 0, opacity: open === i ? 1 : 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                style={{ overflow: "hidden" }}
              >
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, lineHeight: 1.55, margin: "0 0 18px" }}>{item.a}</p>
              </motion.div>
            </div>
          ))}
        </div>
      </SR>
    </section>
  );
}

// ─── Skill sheet email preview ────────────────────────────────────────────────

function SkillSheetPreview() {
  return (
    <section style={{ background: C, borderTop: `1px solid ${BD}`, borderBottom: `1px solid ${BD}`, padding: "96px 24px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <SR>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <p style={{ color: M, fontFamily: MONO, fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>
              The email
            </p>
            <h2 style={{ fontSize: "clamp(28px, 3.8vw, 46px)", fontWeight: 900, color: T, letterSpacing: "-0.02em", marginBottom: 16 }}>
              Here's what actually lands in your inbox.
            </h2>
            <p style={{ color: M, fontSize: 16, maxWidth: 540, margin: "0 auto", lineHeight: 1.6 }}>
              No app to check, no dashboard to remember. One email a week, built around exactly what your class covered.
            </p>
          </div>
        </SR>

        <SR delay={0.15}>
          <div style={{ maxWidth: 480, margin: "0 auto", background: "white", borderRadius: 20, border: `1px solid ${BD}`, boxShadow: "0 24px 64px rgba(0,0,0,0.1)", overflow: "hidden" }}>

            {/* Email header */}
            <div style={{ padding: "18px 24px", borderBottom: `1px solid ${BD}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, backgroundImage: "url('/quisly-mascot.png')", backgroundSize: "210%", backgroundPosition: "50% 12%" }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, fontSize: 13, color: T, margin: 0 }}>Quisly</p>
                  <p style={{ fontSize: 12, color: M, margin: 0 }}>to you</p>
                </div>
                <span style={{ fontFamily: MONO, fontSize: 12, color: M, whiteSpace: "nowrap" }}>Mon, 9:02 AM</span>
              </div>
              <p style={{ fontWeight: 800, fontSize: 16, color: T, margin: 0, letterSpacing: "-0.01em" }}>
                📄 Your skill sheet: Basic Differentiation &amp; Integration
              </p>
            </div>

            {/* Email body */}
            <div style={{ padding: "26px 24px 30px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <span style={{ fontFamily: MONO, background: G, color: "white", borderRadius: 100, padding: "4px 14px", fontSize: 12, fontWeight: 700 }}>RLO1</span>
                <span style={{ fontFamily: MONO, color: M, fontSize: 12, fontWeight: 600 }}>MATH 133.4</span>
              </div>

              <div style={{ background: `${G}14`, border: `1px solid ${G}33`, borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
                <p style={{ color: G, fontFamily: MONO, fontWeight: 700, fontSize: 11, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Summary</p>
                <p style={{ color: T, fontSize: 13, lineHeight: 1.55, margin: 0 }}>
                  <strong>Derivatives</strong> tell us the slope at a point: how fast a function is changing.<br />
                  <strong>Integrals</strong> tell us the area under a curve over an interval.
                </p>
              </div>

              <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: G, color: "white", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>1</div>
                <div>
                  <p style={{ color: T, fontWeight: 700, fontSize: 14, margin: "0 0 8px" }}>Power Rule for Differentiation</p>
                  <div style={{ background: C, border: `1px solid ${BD}`, borderRadius: 8, padding: "8px 12px", marginBottom: 8, textAlign: "center" }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: T }}>d/dx [x<sup>n</sup>] = n&middot;x<sup>n-1</sup></span>
                  </div>
                  <p style={{ color: M, fontSize: 12.5, margin: 0, lineHeight: 1.6 }}>
                    f(x) = 3x<sup>4</sup> - 5x<sup>2</sup> + 7&nbsp;&nbsp;&rarr;&nbsp;&nbsp;<strong style={{ color: G }}>f'(x) = 12x<sup>3</sup> - 10x</strong>
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, marginBottom: 22 }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: G, color: "white", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>2</div>
                <div>
                  <p style={{ color: T, fontWeight: 700, fontSize: 14, margin: "0 0 8px" }}>Power Rule for Integration</p>
                  <div style={{ background: C, border: `1px solid ${BD}`, borderRadius: 8, padding: "8px 12px", marginBottom: 8, textAlign: "center" }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: T }}>&int; x<sup>n</sup> dx = x<sup>n+1</sup>/(n+1) + C</span>
                  </div>
                  <p style={{ color: M, fontSize: 12.5, margin: 0, lineHeight: 1.6 }}>
                    &int; 4x<sup>3</sup> - 6x dx&nbsp;&nbsp;&rarr;&nbsp;&nbsp;<strong style={{ color: G }}>x<sup>4</sup> - 3x<sup>2</sup> + C</strong>
                  </p>
                </div>
              </div>

              <div style={{ background: "#111", borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
                <p style={{ color: "white", fontSize: 13, fontWeight: 700, margin: 0 }}>Need help with any of this?</p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, margin: "4px 0 0" }}>Reply and I'll connect you with a tutor.</p>
              </div>
            </div>
          </div>
        </SR>
      </div>
    </section>
  );
}

// ─── Final CTA (Boardy-style dark block) ──────────────────────────────────────

function FinalCTA({ onCTA }: { onCTA: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <section style={{ padding: "80px 24px" }}>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 32 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.65, ease: "easeOut" }}
        style={{
          maxWidth: 900,
          margin: "0 auto",
          background: "#111111",
          borderRadius: 28,
          padding: "80px 48px",
          textAlign: "center",
        }}
      >
        <h2 style={{ fontSize: "clamp(36px, 5.5vw, 64px)", fontWeight: 800, color: "white", letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 16 }}>
          Your next exam is closer than you think.
        </h2>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 17, maxWidth: 480, margin: "0 auto 36px", lineHeight: 1.6 }}>
          Stop guessing what's on it. Get your first skill sheet, free, in the next 20 seconds.
        </p>
        <button
          onClick={onCTA}
          style={{ background: G, color: "white", border: "none", borderRadius: 100, padding: "16px 36px", fontWeight: 800, fontSize: 16, cursor: "pointer", boxShadow: `0 12px 28px ${G}40`, transition: "transform 0.15s, box-shadow 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 16px 34px ${G}55`; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 12px 28px ${G}40`; }}
        >
          Get my first skill sheet, free →
        </button>
      </motion.div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer style={{ borderTop: `1px solid ${BD}`, padding: "40px 24px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 900, fontSize: 18, color: T }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundImage: "url('/quisly-mascot.png')", backgroundSize: "210%", backgroundPosition: "50% 12%", flexShrink: 0 }} />
          Quisly
        </div>
        <div style={{ display: "flex", gap: 28 }}>
          {["About", "Privacy", "Terms", "Contact"].map(l => (
            <a key={l} href="#" style={{ color: M, fontSize: 13, fontWeight: 500, textDecoration: "none" }}
              onMouseEnter={e => (e.currentTarget.style.color = T)}
              onMouseLeave={e => (e.currentTarget.style.color = M)}
            >
              {l}
            </a>
          ))}
        </div>
        <p style={{ color: "#D1D5DB", fontSize: 12, margin: 0 }}>© 2026 Quisly</p>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage({ onSignIn: _onSignIn }: { onSignIn: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [university, setUniversity] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [classRows, setClassRows] = useState<ClassRow[]>([{ name: "", fileName: "" }]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const openPhone = () => setShowModal(true);
  const toggleTopic = (t: string) => setTopics(ts => (ts.includes(t) ? ts.filter(x => x !== t) : [...ts, t]));
  const toggleGoal = (g: string) => setGoals(gs => (gs.includes(g) ? gs.filter(x => x !== g) : [...gs, g]));
  const updateClassName = (i: number, v: string) => setClassRows(rows => rows.map((r, idx) => (idx === i ? { ...r, name: v } : r)));
  const updateClassFile = (i: number, f: File | null) => setClassRows(rows => rows.map((r, idx) => (idx === i ? { ...r, fileName: f?.name ?? "" } : r)));
  const addClassRow = () => setClassRows(rows => [...rows, { name: "", fileName: "" }]);
  const removeClassRow = (i: number) => setClassRows(rows => (rows.length > 1 ? rows.filter((_, idx) => idx !== i) : rows));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          university,
          topics,
          goals,
          classes: classRows.map(r => r.name.trim()).filter(Boolean),
        }),
      });
      if (!res.ok) throw new Error("signup failed");
      setSubmitted(true);
    } catch {
      setError(true);
    }
    setLoading(false);
  };

  return (
    <div style={{ background: "#fff", color: T, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif", minHeight: "100vh", overflowX: "hidden" }}>
      <Navbar onCTA={openPhone} />
      <Bar />
      <Hero onCTA={openPhone} />
      <HowItWorks />
      <SkillSheetPreview />
      <FAQ />
      <FinalCTA onCTA={openPhone} />
      <Footer />

      {/* Phone modal */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
            onClick={e => e.stopPropagation()}
          >
            <Phone
              name={name} setName={setName}
              email={email} setEmail={setEmail}
              university={university} setUniversity={setUniversity}
              topics={topics} toggleTopic={toggleTopic}
              goals={goals} toggleGoal={toggleGoal}
              classRows={classRows} updateClassName={updateClassName} updateClassFile={updateClassFile}
              addClassRow={addClassRow} removeClassRow={removeClassRow}
              onSubmit={handleSubmit} submitted={submitted} loading={loading} error={error}
            />
          </motion.div>
        </div>
      )}
    </div>
  );
}

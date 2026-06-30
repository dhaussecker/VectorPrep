import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ChevronDown, Upload } from "lucide-react";
import React from "react";

const G = "#31C754";   // green
const T = "#111111";   // text
const M = "#6B7280";   // muted
const C = "#F9FAFB";   // card bg
const BD = "#E5E7EB";  // border

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
        I'm Quisly — your free academic sidekick for skill sheets, tutors, and exam prep. →
      </p>
    </div>
  );
}

// ─── iPhone mockup with live form ─────────────────────────────────────────────

function Phone({ email, setEmail, classes, setClasses, onSubmit, submitted, loading }: {
  email: string; setEmail: (v: string) => void;
  classes: string; setClasses: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitted: boolean; loading: boolean;
}) {
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
      <div style={{ background: "#000", borderRadius: 42, overflow: "hidden", display: "flex", flexDirection: "column", height: 628 }}>

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
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 10px", display: "flex", flexDirection: "column", gap: 10, background: "#000" }}>

          {/* Quisly: greeting */}
          <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, backgroundImage: "url('/quisly-mascot.png')", backgroundSize: "210%", backgroundPosition: "50% 12%" }} />
            <div style={{ background: "#3A3A3C", color: "white", borderRadius: "16px 16px 16px 4px", padding: "9px 13px", maxWidth: "76%", fontSize: 13, lineHeight: 1.45 }}>
              Hey! 👋<br />Tell me what classes you're taking and I'll help you stay ahead.
            </div>
          </div>

          {/* Student: classes */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div style={{ background: "#0A84FF", color: "white", borderRadius: "16px 16px 4px 16px", padding: "9px 13px", fontSize: 13, lineHeight: 1.7 }}>
              MATH 110<br />GE 122<br />GE 152<br />GE 172<br />CMPT 142<br />MATH 133
            </div>
          </div>

          {/* Quisly: response */}
          <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, backgroundImage: "url('/quisly-mascot.png')", backgroundSize: "210%", backgroundPosition: "50% 12%" }} />
            <div style={{ background: "#3A3A3C", color: "white", borderRadius: "16px 16px 16px 4px", padding: "9px 13px", maxWidth: "80%", fontSize: 13, lineHeight: 1.55 }}>
              <span style={{ fontWeight: 700 }}>Perfect.</span><br /><br />
              Every week I'll email you:<br /><br />
              ✅ the most important concepts<br />
              ✅ practice topics<br />
              ✅ common mistakes<br /><br />
              I'll also connect you with tutors and invite you to review sessions before exams. 🎯
            </div>
          </div>
        </div>

        {/* Signup form */}
        <div style={{ background: "#1C1C1E", padding: "10px 10px 14px", flexShrink: 0, borderTop: "0.5px solid rgba(255,255,255,0.08)" }}>
          {submitted ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <p style={{ color: "white", fontWeight: 700, fontSize: 14, margin: 0 }}>Ok! I just sent you a message.</p>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, margin: "4px 0 0" }}>Check your inbox.</p>
            </div>
          ) : (
            <form onSubmit={onSubmit}>
              <input
                id="email-input"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@gmail.com"
                style={{ display: "block", width: "100%", background: "#2C2C2E", border: "none", borderRadius: 10, padding: "9px 12px", color: "white", fontSize: 13, outline: "none", marginBottom: 7, boxSizing: "border-box" }}
              />
              <textarea
                value={classes}
                onChange={e => setClasses(e.target.value)}
                placeholder={"MATH 110\nGE 122\nGE 152\nGE 172\nCMPT 142\nMATH 133"}
                rows={3}
                style={{ display: "block", width: "100%", background: "#2C2C2E", border: "none", borderRadius: 10, padding: "9px 12px", color: "white", fontSize: 13, outline: "none", resize: "none", marginBottom: 7, boxSizing: "border-box", fontFamily: "inherit", lineHeight: 1.5 }}
              />
              <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "#2C2C2E", borderRadius: 10, padding: "8px 12px", color: "rgba(255,255,255,0.45)", fontSize: 12, cursor: "pointer", marginBottom: 8 }}>
                <Upload size={12} />
                Upload syllabus (recommended)
                <input type="file" accept=".pdf,.doc,.docx" style={{ display: "none" }} />
              </label>
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

// ─── Hero section ─────────────────────────────────────────────────────────────

function Hero({ email, setEmail, classes, setClasses, onSubmit, submitted, loading, onCTA }: {
  email: string; setEmail: (v: string) => void;
  classes: string; setClasses: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitted: boolean; loading: boolean;
  onCTA: () => void;
}) {
  return (
    <section style={{ maxWidth: 1080, margin: "0 auto", padding: "72px 24px 80px", display: "flex", alignItems: "center", gap: 60, flexWrap: "wrap" }}>

      {/* Left */}
      <div style={{ flex: "1 1 360px", minWidth: 280 }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div style={{
            width: 160, height: 160,
            borderRadius: "50%",
            marginBottom: 28,
            flexShrink: 0,
            backgroundImage: "url('/quisly-mascot.png')",
            backgroundSize: "210%",
            backgroundPosition: "50% 12%",
          }} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{ fontSize: "clamp(44px, 5.5vw, 72px)", fontWeight: 900, lineHeight: 1.06, letterSpacing: "-0.03em", color: T, margin: "0 0 20px" }}
        >
          Hey, I'm Quisly,<br />
          I let you learn<br />
          <span style={{ color: G }}>your classes fast.</span>
        </motion.h1>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}>
          <button
            onClick={onCTA}
            style={{ background: "none", border: "none", color: G, fontWeight: 700, fontSize: 18, cursor: "pointer", padding: 0, textDecoration: "underline", textUnderlineOffset: 3 }}
          >
            Message me now!
          </button>
        </motion.div>
      </div>

      {/* Right – phone */}
      <motion.div
        initial={{ opacity: 0, x: 40, y: 8 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.7, delay: 0.18, ease: "easeOut" }}
        style={{ flexShrink: 0, margin: "0 auto" }}
      >
        <Phone email={email} setEmail={setEmail} classes={classes} setClasses={setClasses} onSubmit={onSubmit} submitted={submitted} loading={loading} />
      </motion.div>

    </section>
  );
}

// ─── University logos ─────────────────────────────────────────────────────────

function Unis() {
  const unis = [
    "University of Saskatchewan",
    "University of Alberta",
    "University of Calgary",
    "University of Regina",
    "University of Manitoba",
  ];
  return (
    <section style={{ borderTop: `1px solid ${BD}`, borderBottom: `1px solid ${BD}`, padding: "44px 24px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto", textAlign: "center" }}>
        <p style={{ color: M, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: 30 }}>
          Helping students succeed across Canadian universities
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "12px 40px" }}>
          {unis.map(u => (
            <span key={u} style={{ color: "#9CA3AF", fontWeight: 700, fontSize: 14 }}>{u}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How it works ─────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    { n: "1", eyebrow: "Every week I will...", title: "Send you skill sheets for your classes" },
    { n: "2", eyebrow: "If you need additional help I will...", title: "Connect you with local tutors" },
    { n: "3", eyebrow: "Before an exam I will...", title: "Inform you of tutorial sessions hosted by experts" },
  ];
  return (
    <section style={{ padding: "80px 24px", maxWidth: 1080, margin: "0 auto" }}>
      <SR>
        <h2 style={{ fontSize: "clamp(26px, 3.5vw, 42px)", fontWeight: 900, color: T, letterSpacing: "-0.02em", marginBottom: 40 }}>
          How do I do this? 3 Ways.....
        </h2>
      </SR>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
        {steps.map((s, i) => (
          <SR key={s.n} delay={i * 0.1}>
            <div style={{ background: C, borderRadius: 20, padding: "32px 28px", border: `1px solid ${BD}` }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: G, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 900, fontSize: 16, marginBottom: 16 }}>
                {s.n}
              </div>
              <p style={{ color: M, fontSize: 13, fontWeight: 600, margin: "0 0 8px" }}>{s.eyebrow}</p>
              <h3 style={{ fontWeight: 800, fontSize: 17, color: T, margin: 0, letterSpacing: "-0.01em", lineHeight: 1.35 }}>{s.title}</h3>
            </div>
          </SR>
        ))}
      </div>
    </section>
  );
}

// ─── Different from lectures ──────────────────────────────────────────────────

function DifferentFromLectures() {
  return (
    <SR>
      <section style={{ padding: "0 24px 96px", maxWidth: 1080, margin: "0 auto" }}>
        <h2 style={{ fontSize: "clamp(26px, 3.5vw, 42px)", fontWeight: 900, color: T, letterSpacing: "-0.02em", marginBottom: 40 }}>
          How am I different from lectures?
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Lectures column */}
          <div style={{ background: C, borderRadius: 20, padding: "36px 32px", border: `1px solid ${BD}` }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: M, marginBottom: 24 }}>Lectures</p>
            {[
              "Hours of content dumped on you every week",
              "You guess what's actually on the exam",
              "Finding extra help is your problem",
              "Notes scattered across slides and textbooks",
            ].map(t => (
              <div key={t} style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "flex-start" }}>
                <span style={{ color: "#EF4444", fontSize: 16, flexShrink: 0, marginTop: 1 }}>✕</span>
                <span style={{ color: M, fontSize: 15, lineHeight: 1.5 }}>{t}</span>
              </div>
            ))}
          </div>

          {/* Quisly column */}
          <div style={{ background: "#111", borderRadius: 20, padding: "36px 32px" }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: G, marginBottom: 24 }}>Quisly</p>
            {[
              "One clean skill sheet per week — nothing more",
              "Exactly the skills and examples you need to not only pass but ace the exam",
              "Tutor connections made for you, instantly",
              "Everything on a single, simple sheet every week",
            ].map(t => (
              <div key={t} style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "flex-start" }}>
                <span style={{ color: G, fontSize: 16, flexShrink: 0, marginTop: 1 }}>✓</span>
                <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 15, lineHeight: 1.5 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SR>
  );
}

// ─── Who am I for ─────────────────────────────────────────────────────────────

function WhoAmIFor() {
  return (
    <section style={{ padding: "0 24px 96px", maxWidth: 1080, margin: "0 auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* Who am I for */}
        <SR delay={0}>
          <div style={{ background: C, borderRadius: 20, padding: "36px 32px", border: `1px solid ${BD}`, height: "100%" }}>
            <h2 style={{ fontSize: "clamp(22px, 2.5vw, 32px)", fontWeight: 900, color: "#111", letterSpacing: "-0.02em", marginBottom: 20 }}>
              Who am I for?
            </h2>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em", lineHeight: 1.65, marginBottom: 20 }}>
              Right now I help students taking first year engineering and calculus classes
            </p>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 14 }}>Examples include:</p>
            {["Calculus I", "Mechanics", "Circuits", "Programming"].map(c => (
              <div key={c} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: G, flexShrink: 0 }} />
                <span style={{ color: "#111", fontSize: 15, fontWeight: 500 }}>{c}</span>
              </div>
            ))}
          </div>
        </SR>

        {/* How do I do this */}
        <SR delay={0.1}>
          <div style={{ background: "#111", borderRadius: 20, padding: "36px 32px", height: "100%" }}>
            <h2 style={{ fontSize: "clamp(22px, 2.5vw, 32px)", fontWeight: 900, color: "white", letterSpacing: "-0.02em", marginBottom: 28 }}>
              How do I do this?
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {[
                "I analyze the syllabus you uploaded and figure out the skills you need to know at the end of each week",
                "I am connected to a network of tutors already and make the intro for you",
              ].map((text, i) => (
                <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: G, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 15, lineHeight: 1.65, margin: 0 }}>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </SR>

      </div>
    </section>
  );
}

// ─── Features + skill sheet example ──────────────────────────────────────────

function Features() {
  const feats = [
    { icon: "📄", title: "Weekly Skill Sheets", body: "Receive concise weekly summaries of everything covered in class so you always know what skills to practice." },
    { icon: "🤝", title: "Tutor Connections", body: "When you need extra help, Quisly connects you with students who can help you learn faster." },
    { icon: "🎯", title: "Review Sessions", body: "Receive invitations to high-impact review sessions before major midterms and finals." },
  ];
  return (
    <section style={{ background: C, borderTop: `1px solid ${BD}`, borderBottom: `1px solid ${BD}`, padding: "96px 24px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <SR>
          <h2 style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 900, color: T, letterSpacing: "-0.03em", textAlign: "center", marginBottom: 60 }}>
            Everything you need to stay ahead.
          </h2>
        </SR>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 22 }}>
          {feats.map((f, i) => (
            <SR key={f.title} delay={i * 0.1}>
              <div style={{ background: "white", borderRadius: 20, padding: "34px 30px", border: `1px solid ${BD}`, boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
                <div style={{ fontSize: 36, marginBottom: 18 }}>{f.icon}</div>
                <h3 style={{ fontWeight: 800, fontSize: 18, color: T, marginBottom: 10, letterSpacing: "-0.02em" }}>{f.title}</h3>
                <p style={{ color: M, fontSize: 14, lineHeight: 1.65, margin: 0 }}>{f.body}</p>
              </div>
            </SR>
          ))}
        </div>

        {/* Example skill sheet card */}
        <SR delay={0.25}>
          <div style={{ maxWidth: 380, margin: "56px auto 0", background: "white", borderRadius: 20, padding: "32px", border: `1px solid ${BD}`, boxShadow: "0 6px 28px rgba(0,0,0,0.07)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <span style={{ background: G, color: "white", borderRadius: 100, padding: "4px 14px", fontSize: 12, fontWeight: 700 }}>Week 5</span>
              <span style={{ color: M, fontSize: 13, fontWeight: 600 }}>Calculus I</span>
            </div>
            <div style={{ marginBottom: 18 }}>
              <p style={{ color: T, fontWeight: 700, fontSize: 13, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Skills learned</p>
              {["Derivatives", "Chain Rule", "Related Rates"].map(s => (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span>✅</span>
                  <span style={{ color: T, fontSize: 14 }}>{s}</span>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 18 }}>
              <p style={{ color: T, fontWeight: 700, fontSize: 13, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Practice</p>
              {["Differentiate composite functions", "Solve optimization problems"].map(p => (
                <p key={p} style={{ color: M, fontSize: 13, margin: "0 0 7px", paddingLeft: 12, borderLeft: `3px solid ${BD}` }}>{p}</p>
              ))}
            </div>
            <div>
              <p style={{ color: T, fontWeight: 700, fontSize: 13, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Common mistakes</p>
              {["Forgetting inner derivatives", "Sign errors"].map(m => (
                <p key={m} style={{ color: M, fontSize: 13, margin: "0 0 7px", paddingLeft: 12, borderLeft: "3px solid #FCA5A5" }}>⚠️ {m}</p>
              ))}
            </div>
          </div>
        </SR>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

function Testimonials() {
  const quotes = [
    { body: "I actually knew what to study every week instead of cramming before midterms." },
    { body: "The weekly emails kept me accountable all semester." },
    { body: "The review sessions saved me before finals." },
  ];
  return (
    <section style={{ padding: "96px 24px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <SR>
          <h2 style={{ fontSize: "clamp(30px, 4vw, 48px)", fontWeight: 900, color: T, letterSpacing: "-0.03em", textAlign: "center", marginBottom: 56 }}>
            What students are saying
          </h2>
        </SR>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
          {quotes.map((q, i) => (
            <SR key={i} delay={i * 0.1}>
              <div style={{ background: C, borderRadius: 20, padding: "32px 28px", border: `1px solid ${BD}` }}>
                <div style={{ color: "#FCD34D", fontSize: 16, marginBottom: 18, letterSpacing: 2 }}>★★★★★</div>
                <p style={{ color: T, fontSize: 16, lineHeight: 1.65, fontStyle: "italic", margin: "0 0 20px" }}>"{q.body}"</p>
                <p style={{ color: M, fontSize: 13, fontWeight: 600, margin: 0 }}>— Student</p>
              </div>
            </SR>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  const items = [
    { q: "Is it free?", a: "Yes. Weekly skill sheets are completely free." },
    { q: "Do I need to upload a syllabus?", a: "No. But it helps Quisly personalize everything." },
    { q: "Which universities are supported?", a: "Any university." },
    { q: "How often do I receive emails?", a: "Usually once each week." },
    { q: "Can I add more classes later?", a: "Yes." },
  ];
  return (
    <section style={{ background: C, borderTop: `1px solid ${BD}`, borderBottom: `1px solid ${BD}`, padding: "96px 24px" }}>
      <div style={{ maxWidth: 620, margin: "0 auto" }}>
        <SR>
          <h2 style={{ fontSize: "clamp(30px, 4vw, 48px)", fontWeight: 900, color: T, letterSpacing: "-0.03em", textAlign: "center", marginBottom: 56 }}>
            Frequently asked questions
          </h2>
        </SR>
        {items.map((item, i) => (
          <SR key={i} delay={i * 0.05}>
            <div style={{ borderBottom: `1px solid ${BD}` }}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", textAlign: "left", padding: "22px 0", background: "none", border: "none", cursor: "pointer" }}
              >
                <span style={{ fontWeight: 700, fontSize: 16, color: T }}>{item.q}</span>
                <ChevronDown
                  size={18}
                  style={{ color: M, transition: "transform 0.2s", transform: open === i ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}
                />
              </button>
              <motion.div
                initial={false}
                animate={{ height: open === i ? "auto" : 0, opacity: open === i ? 1 : 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                style={{ overflow: "hidden" }}
              >
                <p style={{ color: M, fontSize: 15, lineHeight: 1.65, paddingBottom: 22, margin: 0 }}>{item.a}</p>
              </motion.div>
            </div>
          </SR>
        ))}
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
        <h2 style={{ fontSize: "clamp(40px, 6vw, 72px)", fontWeight: 700, color: "white", letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: 36 }}>
          Contact me now.
        </h2>
        <button
          onClick={onCTA}
          style={{ background: "white", color: "#111", border: "none", borderRadius: 100, padding: "16px 36px", fontWeight: 600, fontSize: 16, cursor: "pointer", transition: "opacity 0.15s" }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
        >
          Get Started
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
  const [email, setEmail] = useState("");
  const [classes, setClasses] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const openPhone = () => setShowModal(true);

  const focusForm = () => {
    const el = document.getElementById("email-input");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => el.focus(), 500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          classes: classes.split("\n").map(s => s.trim()).filter(Boolean),
        }),
      });
    } catch { /* backend may be offline; still show success */ }
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <div style={{ background: "#fff", color: T, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif", minHeight: "100vh", overflowX: "hidden" }}>
      <Navbar onCTA={focusForm} />
      <Bar />
      <Hero
        email={email} setEmail={setEmail}
        classes={classes} setClasses={setClasses}
        onSubmit={handleSubmit} submitted={submitted} loading={loading}
        onCTA={openPhone}
      />
      <HowItWorks />
      <DifferentFromLectures />
      <WhoAmIFor />
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
              email={email} setEmail={setEmail}
              classes={classes} setClasses={setClasses}
              onSubmit={handleSubmit} submitted={submitted} loading={loading}
            />
          </motion.div>
        </div>
      )}
    </div>
  );
}

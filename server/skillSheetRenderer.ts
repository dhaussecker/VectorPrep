import fs from "fs";
import path from "path";
import { createRequire } from "module";
import katex from "katex";

// esbuild empties `import.meta` in CJS builds, so createRequire(import.meta.url)
// throws there — fall back to it only when a native `require` isn't already in
// scope (real ESM, e.g. dev mode via tsx or the ESM Vercel function build).
const nodeRequire: NodeRequire = typeof require !== "undefined" ? require : createRequire(import.meta.url);

// ─── Brand tokens (ported from build.js) ───────────────────────────────────
const BRAND = {
  pageBg: "#ffffff",
  cardBg: "#fafafa",
  cardBorder: "#e0e0e0",
  overviewBg: "#e8f5ee",
  green: "#1a7a4a",
  ink: "#111111",
  textBody: "#333333",
  textMuted: "#666666",
  divider: "#e0e0e0",
  formulaBg: "#f0f8f4",
  formulaBorder: "#a8d5bc",
  graphBg: "#f5f5f5",
  recallBg: "#fffbea",
  recallBorder: "#e0c84a",
  recallLabel: "#9a7c00",
};

// ─── Self-contained KaTeX CSS (fonts inlined as base64) ────────────────────
// Computed once and cached — the rendered HTML is sent to a remote rendering
// API with no access to our filesystem, so every asset must be inlined.
let cachedKatexCss: string | null = null;
function getInlinedKatexCss(): string {
  if (cachedKatexCss) return cachedKatexCss;
  const cssPath = nodeRequire.resolve("katex/dist/katex.min.css");
  const fontsDir = path.join(path.dirname(cssPath), "fonts");
  let css = fs.readFileSync(cssPath, "utf-8");
  css = css.replace(/url\(fonts\/([^)]+\.(woff2|woff|ttf))\)/g, (_match, filename, ext) => {
    const fontPath = path.join(fontsDir, filename);
    const mime = ext === "woff2" ? "font/woff2" : ext === "woff" ? "font/woff" : "font/ttf";
    const base64 = fs.readFileSync(fontPath).toString("base64");
    return `url(data:${mime};base64,${base64})`;
  });
  cachedKatexCss = css;
  return css;
}

// ─── KaTeX helpers ──────────────────────────────────────────────────────────
function mathHTML(latex: string, displayMode = false): string {
  return katex.renderToString(latex, { throwOnError: false, displayMode });
}

function renderInlineMixed(str: string): string {
  return str
    .split(/(\$[^$]+\$)/g)
    .map(p => (p.startsWith("$") && p.endsWith("$") ? mathHTML(p.slice(1, -1), false) : escapeHtml(p)))
    .join("");
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ─── Types (matches the shape of Dylan's local build.js content files) ─────
export type SkillSheetSkill = {
  number: number;
  title: string;
  notes?: boolean;
  numbered?: boolean;
  formula?: string;
  recall?: string;
  recallExtra?: string;
  recallExample?: string;
  graph?: string;
  note?: string;
  steps: string[];
  example: { heading: string; mathLines: string[]; answer?: string | null };
};

export type WorkedExample = {
  title: string;
  subtitle: string;
  problem: string;
  steps: { label: string; rule: string; lines: string[] }[];
  answer: string;
};

export type SkillSheetContent = {
  COURSE?: string;
  SHEET_TITLE: string;
  SHEET_SUBTITLE?: string;
  COLUMNS?: number;
  OVERVIEW?: { label: string; text: string }[] | string;
  SKILLS: SkillSheetSkill[];
  WORKED_EXAMPLE?: WorkedExample;
  WORKED_EXAMPLES?: WorkedExample[];
};

// ─── Card builder ────────────────────────────────────────────────────────────
function buildSkillCard(skill: SkillSheetSkill): string {
  const stepItems = skill.steps
    .map(
      (s, i) => `
    <div class="step">
      <span class="step-num">${skill.notes ? "&middot;" : `${i + 1}.`}</span>
      <span class="step-text">${renderInlineMixed(s)}</span>
    </div>`,
    )
    .join("");
  const stepsHTML = skill.notes || skill.numbered
    ? `<div class="steps">${stepItems}</div>`
    : `<div class="steps steps-box">${stepItems}</div>`;

  const exampleLinesHTML = skill.example.mathLines.map(line => `<div class="math-line">${mathHTML(line, false)}</div>`).join("");
  const answerHTML = skill.example.answer ? `<div class="math-answer">${mathHTML(skill.example.answer, false)}</div>` : "";

  if (skill.graph) console.warn(`[skill-sheet-render] Skipping graph "${skill.graph}" — no graph image storage wired up yet`);
  const graphHTML = "";

  const formulaHTML = skill.formula ? `<div class="skill-formula">${mathHTML(skill.formula, true)}</div>` : "";

  const recallHTML = skill.recall
    ? `<div class="recall-box">
        <div class="recall-label">Recall</div>
        <div class="recall-math">${mathHTML(skill.recall, false)}</div>
        ${skill.recallExtra ? `<div class="recall-extra">${mathHTML(skill.recallExtra, false)}</div>` : ""}
        ${skill.recallExample ? `<div class="recall-example">${mathHTML(skill.recallExample, false)}</div>` : ""}
       </div>`
    : "";

  const noteHTML = skill.note ? `<div class="skill-note">${renderInlineMixed(skill.note)}</div>` : "";

  return `
    <td class="skillcell" valign="top">
      <div class="badge">${skill.number}</div>
      <div class="card-title">${escapeHtml(skill.title)}</div>
      ${formulaHTML}
      ${recallHTML}
      ${stepsHTML}
      ${noteHTML}
      <div class="divider"></div>
      <div class="example-heading">${renderInlineMixed(skill.example.heading)}</div>
      <div class="example-block">
        ${exampleLinesHTML}
        ${answerHTML}
      </div>
      ${graphHTML}
    </td>`;
}

function buildSkillRows(skills: SkillSheetSkill[], cols?: number): string {
  const nCols = cols || (skills.length > 6 ? 4 : 3);
  const rows: string[] = [];
  for (let i = 0; i < skills.length; i += nCols) {
    const row: (SkillSheetSkill | null)[] = skills.slice(i, i + nCols);
    while (row.length < nCols) row.push(null);
    const cells = row.map(s => (s ? buildSkillCard(s) : `<td class="skillcell empty"></td>`)).join("");
    rows.push(`<tr>${cells}</tr>`);
  }
  return rows.join("\n");
}

function buildOverview(overview: SkillSheetContent["OVERVIEW"]): string {
  if (!overview) return "";
  const bodyHTML = Array.isArray(overview)
    ? overview
        .map(
          item => `
        <div class="overview-line">
          <span class="overview-label">${escapeHtml(item.label)}:</span>
          <span class="overview-text">${renderInlineMixed(item.text)}</span>
        </div>`,
        )
        .join("")
    : `<div class="overview-line">${renderInlineMixed(overview)}</div>`;
  return `
    <div class="page-overview">
      <div class="page-overview-kicker">SUMMARY</div>
      ${bodyHTML}
    </div>`;
}

function buildWorkedExample(we: WorkedExample | undefined): string {
  if (!we) return "";
  const stepsHTML = we.steps
    .map(
      (step, i) => `
    <div class="we-step">
      <div class="we-step-header">
        <span class="we-step-num">${i + 1}</span>
        <span class="we-step-label">${renderInlineMixed(step.label)}</span>
        <span class="we-step-rule">${renderInlineMixed(step.rule)}</span>
      </div>
      <div class="we-step-lines">
        ${step.lines.map(l => `<div class="we-line">${mathHTML(l, false)}</div>`).join("")}
      </div>
    </div>
  `,
    )
    .join("");

  return `
    <div class="we-page">
      <div class="we-header">
        <div class="we-title">${escapeHtml(we.title)}</div>
        <div class="we-subtitle">${escapeHtml(we.subtitle)}</div>
      </div>
      <div class="we-problem-box">
        <div class="we-problem-label">Differentiate</div>
        <div class="we-problem">${mathHTML(we.problem, true)}</div>
      </div>
      <div class="we-steps">${stepsHTML}</div>
      <div class="we-answer-box">
        <div class="we-answer-label">Final Answer</div>
        <div class="we-answer">${mathHTML(we.answer, true)}</div>
      </div>
    </div>
  `;
}

// ─── Page assembly ───────────────────────────────────────────────────────────
export function buildSkillSheetHtml(content: SkillSheetContent): string {
  const { SHEET_TITLE, SHEET_SUBTITLE, SKILLS, OVERVIEW, COURSE, COLUMNS, WORKED_EXAMPLES = [] } = content;
  const katexCss = getInlinedKatexCss();

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  ${katexCss}

  * { box-sizing:border-box; margin:0; padding:0; }

  body {
    background: ${BRAND.pageBg};
    font-family: sans-serif;
    color: ${BRAND.textBody};
    padding: 11px 27px 6px 27px;
  }

  .header { margin-bottom: 9px; }
  .header-topbar { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
  .logo-text { font-weight: 800; font-size: 17px; color: ${BRAND.ink}; vertical-align: middle; }
  .header-course {
    text-align: right; font-size: 10px; font-weight: 600; letter-spacing: 0.08em;
    text-transform: uppercase; color: ${BRAND.textMuted}; vertical-align: middle;
  }

  .header-rule { height: 3px; background: ${BRAND.green}; border-radius: 2px; margin-bottom: 9px; }
  .header-rule-thin { height: 1px; background: ${BRAND.cardBorder}; margin: 6px 0 7px 0; }

  .header-title-row { width: 100%; border-collapse: collapse; }
  .header-title { font-size: 25px; font-weight: 800; color: ${BRAND.ink}; letter-spacing: -0.02em; line-height: 1.15; vertical-align: bottom; }
  .header-tag {
    text-align: right; vertical-align: bottom; font-size: 11px; font-weight: 700;
    color: ${BRAND.green}; letter-spacing: 0.08em; text-transform: uppercase; padding-bottom: 2px;
  }

  .page-overview {
    background: ${BRAND.overviewBg}; border: 1.5px solid ${BRAND.cardBorder}; border-left: 4px solid ${BRAND.green};
    border-radius: 7px; padding: 7px 13px; margin-bottom: 0;
  }
  .page-overview-kicker {
    display: block; color: ${BRAND.green}; font-weight: 700; font-size: 9px;
    letter-spacing: 0.13em; text-transform: uppercase; margin-bottom: 4px;
  }
  .overview-line { font-size: 12.5px; line-height: 1.55; color: ${BRAND.textBody}; display: block; margin-bottom: 2px; }
  .overview-line:last-child { margin-bottom: 0; }
  .overview-label { color: ${BRAND.ink}; font-weight: 700; margin-right: 3px; }

  .skillgrid { width: 100%; border-collapse: separate; border-spacing: 8px 8px; margin-left: -8px; }
  .skillcell {
    width: auto; vertical-align: top; background: ${BRAND.cardBg}; border: 1.5px solid ${BRAND.cardBorder};
    border-radius: 10px; padding: 11px 13px 12px 13px;
  }
  .skillcell.empty { background: none; border: none; }

  .badge {
    display: inline-block; background: ${BRAND.green}; color: #ffffff; font-weight: 800; font-size: 11px;
    width: 19px; height: 19px; line-height: 19px; text-align: center; border-radius: 5px; margin-bottom: 9px;
  }

  .card-title { color: ${BRAND.ink}; font-weight: 700; font-size: 14.5px; line-height: 1.25; margin-bottom: 8px; }

  .skill-formula {
    background: ${BRAND.formulaBg}; border: 1px solid ${BRAND.formulaBorder}; border-radius: 6px;
    padding: 6px 10px; margin-bottom: 4px; text-align: center;
  }
  .skill-formula .katex { color: ${BRAND.ink}; font-size: 1.05em; }

  .recall-box { background: ${BRAND.recallBg}; border: 1px solid ${BRAND.recallBorder}; border-radius: 5px; padding: 5px 9px; margin-bottom: 4px; }
  .recall-label { color: ${BRAND.recallLabel}; font-weight: 700; font-size: 8.5px; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 3px; }
  .recall-math .katex { font-size: 0.88em; color: ${BRAND.textBody}; }
  .recall-extra { margin-top: 4px; padding-top: 4px; border-top: 1px dashed ${BRAND.recallBorder}; }
  .recall-extra .katex { font-size: 0.88em; color: ${BRAND.textMuted}; }
  .recall-example { margin-top: 3px; }
  .recall-example .katex { font-size: 0.88em; color: ${BRAND.textMuted}; }

  .skill-note {
    background: #f5f5f5; border-left: 3px solid ${BRAND.cardBorder}; border-radius: 4px;
    padding: 4px 8px; margin-top: 4px; font-size: 11px; color: ${BRAND.textMuted};
  }
  .skill-note .katex { font-size: 0.9em; }

  .steps { margin-bottom: 4px; }
  .steps-box { background: #e8f5ee; border: 1.5px solid ${BRAND.green}; border-radius: 6px; padding: 7px 10px; margin-bottom: 6px; }
  .steps-box .step-num { color: ${BRAND.green}; }
  .step { font-size: 12.5px; line-height: 1.5; margin-bottom: 4px; color: ${BRAND.textBody}; }
  .step-num { color: ${BRAND.green}; font-weight: 700; margin-right: 4px; }
  .step-text .katex { font-size: 0.93em; color: ${BRAND.textBody}; }

  .divider { border-top: 1px dashed ${BRAND.divider}; margin: 7px 0 6px 0; }

  .example-heading { font-style: italic; font-size: 11.5px; color: ${BRAND.textMuted}; margin-bottom: 4px; }
  .example-heading .katex { font-size: 0.93em; color: ${BRAND.textMuted}; }
  .math-line { margin-bottom: 4px; }
  .math-line .katex { color: ${BRAND.textBody}; font-size: 0.95em; }
  .math-answer { margin-top: 5px; }
  .math-answer .katex { color: ${BRAND.green}; font-weight: 700; font-size: 1.05em; }

  .we-page { page-break-before: always; padding: 14px 28px 10px 28px; }
  .we-header { border-bottom: 3px solid ${BRAND.green}; padding-bottom: 8px; margin-bottom: 12px; }
  .we-title { font-size: 20px; font-weight: 800; color: ${BRAND.ink}; letter-spacing: -0.01em; }
  .we-subtitle { font-size: 11px; color: ${BRAND.textMuted}; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; margin-top: 3px; }

  .we-problem-box {
    background: ${BRAND.formulaBg}; border: 1.5px solid ${BRAND.formulaBorder}; border-radius: 8px;
    padding: 12px 20px; margin-bottom: 16px; text-align: center;
  }
  .we-problem-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: ${BRAND.green}; margin-bottom: 6px; }
  .we-problem .katex { font-size: 1.3em; color: ${BRAND.ink}; }

  .we-steps { display: block; }
  .we-step { border-left: 3px solid ${BRAND.green}; padding: 10px 14px; margin-bottom: 10px; background: ${BRAND.cardBg}; border-radius: 0 7px 7px 0; }
  .we-step-header { display: flex; align-items: baseline; gap: 10px; margin-bottom: 7px; flex-wrap: wrap; }
  .we-step-num {
    background: ${BRAND.green}; color: #fff; font-weight: 800; font-size: 11px; width: 20px; height: 20px;
    line-height: 20px; text-align: center; border-radius: 4px; flex-shrink: 0;
  }
  .we-step-label { font-size: 13px; font-weight: 700; color: ${BRAND.ink}; }
  .we-step-rule { font-size: 11px; color: ${BRAND.textMuted}; font-style: italic; }
  .we-step-rule .katex { font-size: 0.95em; color: ${BRAND.textMuted}; }
  .we-step-label .katex { font-size: 0.95em; color: ${BRAND.ink}; }

  .we-line { margin-bottom: 5px; padding-left: 30px; }
  .we-line .katex { font-size: 1.05em; color: ${BRAND.textBody}; }

  .we-answer-box { background: ${BRAND.overviewBg}; border: 2px solid ${BRAND.green}; border-radius: 8px; padding: 12px 20px; margin-top: 14px; text-align: center; }
  .we-answer-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: ${BRAND.green}; margin-bottom: 6px; }
  .we-answer .katex { font-size: 1.3em; color: ${BRAND.green}; font-weight: 700; }

  .footer { margin-top: 5px; padding-top: 4px; border-top: 1px solid ${BRAND.cardBorder}; }
  .footer table { width: 100%; border-collapse: collapse; }
  .footer-left { font-size: 11.5px; color: ${BRAND.textMuted}; vertical-align: middle; }
  .footer-name { font-weight: 700; color: ${BRAND.ink}; }
  .footer-right { text-align: right; font-size: 11.5px; color: ${BRAND.textMuted}; vertical-align: middle; }

  .katex { color: inherit; }
</style>
</head>
<body>

  <div class="header">
    <table class="header-topbar"><tr>
      <td class="logo-text">Quisly</td>
      <td class="header-course">${COURSE ? escapeHtml(COURSE) : ""}</td>
    </tr></table>

    <div class="header-rule"></div>

    <table class="header-title-row"><tr>
      <td class="header-title">${escapeHtml(SHEET_TITLE)}</td>
      <td class="header-tag">${SHEET_SUBTITLE ? escapeHtml(SHEET_SUBTITLE) : ""}</td>
    </tr></table>

    <div class="header-rule-thin"></div>

    ${buildOverview(OVERVIEW)}
  </div>

  <table class="skillgrid">
    ${buildSkillRows(SKILLS, COLUMNS)}
  </table>

  <div class="footer">
    <table><tr>
      <td class="footer-left"><span class="footer-name">Quisly</span> &nbsp;&middot;&nbsp; your academic sidekick</td>
      <td class="footer-right">quisly.ca</td>
    </tr></table>
  </div>

  ${WORKED_EXAMPLES.map(we => buildWorkedExample(we)).join("")}
</body>
</html>`;
}

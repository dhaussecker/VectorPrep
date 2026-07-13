export interface CourseStructure {
  courseName: string;
  courseDescription: string;
  courseIcon: string;
  topics: {
    name: string;
    description: string;
    icon: string;
    skills: {
      title: string;
      content?: string;
    }[];
  }[];
}

// Outline only (no lesson content) — the admin reviews/edits this before
// generateSkillContent (a separate call per skill, its own token budget)
// fills in real content in the next step. This prompt used to also ask for
// full lesson content inline, which threw away that split: content was
// regenerated from scratch in step 2 anyway, so the inline content was
// always discarded, and asking for it here blew past max_tokens (hard
// truncation, invalid JSON) on any syllabus with more than a few skills.
const SYSTEM_PROMPT = `You are an expert course designer. Given the content of uploaded syllabi, lecture notes, or practice exams, extract a structured course outline.

Return ONLY valid JSON (no markdown fences) matching this exact schema:
{
  "courseName": "string - concise course title",
  "courseDescription": "string - 1-2 sentence description",
  "courseIcon": "string - single emoji representing the course",
  "topics": [
    {
      "name": "string - topic name",
      "description": "string - brief topic description",
      "icon": "string - single emoji or short symbol",
      "skills": [
        {
          "title": "string - skill/concept name, short and specific (3-8 words)"
        }
      ]
    }
  ]
}

Guidelines:
- Create meaningful topics grouping related concepts
- Each topic should have 2-6 skills/learn cards
- Do not include lesson content — titles only. Content is generated separately per skill later.
- Use the document structure (chapters, sections, problem sets) to inform topic organization
- If the document is a practice exam, infer topics from the question categories
- If the document is lecture notes, organize by the lecture's natural sections`;

async function callDeepSeek(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 8192,
  temperature = 0.3,
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY environment variable is not set");
  }

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`DeepSeek API error (${response.status}): ${errBody}`);
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) {
    throw new Error("No response content from DeepSeek API");
  }
  return raw;
}

export async function generateSkillContent(
  courseName: string,
  topicName: string,
  skillTitle: string,
  siblingSkills: string[],
  groundingText?: string,
): Promise<string> {
  const systemPrompt = `You are an expert educator creating detailed lesson content. Write thorough educational content in Markdown with LaTeX math (use $...$ for inline, $$...$$ for display).

Include:
- Clear definitions of key concepts
- Important formulas with explanations
- Worked examples with step-by-step solutions
- Common mistakes and tips
- Brief summary

Be thorough — this is the student's primary learning material. Use proper markdown headings, bullet points, and formatting.${
    groundingText
      ? " Source material from the actual class (syllabus/lecture notes) is provided below — match its notation, emphasis, and any specific examples or terminology the instructor uses, rather than writing generic content. If the source material doesn't cover this skill in detail, fall back to standard course-level treatment of the topic."
      : ""
  }`;

  const userMessage = `Create detailed lesson content for:
Course: ${courseName}
Topic: ${topicName}
Skill: ${skillTitle}

Other skills in this topic (for context, don't repeat their content): ${siblingSkills.join(", ")}${
    groundingText ? `\n\nSource material from this class:\n${groundingText}` : ""
  }`;

  return callDeepSeek(systemPrompt, userMessage, 4096, 0.4);
}

export interface SheetSkillCard {
  number: number;
  title: string;
  formula?: string;
  steps: string[];
  example: { heading: string; mathLines: string[]; answer?: string | null };
}

// Compresses full lesson content (written for in-app reading, one skill at a
// time) into the terse skill-sheet card format used by the weekly PDF
// pipeline — a handful of steps and one worked example per card, not the
// full lesson. This is a distinct transform from generateSkillContent, not a
// truncation of it: the sheet is meant to be a one-page-per-topic reference,
// not the lesson itself.
export async function restructureSkillsForSheet(
  courseName: string,
  topicName: string,
  skills: { title: string; content: string }[],
): Promise<SheetSkillCard[]> {
  const systemPrompt = `You are compressing full lesson content into a terse skill-sheet card format — a one-page-per-topic study reference, not the lesson itself.

Return ONLY valid JSON (no markdown fences) as an array, one entry per skill given, in the same order:
[
  {
    "number": 1,
    "title": "string - skill title, as given",
    "formula": "string or omit - the single most important LaTeX formula for this skill, if there is one (no $ delimiters, raw LaTeX)",
    "steps": ["string - short step, no LaTeX delimiters needed inline but LaTeX syntax is fine", "..."],
    "example": {
      "heading": "string - e.g. 'Example' or a short problem description",
      "mathLines": ["string - one line of raw LaTeX per array entry, building up the worked example"],
      "answer": "string or null - final answer as raw LaTeX, if applicable"
    }
  }
]

Rules:
- 3-5 steps per skill, each under 12 words — this is a quick-reference card, not a tutorial
- The example should be short — 2-4 math lines max, drawn from or representative of the source content
- Omit "formula" entirely if the skill doesn't center on one specific formula
- LaTeX strings should NOT include $ or $$ delimiters — just the raw LaTeX`;

  const userMessage = `Course: ${courseName}
Topic: ${topicName}

Skills (full lesson content to compress):
${skills.map((s, i) => `--- Skill ${i + 1}: ${s.title} ---\n${s.content}`).join("\n\n")}`;

  const raw = await callDeepSeek(systemPrompt, userMessage, 4096, 0.2);
  const jsonStr = raw.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "").trim();
  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) throw new Error("not array");
    return parsed as SheetSkillCard[];
  } catch (err) {
    throw new Error(`Failed to parse skill-sheet restructuring: ${err instanceof Error ? err.message : err}`);
  }
}

export async function chatRefineContent(
  currentContent: string,
  userMessage: string,
  context?: string,
): Promise<string> {
  const systemPrompt = `You are an AI assistant helping refine educational content. The user will give you existing lesson content and a request. Return the FULL updated content (not just the changes). Keep the same Markdown + LaTeX format. Do not wrap in code fences.`;

  const prompt = `${context ? `Context: ${context}\n\n` : ""}Current content:\n${currentContent}\n\nUser request: ${userMessage}\n\nReturn the full updated content:`;

  return callDeepSeek(systemPrompt, prompt, 4096, 0.4);
}

export async function generateStudyPlan(
  courseName: string,
  topics: { name: string; skillCount: number }[],
  totalDays: number,
): Promise<any[]> {
  const systemPrompt = `You are a study planner. Given a course with topics and a number of study days, create an optimal study plan.

Return ONLY valid JSON (no markdown fences) as an array:
[
  {
    "day": 1,
    "topics": [
      { "topicName": "string", "skills": ["skill1", "skill2"], "estimatedHours": 1.5 }
    ],
    "totalHours": 1.5
  }
]

Distribute topics evenly. Earlier days should cover foundational topics. Each day should have 1-3 hours of study. Group related topics together.`;

  const topicList = topics.map((t) => `${t.name} (${t.skillCount} skills)`).join("\n");
  const userMessage = `Course: ${courseName}\nTotal study days: ${totalDays}\n\nTopics:\n${topicList}`;

  const raw = await callDeepSeek(systemPrompt, userMessage, 4096, 0.3);
  const jsonStr = raw.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "").trim();
  return JSON.parse(jsonStr);
}

export interface ProgramCourse {
  name: string;
  code: string;
  description: string;
}

export async function generateProgramCourses(program: string): Promise<ProgramCourse[]> {
  const systemPrompt = `You are a university academic advisor with extensive knowledge of university programs worldwide. Given a program description, return a JSON array of courses typically offered in that program.

Return ONLY valid JSON (no markdown fences) as an array:
[
  {
    "name": "Full Course Name",
    "code": "DEPT 101",
    "description": "One sentence description of what the course covers"
  }
]

Guidelines:
- Return 8-16 courses typical for that program and year level
- Include core required courses for that program
- Use real course codes and names from that university if you know them, otherwise use realistic typical codes
- Order from most foundational to more advanced
- If year is mentioned, focus on courses for that year`;

  const raw = await callDeepSeek(systemPrompt, `Program: ${program}`, 2048, 0.3);
  const jsonStr = raw.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "").trim();
  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) throw new Error("Not an array");
    return parsed as ProgramCourse[];
  } catch {
    throw new Error("Failed to parse program courses from AI response");
  }
}

export interface SyllabusUnit {
  name: string;
  outcomes: string[];
  matchedToolIds: string[];
}

export async function extractAndMatchSyllabus(
  syllabusText: string,
  platformTools: { id: string; name: string; description: string }[],
): Promise<SyllabusUnit[]> {
  const toolList = platformTools
    .slice(0, 60)
    .map((t) => `ID:${t.id} | ${t.name}: ${t.description}`)
    .join("\n");

  const systemPrompt = `You are an academic advisor analyzing a course syllabus. Extract each unit/week and its learning outcomes, then match them to the most relevant platform topics.

Return ONLY valid JSON (no markdown fences) as an array:
[
  {
    "name": "string - unit or week name (e.g. Week 1: Introduction)",
    "outcomes": ["string - specific learning outcome"],
    "matchedToolIds": ["tool-id"]
  }
]

Rules:
- Extract 1 entry per week/unit/chapter from the syllabus
- Keep outcomes concise and specific (max 4 per unit)
- Match each unit to 1-3 platform tool IDs that best cover those outcomes
- Only use IDs from the provided list; use empty array if no good match
- Return at most 12 units`;

  const userMessage = `Syllabus:\n${syllabusText.slice(0, 6000)}\n\nPlatform topics:\n${toolList}\n\nExtract units and match to platform topics.`;

  const raw = await callDeepSeek(systemPrompt, userMessage, 3000, 0.2);
  const jsonStr = raw.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "").trim();
  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) throw new Error("not array");
    return parsed as SyllabusUnit[];
  } catch {
    throw new Error("Failed to parse syllabus analysis");
  }
}

export interface SyllabusTopic {
  number: number;
  title: string;
  description: string;
  weekLabel: string;
  startDate: string | null;
  endDate: string | null;
}

export async function extractSyllabusTimeline(syllabusText: string): Promise<SyllabusTopic[]> {
  const systemPrompt = `You are an academic administrator analyzing a course syllabus. Extract each numbered topic/unit (e.g. RLO, Module, Chapter, Week-topic) along with the calendar dates when that topic is covered, using the syllabus's schedule/timeline section.

Return ONLY valid JSON (no markdown fences) as an array:
[
  {
    "number": 1,
    "title": "string - topic name, without its number prefix (e.g. \\"Basic Differentiation and Integration\\")",
    "description": "string - 1-2 sentence summary of what the topic covers, from the learning outcomes section",
    "weekLabel": "string - the week/date label exactly as it appears in the schedule (e.g. \\"Week 3 (Sep 15-19)\\")",
    "startDate": "string or null - the topic's start date in YYYY-MM-DD format if determinable, else null",
    "endDate": "string or null - the topic's end date in YYYY-MM-DD format if determinable, else null"
  }
]

Rules:
- Match each topic's number (from the learning-outcomes list) to its row(s) in the schedule table by name/topic, not by position — schedules are often irregular (a topic can span multiple weeks, weeks can have no topic, weeks can be skipped entirely).
- If a topic's date can't be confidently determined from the schedule, set startDate/endDate to null rather than guessing.
- Infer the year from context (e.g. the course term/semester) when only month/day are given in the schedule.
- Return one entry per numbered topic found in the learning outcomes section, in order.`;

  const userMessage = `Syllabus:\n${syllabusText.slice(0, 12000)}\n\nExtract topics and their schedule dates.`;

  const raw = await callDeepSeek(systemPrompt, userMessage, 3000, 0.2);
  const jsonStr = raw.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "").trim();
  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) throw new Error("not array");
    return parsed as SyllabusTopic[];
  } catch {
    throw new Error("Failed to parse syllabus timeline");
  }
}

export interface SyllabusScanResult {
  courseName: string;
  sections: {
    title: string;
    skills: string[];
  }[];
}

export async function scanSyllabusSkills(syllabusText: string): Promise<SyllabusScanResult> {
  const systemPrompt = `You are an expert academic advisor. Given a course syllabus, extract the key skills a student must learn, organized by section/unit/week.

Return ONLY valid JSON (no markdown fences) matching this exact schema:
{
  "courseName": "string - the course name",
  "sections": [
    {
      "title": "string - section name, e.g. 'Section 1: Vectors' or 'Week 1: Introduction'",
      "skills": ["string - short skill name", "string - short skill name"]
    }
  ]
}

Guidelines:
- Extract 4-10 sections from the syllabus
- Each section should have 2-6 skill names
- Keep skill names SHORT and specific (3-8 words max), e.g. "Dot product" not "Understanding how dot products work"
- Use the syllabus structure (weeks, chapters, units, topics) to form sections
- Title each section clearly using its week/chapter/unit number and topic name`;

  const userMessage = `Syllabus:\n${syllabusText.slice(0, 8000)}\n\nExtract sections and skills.`;

  const raw = await callDeepSeek(systemPrompt, userMessage, 2048, 0.2);
  const jsonStr = raw.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "").trim();
  try {
    const parsed = JSON.parse(jsonStr) as SyllabusScanResult;
    if (!parsed.courseName || !Array.isArray(parsed.sections)) {
      throw new Error("Invalid scan result structure");
    }
    return parsed;
  } catch (err) {
    throw new Error(`Failed to parse syllabus scan: ${err instanceof Error ? err.message : err}`);
  }
}

export async function extractCourseStructure(
  texts: string[],
  imageBase64s: string[],
): Promise<CourseStructure> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY environment variable is not set");
  }

  // Build message content array
  const content: any[] = [];

  if (texts.length > 0) {
    content.push({
      type: "text",
      text: "Here are the extracted document texts:\n\n" +
        texts.map((t, i) => `--- Document ${i + 1} ---\n${t}`).join("\n\n"),
    });
  }

  for (const img of imageBase64s) {
    content.push({
      type: "image_url",
      image_url: { url: `data:image/jpeg;base64,${img}` },
    });
  }

  if (content.length === 0) {
    throw new Error("No content provided for analysis");
  }

  content.push({
    type: "text",
    text: "Analyze the above documents and extract a complete course structure as JSON.",
  });

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content },
      ],
      temperature: 0.3,
      max_tokens: 8192,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`DeepSeek API error (${response.status}): ${errBody}`);
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) {
    throw new Error("No response content from DeepSeek API");
  }

  // Strip markdown fences if present
  const jsonStr = raw.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "").trim();

  try {
    const parsed = JSON.parse(jsonStr) as CourseStructure;

    // Basic validation
    if (!parsed.courseName || !Array.isArray(parsed.topics)) {
      throw new Error("Invalid course structure: missing courseName or topics");
    }

    return parsed;
  } catch (err) {
    throw new Error(
      `Failed to parse DeepSeek response as JSON: ${err instanceof Error ? err.message : err}`,
    );
  }
}

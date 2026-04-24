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
      content: string;
    }[];
  }[];
}

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
          "title": "string - skill/concept name",
          "content": "string - markdown lesson content with LaTeX math (use $...$ for inline, $$...$$ for display). Include definitions, key formulas, examples, and explanations. Be thorough — this is the student's primary learning material."
        }
      ]
    }
  ]
}

Guidelines:
- Create meaningful topics grouping related concepts
- Each topic should have 2-6 skills/learn cards
- Skill content should be detailed markdown with LaTeX formulas where appropriate
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
): Promise<string> {
  const systemPrompt = `You are an expert educator creating detailed lesson content. Write thorough educational content in Markdown with LaTeX math (use $...$ for inline, $$...$$ for display).

Include:
- Clear definitions of key concepts
- Important formulas with explanations
- Worked examples with step-by-step solutions
- Common mistakes and tips
- Brief summary

Be thorough — this is the student's primary learning material. Use proper markdown headings, bullet points, and formatting.`;

  const userMessage = `Create detailed lesson content for:
Course: ${courseName}
Topic: ${topicName}
Skill: ${skillTitle}

Other skills in this topic (for context, don't repeat their content): ${siblingSkills.join(", ")}`;

  return callDeepSeek(systemPrompt, userMessage, 4096, 0.4);
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

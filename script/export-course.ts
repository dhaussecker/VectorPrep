import "dotenv/config";
import { writeFileSync } from "fs";
import { eq, like } from "drizzle-orm";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../shared/schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  max: 1,
  ssl: { rejectUnauthorized: false },
});

const db = drizzle(pool, { schema });

async function exportCourse(nameSearch: string) {
  // Find course by name (case-insensitive partial match)
  const allCourses = await db.select().from(schema.courses);
  const course = allCourses.find(c =>
    c.name.toLowerCase().includes(nameSearch.toLowerCase())
  );

  if (!course) {
    console.error(`No course found matching "${nameSearch}"`);
    console.log("Available courses:");
    allCourses.forEach(c => console.log(`  - ${c.name} (${c.id})`));
    process.exit(1);
  }

  console.log(`Found course: ${course.name} (${course.id})`);

  // Fetch all tools for this course
  const courseTools = await db.select().from(schema.tools)
    .where(eq(schema.tools.courseId, course.id))
    .orderBy(schema.tools.orderIndex);

  console.log(`Found ${courseTools.length} tools`);

  // For each tool, fetch content, tasks, and question templates
  const toolsWithData = await Promise.all(
    courseTools.map(async (tool) => {
      const [content, tasks, questionTemplates] = await Promise.all([
        db.select().from(schema.toolContent)
          .where(eq(schema.toolContent.toolId, tool.id))
          .orderBy(schema.toolContent.orderIndex),
        db.select().from(schema.tasks)
          .where(eq(schema.tasks.toolId, tool.id))
          .orderBy(schema.tasks.orderIndex),
        db.select().from(schema.questionTemplates)
          .where(eq(schema.questionTemplates.toolId, tool.id)),
      ]);

      console.log(`  Tool: ${tool.name} — ${content.length} content items, ${tasks.length} tasks, ${questionTemplates.length} question templates`);

      return { ...tool, content, tasks, questionTemplates };
    })
  );

  const exportData = {
    exportedAt: new Date().toISOString(),
    course,
    tools: toolsWithData,
  };

  const filename = `course-backup-${course.name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-${Date.now()}.json`;
  writeFileSync(filename, JSON.stringify(exportData, null, 2));
  console.log(`\nExported to: ${filename}`);

  await pool.end();
}

const search = process.argv[2] || "Calculus";
exportCourse(search).catch(err => {
  console.error(err);
  process.exit(1);
});

import "dotenv/config";
import { storage } from "../server/storage";

async function main() {
  const courses = await storage.getCourses();
  const course = courses.find(c => c.name === "Python Game Programming")!;
  const tools = await storage.getToolsByCourse(course.id);
  const tool = tools.find(t => t.name === "Data & Data Types")!;
  const content = await storage.getToolContent(tool.id);
  for (const c of content) {
    console.log(`title: ${c.title}, type: ${c.type}, content_len: ${c.content.length}`);
    if (c.type === "game") console.log("  first 80 chars:", JSON.stringify(c.content.slice(0, 80)));
  }
}
main();

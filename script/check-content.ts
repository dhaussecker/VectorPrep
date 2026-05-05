import "dotenv/config";
import { storage } from "../server/storage";

async function main() {
  const courses = await storage.getCourses();
  const course = courses.find(c => c.name === "Python Game Programming")!;
  const tools = await storage.getToolsByCourse(course.id);
  const tool = tools.find(t => t.name === "Data & Data Types")!;
  const content = await storage.getToolContent(tool.id);
  const card = content.find(c => c.title === "Data Types Dungeon")!;
  console.log(JSON.stringify(card.content.slice(0, 600)));
}
main();

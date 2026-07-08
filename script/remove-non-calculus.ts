import { storage } from "../server/storage";

async function main() {
  const allCourses = await storage.getCourses();
  const toDelete = allCourses.filter(c => !c.name.toLowerCase().includes("calcul"));

  if (toDelete.length === 0) {
    console.log("Nothing to remove — only calculus courses found.");
    return;
  }

  for (const course of toDelete) {
    console.log(`Removing: "${course.name}" (${course.id})`);
    await storage.deleteCourse(course.id);
  }

  console.log(`Done. Removed ${toDelete.length} non-calculus course(s).`);
}

main().catch(console.error).finally(() => process.exit(0));

import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { FileText, ArrowLeft, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RichContent } from "@/components/rich-content";
import { apiRequest } from "@/lib/queryClient";
import type { Topic, Course } from "@shared/schema";

type FormulaEntry = {
  id: string;
  formula: string;
  source: "preset" | "user";
};

type FormulaGroup = {
  cardId: string;
  cardTitle: string;
  formulas: FormulaEntry[];
};

type CheatSheetSection = {
  topic: Topic;
  groups: FormulaGroup[];
};

export default function CheatSheetPage() {
  const { courseId } = useParams<{ courseId?: string }>();

  if (courseId) {
    return <CourseCheatSheet courseId={courseId} />;
  }

  return <CourseSelection />;
}

function CourseSelection() {
  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  return (
    <div className="flex-1 overflow-auto">
      <div className="px-6 md:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Cheat Sheet</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Select a class to view its key formulas and equations
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-10 w-10 rounded-md mb-3" />
                  <Skeleton className="h-5 w-2/3 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !courses || courses.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No classes available yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) =>
              course.locked ? (
                <Card key={course.id} className="opacity-50 border-dashed h-full">
                  <CardContent className="p-6">
                    <span className="text-3xl block mb-3 grayscale">{course.icon}</span>
                    <h3 className="font-semibold text-lg">{course.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {course.description}
                    </p>
                    <Badge variant="secondary" className="mt-3 gap-1">
                      <Lock className="w-3 h-3" />
                      Coming Soon
                    </Badge>
                  </CardContent>
                </Card>
              ) : (
                <Link key={course.id} href={`/cheat-sheet/${course.id}`}>
                  <Card className="hover-elevate transition-all cursor-pointer h-full">
                    <CardContent className="p-6">
                      <span className="text-3xl block mb-3">{course.icon}</span>
                      <h3 className="font-semibold text-lg">{course.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {course.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CourseCheatSheet({ courseId }: { courseId: string }) {
  const { data: sections, isLoading } = useQuery<CheatSheetSection[]>({
    queryKey: ["/api/cheatsheet", courseId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/cheatsheet?courseId=${courseId}`);
      return res.json();
    },
  });

  const hasAnyFormulas = sections?.some((s) => s.groups.length > 0);

  return (
    <div className="flex-1 overflow-auto">
      <div className="px-6 md:px-8 py-6">
        <div className="mb-6">
          <Link href="/cheat-sheet">
            <Button variant="ghost" size="sm" className="mb-2 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-1" />
              All Classes
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Cheat Sheet</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Key formulas and equations organized by topic and skill
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-1/3 mb-4" />
                  <Skeleton className="h-16 w-full mb-3" />
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !hasAnyFormulas ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No formulas available yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {sections!.filter((s) => s.groups.length > 0).map((section) => (
              <Card key={section.topic.id}>
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{section.topic.icon}</span>
                    <CardTitle className="text-lg">{section.topic.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-5 pt-0">
                  <div className="space-y-5">
                    {section.groups.map((group) => (
                      <div key={group.cardId} className="space-y-2">
                        <h3 className="text-sm font-semibold text-primary">
                          {group.cardTitle}
                        </h3>
                        <div className="rounded-lg border bg-card divide-y">
                          {group.formulas.map((f) => (
                            <div key={f.id} className="px-3 py-2.5">
                              <RichContent content={f.formula} className="text-sm" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

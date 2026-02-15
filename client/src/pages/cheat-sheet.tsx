import { useQuery, useMutation } from "@tanstack/react-query";
import { FileText, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RichContent } from "@/components/rich-content";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Topic } from "@shared/schema";

type CheatSheetFormula = {
  id: string;
  title: string;
  formula: string;
  source: "preset" | "user";
};

type CheatSheetSection = {
  topic: Topic;
  formulas: CheatSheetFormula[];
};

export default function CheatSheetPage() {
  const { data: sections, isLoading } = useQuery<CheatSheetSection[]>({
    queryKey: ["/api/cheatsheet"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/cheatsheet/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cheatsheet"] });
    },
  });

  return (
    <div className="flex-1 overflow-auto">
      <div className="px-6 md:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Cheat Sheet</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Key formulas and equations organized by section
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
        ) : !sections || sections.every((s) => s.formulas.length === 0) ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No formulas available yet.</p>
              <p className="text-muted-foreground text-sm mt-1">
                Add formulas from Learn mode using the "+" button on equations.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {sections.filter((s) => s.formulas.length > 0).map((section) => {
              let counter = 0;
              return (
                <Card key={section.topic.id}>
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{section.topic.icon}</span>
                      <CardTitle className="text-lg">{section.topic.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 pt-0">
                    <div className="divide-y">
                      {section.formulas.map((f) => {
                        counter++;
                        return (
                          <div key={f.id} className="py-3 first:pt-0 last:pb-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs font-mono text-muted-foreground shrink-0">
                                  {counter}.
                                </span>
                                <p className="text-sm font-medium text-muted-foreground truncate">
                                  {f.title}
                                </p>
                                {f.source === "user" && (
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                                    yours
                                  </Badge>
                                )}
                              </div>
                              {f.source === "user" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                                  onClick={() => deleteMutation.mutate(f.id)}
                                  disabled={deleteMutation.isPending}
                                >
                                  <X className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                            <RichContent content={f.formula} className="text-base" />
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { BookOpen, Plus, Pencil, Trash2, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { RichContent } from "@/components/rich-content";
import { useToast } from "@/hooks/use-toast";
import type { Tool, Course } from "@shared/schema";

type FormulaEntry = { id: string; formula: string; source: "preset" | "user" };
type ContentGroup = { contentId: string; contentTitle: string; formulas: FormulaEntry[] };
type CheatSection = { tool: Tool; groups: ContentGroup[] };

export default function CheatSheetPage() {
  const { toast } = useToast();
  const [selectedCourseId, setSelectedCourseId] = useState<string>("all");
  const [addDialog, setAddDialog] = useState(false);
  const [editEntry, setEditEntry] = useState<{ id: string; formula: string } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  const { data: courses } = useQuery<Course[]>({ queryKey: ["/api/courses"] });

  const { data: sections, isLoading } = useQuery<CheatSection[]>({
    queryKey: ["/api/cheatsheet", selectedCourseId],
    queryFn: async () => {
      const url = selectedCourseId === "all"
        ? "/api/cheatsheet"
        : `/api/cheatsheet?courseId=${selectedCourseId}`;
      const res = await apiRequest("GET", url);
      return res.json();
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: { toolId: string; formula: string; label: string }) => {
      const res = await apiRequest("POST", "/api/cheatsheet", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cheatsheet"] });
      setAddDialog(false);
      toast({ title: "Formula added" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, formula }: { id: string; formula: string }) => {
      const res = await apiRequest("PUT", `/api/cheatsheet/${id}`, { formula });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cheatsheet"] });
      setEditEntry(null);
      toast({ title: "Formula updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/cheatsheet/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cheatsheet"] });
      setDeleteId(null);
      toast({ title: "Formula removed" });
    },
  });

  const toggleSection = (toolId: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(toolId)) next.delete(toolId);
      else next.add(toolId);
      return next;
    });
  };

  const activeCourses = courses?.filter((c) => !c.locked) ?? [];
  const allTools = sections?.map((s) => s.tool) ?? [];

  return (
    <div className="flex-1 overflow-auto">
      <div className="px-6 md:px-8 py-6">
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Cheat Sheet</h1>
            <p className="text-muted-foreground text-sm">Key formulas from your content, plus your own notes</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {activeCourses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setAddDialog(true)} size="sm">
              <Plus className="w-4 h-4" />
              Add Formula
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
          </div>
        ) : !sections || sections.filter((s) => s.groups.length > 0).length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No formulas yet. Complete some content cards or add your own.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sections.filter((s) => s.groups.length > 0).map((section) => {
              const totalFormulas = section.groups.reduce((sum, g) => sum + g.formulas.length, 0);
              const isOpen = openSections.has(section.tool.id);
              return (
                <Collapsible
                  key={section.tool.id}
                  open={isOpen}
                  onOpenChange={() => toggleSection(section.tool.id)}
                >
                  <Card>
                    <CollapsibleTrigger asChild>
                      <button className="w-full text-left">
                        <CardHeader className="p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-2xl flex-shrink-0">{section.tool.icon}</span>
                              <div className="min-w-0">
                                <CardTitle className="text-base">{section.tool.name}</CardTitle>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {totalFormulas} formula{totalFormulas !== 1 ? "s" : ""}
                                </p>
                              </div>
                            </div>
                            <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${isOpen ? "" : "-rotate-90"}`} />
                          </div>
                        </CardHeader>
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="p-4 pt-0 space-y-4">
                        {section.groups.map((group) => (
                          <div key={group.contentId}>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                              {group.contentTitle}
                            </p>
                            <div className="space-y-2">
                              {group.formulas.map((entry) => (
                                <div
                                  key={entry.id}
                                  className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800"
                                >
                                  <div className="flex-1 min-w-0 overflow-auto">
                                    <RichContent content={entry.formula} className="text-sm" />
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    {entry.source === "preset" ? (
                                      <Badge variant="outline" className="text-[10px]">Key Formula</Badge>
                                    ) : (
                                      <>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7"
                                          onClick={() => setEditEntry({ id: entry.id, formula: entry.formula })}
                                        >
                                          <Pencil className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7"
                                          onClick={() => setDeleteId(entry.id)}
                                        >
                                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}
          </div>
        )}
      </div>

      <AddFormulaDialog
        open={addDialog}
        onOpenChange={setAddDialog}
        tools={allTools}
        onSubmit={(data) => addMutation.mutate(data)}
        isPending={addMutation.isPending}
      />

      <Dialog open={!!editEntry} onOpenChange={(open) => !open && setEditEntry(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Formula</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label>Formula (Markdown + LaTeX)</Label>
            <Textarea
              value={editEntry?.formula ?? ""}
              onChange={(e) => setEditEntry((prev) => prev ? { ...prev, formula: e.target.value } : null)}
              className="font-mono text-sm min-h-[100px]"
              placeholder="e.g. $$\int_a^b f(x)\,dx = F(b) - F(a)$$"
            />
            {editEntry?.formula && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40 p-3">
                <RichContent content={editEntry.formula} className="text-sm" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditEntry(null)}>Cancel</Button>
            <Button
              onClick={() => editEntry && updateMutation.mutate(editEntry)}
              disabled={updateMutation.isPending || !editEntry?.formula}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Remove Formula?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This will remove this formula from your cheat sheet.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AddFormulaDialog({ open, onOpenChange, tools, onSubmit, isPending }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tools: Tool[];
  onSubmit: (data: { toolId: string; formula: string; label: string }) => void;
  isPending: boolean;
}) {
  const [toolId, setToolId] = useState("");
  const [formula, setFormula] = useState("");
  const [label, setLabel] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Formula</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tool</Label>
            <Select value={toolId} onValueChange={setToolId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a tool..." />
              </SelectTrigger>
              <SelectContent>
                {tools.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.icon} {t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Label / Section</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Integration by Parts"
            />
          </div>
          <div className="space-y-2">
            <Label>Formula (Markdown + LaTeX)</Label>
            <Textarea
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              className="font-mono text-sm min-h-[100px]"
              placeholder={"e.g. $$\\int u\\,dv = uv - \\int v\\,du$$"}
            />
            {formula && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40 p-3">
                <RichContent content={formula} className="text-sm" />
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => onSubmit({ toolId, formula, label })}
            disabled={isPending || !toolId || !formula || !label}
          >
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

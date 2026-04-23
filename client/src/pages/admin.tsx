import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { supabase } from "@/lib/supabase";
import { RichContent } from "@/components/rich-content";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import {
  Plus, Pencil, Trash2, BookOpen, ClipboardCheck,
  FolderOpen, Loader2, ImageIcon, Video, GraduationCap, FileText,
  Copy, Ticket, Check, Upload, X, Sparkles, Library,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Tool, ToolContentItem, QuestionTemplate, Course, InviteCode } from "@shared/schema";

const FORMULA_INSERTS = [
  { label: "Fraction", template: "\\frac{a}{b}", tooltip: "\\frac{a}{b}" },
  { label: "Integral", template: "\\int_{a}^{b} f(x)\\,dx", tooltip: "Definite integral" },
  { label: "Sum", template: "\\sum_{i=1}^{n} a_i", tooltip: "Summation" },
  { label: "Limit", template: "\\lim_{x \\to a} f(x)", tooltip: "Limit" },
  { label: "Sqrt", template: "\\sqrt{x}", tooltip: "Square root" },
  { label: "Power", template: "x^{n}", tooltip: "Exponent" },
  { label: "Subscript", template: "x_{i}", tooltip: "Subscript" },
  { label: "Infinity", template: "\\infty", tooltip: "Infinity symbol" },
  { label: "Greek", template: "\\alpha", tooltip: "Alpha (try \\beta, \\gamma, \\theta, etc.)" },
  { label: "Display $$", template: "$$\n\n$$", tooltip: "Display math block" },
  { label: "Inline $", template: "$$", tooltip: "Inline math" },
] as const;

function useInsertAtCursor(
  textareaRef: React.RefObject<HTMLTextAreaElement | null>,
  value: string,
  setValue: (v: string) => void,
) {
  return useCallback(
    (template: string) => {
      const el = textareaRef.current;
      if (!el) {
        setValue(value + template);
        return;
      }
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const newValue = value.substring(0, start) + template + value.substring(end);
      setValue(newValue);
      requestAnimationFrame(() => {
        el.focus();
        const cursorPos = start + template.length;
        el.setSelectionRange(cursorPos, cursorPos);
      });
    },
    [textareaRef, value, setValue],
  );
}

function FormulaInsertBar({
  onInsert,
}: {
  onInsert: (template: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showYouTubeDialog, setShowYouTubeDialog] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      onInsert(`\n\n![${file.name}](${url})\n\n`);
    } catch {
      alert("Failed to upload image. Make sure the file is an image under 10MB.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleYouTubeInsert = () => {
    if (youtubeUrl.trim()) {
      onInsert(`\n\n${youtubeUrl.trim()}\n\n`);
      setYoutubeUrl("");
      setShowYouTubeDialog(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-1">
        {FORMULA_INSERTS.map((item) => (
          <Tooltip key={item.label}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs font-mono"
                onClick={() => onInsert(item.template)}
              >
                {item.label}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-mono text-xs">{item.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        ))}

        <div className="w-px bg-border mx-1 self-stretch" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <ImageIcon className="w-3 h-3 mr-1" />}
              Image
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Upload an image (JPG, PNG, GIF, WebP)</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setShowYouTubeDialog(true)}
            >
              <Video className="w-3 h-3 mr-1" />
              YouTube
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Embed a YouTube video</p>
          </TooltipContent>
        </Tooltip>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
      </div>

      <Dialog open={showYouTubeDialog} onOpenChange={setShowYouTubeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Embed YouTube Video</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>YouTube URL</Label>
              <Input
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                onKeyDown={(e) => e.key === "Enter" && handleYouTubeInsert()}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Paste a YouTube URL and it will automatically embed as a video player.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowYouTubeDialog(false)}>Cancel</Button>
            <Button onClick={handleYouTubeInsert} disabled={!youtubeUrl.trim()}>Insert</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function AdminPage() {
  const { user } = useAuth();

  if (!user?.isAdmin) {
    return (
      <div className="flex-1 overflow-auto px-6 py-6">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">You do not have admin access.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="px-6 md:px-8 py-6">
        <h1 className="text-2xl font-bold tracking-tight mb-1" data-testid="text-admin-title">Content Manager</h1>
        <p className="text-muted-foreground text-sm mb-6">Create and manage courses, tools, content cards, and question templates</p>

        <Tabs defaultValue="courses">
          <TabsList data-testid="tabs-admin">
            <TabsTrigger value="courses" data-testid="tab-courses">
              <GraduationCap className="w-4 h-4 mr-1.5" />
              Courses
            </TabsTrigger>
            <TabsTrigger value="tools" data-testid="tab-tools">
              <FolderOpen className="w-4 h-4 mr-1.5" />
              Tools
            </TabsTrigger>
            <TabsTrigger value="content" data-testid="tab-content">
              <BookOpen className="w-4 h-4 mr-1.5" />
              Content
            </TabsTrigger>
            <TabsTrigger value="templates" data-testid="tab-templates">
              <ClipboardCheck className="w-4 h-4 mr-1.5" />
              Question Templates
            </TabsTrigger>
            <TabsTrigger value="invite-codes" data-testid="tab-invite-codes">
              <Ticket className="w-4 h-4 mr-1.5" />
              Invite Codes
            </TabsTrigger>
            <TabsTrigger value="ai-import" data-testid="tab-ai-import">
              <Sparkles className="w-4 h-4 mr-1.5" />
              AI Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses">
            <CoursesManager />
          </TabsContent>
          <TabsContent value="tools">
            <ToolsManager />
          </TabsContent>
          <TabsContent value="content">
            <ContentManager />
          </TabsContent>
          <TabsContent value="templates">
            <TemplatesManager />
          </TabsContent>
          <TabsContent value="invite-codes">
            <InviteCodesManager />
          </TabsContent>
          <TabsContent value="ai-import">
            <AISyllabusImport />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function CoursesManager() {
  const { toast } = useToast();
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ["/api/admin/courses"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/courses", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      setShowCreate(false);
      toast({ title: "Course created" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PUT", `/api/admin/courses/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      setEditCourse(null);
      toast({ title: "Course updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/courses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      setDeleteId(null);
      toast({ title: "Course deleted" });
    },
  });

  if (isLoading) {
    return <div className="space-y-3 mt-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>;
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" />
          Add Course
        </Button>
      </div>

      {courses?.map((course) => (
        <Card key={course.id}>
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="text-2xl flex-shrink-0">{course.icon}</span>
              <div className="min-w-0">
                <h3 className="font-semibold truncate">{course.name}</h3>
                <p className="text-xs text-muted-foreground truncate">{course.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {course.locked && <Badge variant="secondary">Locked</Badge>}
              <Badge variant="outline">#{course.orderIndex}</Badge>
              <Button variant="ghost" size="icon" onClick={() => setEditCourse(course)}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setDeleteId(course.id)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <CourseFormDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onSubmit={(data) => createMutation.mutate(data)}
        isPending={createMutation.isPending}
        title="Create Course"
      />

      {editCourse && (
        <CourseFormDialog
          open={!!editCourse}
          onOpenChange={(open) => !open && setEditCourse(null)}
          onSubmit={(data) => updateMutation.mutate({ id: editCourse.id, data })}
          isPending={updateMutation.isPending}
          title="Edit Course"
          defaultValues={editCourse}
        />
      )}

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Course?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete the course and all its topics, learn cards, question templates, and related progress. This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CourseFormDialog({ open, onOpenChange, onSubmit, isPending, title, defaultValues }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  isPending: boolean;
  title: string;
  defaultValues?: Course;
}) {
  const [name, setName] = useState(defaultValues?.name || "");
  const [description, setDescription] = useState(defaultValues?.description || "");
  const [icon, setIcon] = useState(defaultValues?.icon || "");
  const [orderIndex, setOrderIndex] = useState(String(defaultValues?.orderIndex ?? 0));
  const [locked, setLocked] = useState(defaultValues?.locked ?? false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Calculus II Part 1" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Icon/Emoji</Label>
              <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="e.g. 📐" />
            </div>
            <div className="space-y-2">
              <Label>Order</Label>
              <Input type="number" value={orderIndex} onChange={(e) => setOrderIndex(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Locked (Coming Soon)</Label>
              <p className="text-xs text-muted-foreground">Hide content and show "Coming Soon" badge</p>
            </div>
            <Switch checked={locked} onCheckedChange={setLocked} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSubmit({ name, description, icon: icon || "📚", orderIndex: parseInt(orderIndex) || 0, locked })} disabled={isPending || !name || !description}>
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ToolsManager() {
  const { toast } = useToast();
  const [editTool, setEditTool] = useState<Tool | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: tools, isLoading } = useQuery<Tool[]>({
    queryKey: ["/api/admin/tools"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/tools", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress/overview"] });
      setShowCreate(false);
      toast({ title: "Tool created" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PUT", `/api/admin/tools/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress/overview"] });
      setEditTool(null);
      toast({ title: "Tool updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/tools/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress/overview"] });
      setDeleteId(null);
      toast({ title: "Tool deleted" });
    },
  });

  if (isLoading) {
    return <div className="space-y-3 mt-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>;
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowCreate(true)} data-testid="button-create-tool">
          <Plus className="w-4 h-4" />
          Add Tool
        </Button>
      </div>

      {tools?.map((tool) => (
        <Card key={tool.id} data-testid={`card-admin-tool-${tool.id}`}>
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="text-2xl flex-shrink-0">{tool.icon}</span>
              <div className="min-w-0">
                <h3 className="font-semibold truncate">{tool.name}</h3>
                <p className="text-xs text-muted-foreground truncate">{tool.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Badge variant={tool.status === "locked" ? "secondary" : "outline"}>{tool.status}</Badge>
              <Badge variant="outline">#{tool.orderIndex}</Badge>
              <Button variant="ghost" size="icon" onClick={() => setEditTool(tool)} data-testid={`button-edit-tool-${tool.id}`}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setDeleteId(tool.id)} data-testid={`button-delete-tool-${tool.id}`}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <ToolFormDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onSubmit={(data) => createMutation.mutate(data)}
        isPending={createMutation.isPending}
        title="Create Tool"
      />

      {editTool && (
        <ToolFormDialog
          open={!!editTool}
          onOpenChange={(open) => !open && setEditTool(null)}
          onSubmit={(data) => updateMutation.mutate({ id: editTool.id, data })}
          isPending={updateMutation.isPending}
          title="Edit Tool"
          defaultValues={editTool}
        />
      )}

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tool?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete the tool and all its content, tasks, question templates, and related progress. This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending} data-testid="button-confirm-delete">
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ToolFormDialog({ open, onOpenChange, onSubmit, isPending, title, defaultValues }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  isPending: boolean;
  title: string;
  defaultValues?: Tool;
}) {
  const [name, setName] = useState(defaultValues?.name || "");
  const [description, setDescription] = useState(defaultValues?.description || "");
  const [icon, setIcon] = useState(defaultValues?.icon || "");
  const [orderIndex, setOrderIndex] = useState(String(defaultValues?.orderIndex ?? 0));
  const [courseId, setCourseId] = useState(defaultValues?.courseId || "");
  const [status, setStatus] = useState(defaultValues?.status || "active");
  const [xpReward, setXpReward] = useState(String(defaultValues?.xpReward ?? 150));

  const { data: courses } = useQuery<Course[]>({ queryKey: ["/api/admin/courses"] });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Course</Label>
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a course..." />
              </SelectTrigger>
              <SelectContent>
                {courses?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Vectors" data-testid="input-tool-name" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description..." data-testid="input-tool-description" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Icon/Label</Label>
              <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="e.g. →" data-testid="input-tool-icon" />
            </div>
            <div className="space-y-2">
              <Label>Order</Label>
              <Input type="number" value={orderIndex} onChange={(e) => setOrderIndex(e.target.value)} data-testid="input-tool-order" />
            </div>
            <div className="space-y-2">
              <Label>XP Reward</Label>
              <Input type="number" value={xpReward} onChange={(e) => setXpReward(e.target.value)} data-testid="input-tool-xp" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="locked">Locked</SelectItem>
                <SelectItem value="mastered">Mastered</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSubmit({ name, description, icon, orderIndex: parseInt(orderIndex) || 0, courseId: courseId || undefined, status, xpReward: parseInt(xpReward) || 150 })} disabled={isPending || !name || !description} data-testid="button-submit-tool">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ContentManager() {
  const { toast } = useToast();
  const [selectedToolId, setSelectedToolId] = useState<string>("");
  const [editCard, setEditCard] = useState<ToolContentItem | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: tools } = useQuery<Tool[]>({ queryKey: ["/api/admin/tools"] });

  const { data: cards, isLoading } = useQuery<ToolContentItem[]>({
    queryKey: ["/api/admin/tools", selectedToolId, "content"],
    enabled: !!selectedToolId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/content", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tools", selectedToolId, "content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cheatsheet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/learn"] });
      setShowCreate(false);
      toast({ title: "Content card created" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PUT", `/api/admin/content/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tools", selectedToolId, "content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cheatsheet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/learn"] });
      setEditCard(null);
      toast({ title: "Content card updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/content/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tools", selectedToolId, "content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cheatsheet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/learn"] });
      setDeleteId(null);
      toast({ title: "Content card deleted" });
    },
  });

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="w-64">
          <Select value={selectedToolId} onValueChange={setSelectedToolId}>
            <SelectTrigger data-testid="select-tool-content">
              <SelectValue placeholder="Select a tool..." />
            </SelectTrigger>
            <SelectContent>
              {tools?.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.icon} {t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedToolId && (
          <Button onClick={() => setShowCreate(true)} data-testid="button-create-content">
            <Plus className="w-4 h-4" />
            Add Content
          </Button>
        )}
      </div>

      {!selectedToolId && (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Select a tool to manage its content cards</p>
          </CardContent>
        </Card>
      )}

      {selectedToolId && isLoading && (
        <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
      )}

      {selectedToolId && cards?.map((card) => (
        <Card key={card.id} data-testid={`card-admin-content-${card.id}`}>
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm truncate">{card.title}</h3>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {card.content.substring(0, 100)}...
              </p>
              {card.quickCheck && <Badge variant="outline" className="mt-1">Has Quick Check</Badge>}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Badge variant="outline">#{card.orderIndex}</Badge>
              <Button variant="ghost" size="icon" onClick={() => setEditCard(card)} data-testid={`button-edit-content-${card.id}`}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setDeleteId(card.id)} data-testid={`button-delete-content-${card.id}`}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {selectedToolId && cards?.length === 0 && (
        <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">No content cards yet. Create one above.</CardContent></Card>
      )}

      {showCreate && (
        <CardFormDialog
          open={showCreate}
          onOpenChange={setShowCreate}
          onSubmit={(data) => createMutation.mutate({ ...data, toolId: selectedToolId })}
          isPending={createMutation.isPending}
          title="Create Content Card"
        />
      )}

      {editCard && (
        <CardFormDialog
          open={!!editCard}
          onOpenChange={(open) => !open && setEditCard(null)}
          onSubmit={(data) => updateMutation.mutate({ id: editCard.id, data })}
          isPending={updateMutation.isPending}
          title="Edit Content Card"
          defaultValues={editCard}
        />
      )}

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Content Card?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This will permanently delete this content card and any related progress.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending} data-testid="button-confirm-delete-content">
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function VideoLibraryModal({ open, onOpenChange, onSelect }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => void;
}) {
  const [files, setFiles] = useState<{ name: string; url: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage.from("tutor-videos").list("", {
        limit: 100,
        sortBy: { column: "created_at", order: "desc" },
      });
      if (error) throw error;
      const mapped = (data ?? [])
        .filter(f => f.name !== ".emptyFolderPlaceholder")
        .map(f => ({
          name: f.name,
          url: supabase.storage.from("tutor-videos").getPublicUrl(f.name).data.publicUrl,
        }));
      setFiles(mapped);
    } catch (err: any) {
      alert("Could not load video library: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load when modal opens
  useState(() => { if (open) loadFiles(); });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Library className="w-4 h-4" /> Video Library
          </DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : files.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No videos uploaded yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {files.map(f => (
              <button
                key={f.name}
                type="button"
                onClick={() => { onSelect(f.url); onOpenChange(false); }}
                className="group relative rounded-xl border-2 border-border hover:border-primary overflow-hidden bg-black transition-all"
              >
                <video
                  src={f.url}
                  muted
                  playsInline
                  className="w-full aspect-video object-contain"
                  onMouseEnter={e => (e.currentTarget as HTMLVideoElement).play()}
                  onMouseLeave={e => { const v = e.currentTarget as HTMLVideoElement; v.pause(); v.currentTime = 0; }}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1 text-[10px] text-white font-mono truncate opacity-0 group-hover:opacity-100 transition-opacity">
                  {f.name}
                </div>
              </button>
            ))}
          </div>
        )}
        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={() => loadFiles()} disabled={loading}>
            {loading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
            Refresh
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CardFormDialog({ open, onOpenChange, onSubmit, isPending, title, defaultValues }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  isPending: boolean;
  title: string;
  defaultValues?: ToolContentItem;
}) {
  const [cardTitle, setCardTitle] = useState(defaultValues?.title || "");
  const [content, setContent] = useState(defaultValues?.content || "");
  const [formula, setFormula] = useState(defaultValues?.formula || "");
  const [quickCheck, setQuickCheck] = useState(defaultValues?.quickCheck || "");
  const [quickCheckAnswer, setQuickCheckAnswer] = useState(defaultValues?.quickCheckAnswer || "");
  const [orderIndex, setOrderIndex] = useState(String(defaultValues?.orderIndex ?? 0));
  const [tutorVideoUrl, setTutorVideoUrl] = useState(defaultValues?.tutorVideoUrl || "");
  const [videoUploading, setVideoUploading] = useState(false);
  const [captions, setCaptions] = useState<{t: number; text: string}[]>(
    Array.isArray((defaultValues as any)?.captions) ? (defaultValues as any).captions : []
  );
  const [showLibrary, setShowLibrary] = useState(false);
  const captionVideoRef = useRef<HTMLVideoElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("tutor-videos").upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("tutor-videos").getPublicUrl(path);
      setTutorVideoUrl(publicUrl);
    } catch (err: any) {
      alert(`Video upload failed: ${err?.message ?? "Unknown error"}. Make sure a public Supabase storage bucket called "tutor-videos" exists.`);
    } finally {
      setVideoUploading(false);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  };
  const selectionRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });
  const insertAtCursor = useInsertAtCursor(textareaRef, content, setContent);

  // Track selection changes so we have it when the button is clicked
  const handleSelectionChange = () => {
    const el = textareaRef.current;
    if (el) {
      selectionRef.current = { start: el.selectionStart, end: el.selectionEnd };
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full max-h-[95vh] h-full overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-[1fr_auto] gap-4">
            <div className="space-y-2">
              <Label>Card Title</Label>
              <Input value={cardTitle} onChange={(e) => setCardTitle(e.target.value)} placeholder="e.g. What is a Limit?" data-testid="input-card-title" />
            </div>
            <div className="space-y-2">
              <Label>Order</Label>
              <Input type="number" value={orderIndex} onChange={(e) => setOrderIndex(e.target.value)} className="w-20" data-testid="input-card-order" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <Label>Content (Markdown + LaTeX)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevent textarea from losing focus/selection
                  const { start, end } = selectionRef.current;
                  const selected = content.substring(start, end).trim();
                  if (!selected) return;
                  setFormula((prev) => prev ? prev + "\n\n" + selected : selected);
                }}
              >
                <FileText className="w-3 h-3" />
                Add Selection to Key Formula
              </Button>
            </div>
            <FormulaInsertBar onInsert={insertAtCursor} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Edit</p>
                <Textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => { setContent(e.target.value); handleSelectionChange(); }}
                  onSelect={handleSelectionChange}
                  onKeyUp={handleSelectionChange}
                  onMouseUp={handleSelectionChange}
                  placeholder={"Write content using Markdown and LaTeX...\n\nUse $...$ for inline math: $f(x) = x^2$\nUse $$...$$ for display math:\n$$\\int_0^1 x\\,dx = \\frac{1}{2}$$"}
                  className="min-h-[400px] font-mono text-sm"
                  data-testid="input-card-content"
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Preview</p>
                <Card className="min-h-[400px] overflow-auto">
                  <CardContent className="p-4">
                    {content ? (
                      <RichContent content={content} className="text-sm" />
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Preview will appear here...</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Key Formula (optional)</Label>
              <Badge variant="outline" className="text-[10px]">Blue box in Learn + Cheat Sheet</Badge>
              {formula && (
                <Button variant="ghost" size="sm" className="h-6 text-xs text-destructive" onClick={() => setFormula("")}>
                  <Trash2 className="w-3 h-3" />
                  Remove
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              This formula appears in a highlighted blue box on the learn card and is automatically included in the cheat sheet.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Textarea
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                placeholder={'e.g. $$\\int_a^b f(x)\\,dx$$\n\nPress Enter for new lines\n\nTip: Select text in Content above and click "Add Selection to Key Formula"'}
                className="font-mono text-sm min-h-[80px]"
                data-testid="input-card-formula"
              />
              <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40 p-3 min-h-[80px] flex items-center overflow-auto">
                {formula ? (
                  <div>
                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1 uppercase tracking-wide">Key Formula</p>
                    <RichContent content={formula} className="text-sm" />
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Formula preview (blue box)...</p>
                )}
              </div>
            </div>
          </div>

          {/* AI Chat for refining content */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              AI Content Assistant
            </Label>
            <AIChatPanel
              currentContent={content}
              onContentUpdate={setContent}
              context={cardTitle ? `Learn card: ${cardTitle}` : undefined}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quick Check Question (optional)</Label>
              <Input value={quickCheck} onChange={(e) => setQuickCheck(e.target.value)} placeholder="Test question..." data-testid="input-card-quick-check" />
            </div>
            <div className="space-y-2">
              <Label>Quick Check Answer (optional)</Label>
              <Input value={quickCheckAnswer} onChange={(e) => setQuickCheckAnswer(e.target.value)} placeholder="Expected answer..." data-testid="input-card-quick-answer" />
            </div>
          </div>

          {/* ── Video + Caption Timeline ── */}
          <div className="space-y-3 rounded-2xl border-2 border-foreground p-4 bg-muted/30">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <Label className="text-base font-bold">Tutor Video + Captions</Label>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={videoUploading}
                >
                  {videoUploading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Upload className="w-3 h-3 mr-1" />}
                  {tutorVideoUrl ? "Replace Video" : "Upload Video"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLibrary(true)}
                >
                  <Library className="w-3 h-3 mr-1" />
                  Browse Library
                </Button>
                {tutorVideoUrl && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => { setTutorVideoUrl(""); setCaptions([]); }}>
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>

            {tutorVideoUrl ? (
              <div className="space-y-3">
                {/* Video preview with controls for timestamping */}
                <video
                  ref={captionVideoRef}
                  src={tutorVideoUrl}
                  controls
                  className="w-full rounded-xl border-2 border-foreground"
                  style={{ maxHeight: 260 }}
                />

                {/* Caption rows */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold">Caption Timeline</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const t = captionVideoRef.current?.currentTime ?? 0;
                        setCaptions(prev => [...prev, { t: parseFloat(t.toFixed(2)), text: "" }]
                          .sort((a, b) => a.t - b.t));
                      }}
                    >
                      + Add at current time
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Play the video, pause at the moment you want a caption to appear, then click "Add at current time". Type what's being said.</p>

                  {captions.length === 0 && (
                    <p className="text-sm text-muted-foreground italic py-2">No captions yet — add one above.</p>
                  )}

                  {captions.map((cap, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0 font-mono w-16 text-xs"
                        title="Click to update timestamp to current video time"
                        onClick={() => {
                          const t = captionVideoRef.current?.currentTime ?? 0;
                          setCaptions(prev => prev.map((c, j) => j === i ? { ...c, t: parseFloat(t.toFixed(2)) } : c)
                            .sort((a, b) => a.t - b.t));
                        }}
                      >
                        {cap.t.toFixed(1)}s
                      </Button>
                      <Input
                        value={cap.text}
                        onChange={(e) => setCaptions(prev => prev.map((c, j) => j === i ? { ...c, text: e.target.value } : c))}
                        placeholder="What's being said at this moment..."
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setCaptions(prev => prev.filter((_, j) => j !== i))}
                      >
                        <X className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Upload a video to add captions. Words will animate in sync with the video during the lesson.</p>
            )}

            <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
          </div>

          <VideoLibraryModal
            open={showLibrary}
            onOpenChange={setShowLibrary}
            onSelect={(url) => setTutorVideoUrl(url)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSubmit({ title: cardTitle, content, formula: formula || null, quickCheck: quickCheck || null, quickCheckAnswer: quickCheckAnswer || null, tutorVideoUrl: tutorVideoUrl || null, captions: captions.length > 0 ? captions : null, orderIndex: parseInt(orderIndex) || 0 })} disabled={isPending || !cardTitle || !content} data-testid="button-submit-card">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TemplatesManager() {
  const { toast } = useToast();
  const [selectedToolId, setSelectedToolId] = useState<string>("");
  const [editTemplate, setEditTemplate] = useState<QuestionTemplate | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: tools } = useQuery<Tool[]>({ queryKey: ["/api/admin/tools"] });

  const { data: templates, isLoading } = useQuery<QuestionTemplate[]>({
    queryKey: ["/api/admin/tools", selectedToolId, "templates"],
    enabled: !!selectedToolId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/templates", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tools", selectedToolId, "templates"] });
      setShowCreate(false);
      toast({ title: "Question template created" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PUT", `/api/admin/templates/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tools", selectedToolId, "templates"] });
      setEditTemplate(null);
      toast({ title: "Question template updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tools", selectedToolId, "templates"] });
      setDeleteId(null);
      toast({ title: "Question template deleted" });
    },
  });

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="w-64">
          <Select value={selectedToolId} onValueChange={setSelectedToolId}>
            <SelectTrigger data-testid="select-tool-templates">
              <SelectValue placeholder="Select a tool..." />
            </SelectTrigger>
            <SelectContent>
              {tools?.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.icon} {t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedToolId && (
          <Button onClick={() => setShowCreate(true)} data-testid="button-create-template">
            <Plus className="w-4 h-4" />
            Add Template
          </Button>
        )}
      </div>

      {!selectedToolId && (
        <Card>
          <CardContent className="p-8 text-center">
            <ClipboardCheck className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Select a tool to manage its question templates</p>
          </CardContent>
        </Card>
      )}

      {selectedToolId && isLoading && (
        <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
      )}

      {selectedToolId && templates?.map((template) => (
        <Card key={template.id} data-testid={`card-admin-template-${template.id}`}>
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm truncate">{template.templateText.substring(0, 120)}...</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{template.answerType}</Badge>
                <span className="text-xs text-muted-foreground">
                  Params: {Object.keys(template.parameters as object).join(", ")}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button variant="ghost" size="icon" onClick={() => setEditTemplate(template)} data-testid={`button-edit-template-${template.id}`}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setDeleteId(template.id)} data-testid={`button-delete-template-${template.id}`}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {selectedToolId && templates?.length === 0 && (
        <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">No question templates yet. Create one above.</CardContent></Card>
      )}

      {showCreate && (
        <TemplateFormDialog
          open={showCreate}
          onOpenChange={setShowCreate}
          onSubmit={(data) => createMutation.mutate({ ...data, toolId: selectedToolId })}
          isPending={createMutation.isPending}
          title="Create Question Template"
        />
      )}

      {editTemplate && (
        <TemplateFormDialog
          open={!!editTemplate}
          onOpenChange={(open) => !open && setEditTemplate(null)}
          onSubmit={(data) => updateMutation.mutate({ id: editTemplate.id, data })}
          isPending={updateMutation.isPending}
          title="Edit Question Template"
          defaultValues={editTemplate}
        />
      )}

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Question Template?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This will permanently delete this template and any related progress data.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending} data-testid="button-confirm-delete-template">
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TemplateFormDialog({ open, onOpenChange, onSubmit, isPending, title, defaultValues }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  isPending: boolean;
  title: string;
  defaultValues?: QuestionTemplate;
}) {
  const [templateText, setTemplateText] = useState(defaultValues?.templateText || "");
  const [solutionTemplate, setSolutionTemplate] = useState(defaultValues?.solutionTemplate || "");
  const [answerType, setAnswerType] = useState(defaultValues?.answerType || "numeric");
  const [parametersJson, setParametersJson] = useState(
    defaultValues?.parameters ? JSON.stringify(defaultValues.parameters, null, 2) : '{\n  "a": { "min": 1, "max": 10 }\n}'
  );
  const [jsonError, setJsonError] = useState("");
  const questionRef = useRef<HTMLTextAreaElement>(null);
  const solutionRef = useRef<HTMLTextAreaElement>(null);
  const insertAtQuestionCursor = useInsertAtCursor(questionRef, templateText, setTemplateText);
  const insertAtSolutionCursor = useInsertAtCursor(solutionRef, solutionTemplate, setSolutionTemplate);
  const [activeField, setActiveField] = useState<"question" | "solution">("question");

  const validateJson = (val: string) => {
    try {
      JSON.parse(val);
      setJsonError("");
      return true;
    } catch {
      setJsonError("Invalid JSON");
      return false;
    }
  };

  const handleSubmit = () => {
    if (!validateJson(parametersJson)) return;
    onSubmit({
      templateText,
      solutionTemplate,
      answerType,
      parameters: JSON.parse(parametersJson),
    });
  };

  const handleInsert = (template: string) => {
    if (activeField === "solution") {
      insertAtSolutionCursor(template);
    } else {
      insertAtQuestionCursor(template);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full max-h-[95vh] h-full overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <FormulaInsertBar onInsert={handleInsert} />

          <div className="space-y-2">
            <Label>Question Template (Markdown + LaTeX)</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Edit</p>
                <Textarea
                  ref={questionRef}
                  value={templateText}
                  onChange={(e) => setTemplateText(e.target.value)}
                  onFocus={() => setActiveField("question")}
                  placeholder={'Use {param} for variables, e.g.: Find the derivative of $f(x) = {a}x^{n}$'}
                  className="min-h-[100px] font-mono text-sm"
                  data-testid="input-template-text"
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Preview</p>
                <Card className="min-h-[100px] overflow-auto">
                  <CardContent className="p-4">
                    {templateText ? (
                      <RichContent content={templateText} className="text-sm" />
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Preview will appear here...</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Solution Template</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Edit</p>
                <Textarea
                  ref={solutionRef}
                  value={solutionTemplate}
                  onChange={(e) => setSolutionTemplate(e.target.value)}
                  onFocus={() => setActiveField("solution")}
                  placeholder={'Solution steps with {param} variables and LaTeX formatting'}
                  className="min-h-[100px] font-mono text-sm"
                  data-testid="input-solution-template"
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Preview</p>
                <Card className="min-h-[100px] overflow-auto">
                  <CardContent className="p-4">
                    {solutionTemplate ? (
                      <RichContent content={solutionTemplate} className="text-sm" />
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Preview will appear here...</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Answer Type</Label>
              <Select value={answerType} onValueChange={setAnswerType}>
                <SelectTrigger data-testid="select-answer-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="numeric">Numeric</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Parameters (JSON)</Label>
              <Textarea
                value={parametersJson}
                onChange={(e) => { setParametersJson(e.target.value); validateJson(e.target.value); }}
                className="min-h-[80px] font-mono text-sm"
                data-testid="input-parameters-json"
              />
              {jsonError && <p className="text-xs text-destructive">{jsonError}</p>}
            </div>
          </div>

          <Card className="bg-muted/30">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">
                <strong>Template Guide:</strong> Use <code className="bg-muted px-1 rounded">{"{param}"}</code> for random values. Define each parameter with min/max ranges in the JSON.
              </p>
            </CardContent>
          </Card>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending || !templateText || !solutionTemplate || !!jsonError} data-testid="button-submit-template">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InviteCodesManager() {
  const { toast } = useToast();
  const [generateCount, setGenerateCount] = useState("5");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: codes, isLoading } = useQuery<InviteCode[]>({
    queryKey: ["/api/admin/invite-codes"],
  });

  const generateMutation = useMutation({
    mutationFn: async (count: number) => {
      const res = await apiRequest("POST", "/api/admin/invite-codes", { count });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invite-codes"] });
      toast({ title: "Invite codes generated" });
    },
  });

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) {
    return <div className="space-y-3 mt-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>;
  }

  const available = codes?.filter((c) => !c.used) ?? [];
  const used = codes?.filter((c) => c.used) ?? [];

  return (
    <div className="space-y-4 mt-4">
      <Card>
        <CardContent className="p-4 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Label>Generate</Label>
            <Input
              type="number"
              min={1}
              max={100}
              value={generateCount}
              onChange={(e) => setGenerateCount(e.target.value)}
              className="w-20"
            />
            <span className="text-sm text-muted-foreground">codes</span>
          </div>
          <Button
            onClick={() => generateMutation.mutate(parseInt(generateCount) || 5)}
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Generate
          </Button>
          <div className="ml-auto flex items-center gap-3 text-sm text-muted-foreground">
            <span>{available.length} available</span>
            <span>{used.length} used</span>
          </div>
        </CardContent>
      </Card>

      {available.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Available Codes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {available.map((code) => (
                <div key={code.id} className="flex items-center justify-between px-4 py-2.5">
                  <code className="font-mono text-sm tracking-wider">{code.code}</code>
                  <Button variant="ghost" size="sm" onClick={() => handleCopy(code.code, code.id)}>
                    {copiedId === code.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {used.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Used Codes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {used.map((code) => (
                <div key={code.id} className="flex items-center justify-between px-4 py-2.5">
                  <code className="font-mono text-sm tracking-wider text-muted-foreground line-through">{code.code}</code>
                  <span className="text-xs text-muted-foreground">{code.usedBy ? `Used by ${code.usedBy.slice(0, 8)}...` : "Used"}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {codes?.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Ticket className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No invite codes yet. Generate some above.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface CourseOutline {
  courseName: string;
  courseDescription: string;
  courseIcon: string;
  topics: {
    name: string;
    description: string;
    icon: string;
    skills: { title: string; content?: string }[];
  }[];
}

function InlineEdit({ value, onChange, className, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  if (editing) {
    return (
      <Input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => { onChange(draft); setEditing(false); }}
        onKeyDown={(e) => {
          if (e.key === "Enter") { onChange(draft); setEditing(false); }
          if (e.key === "Escape") { setDraft(value); setEditing(false); }
        }}
        className={`h-7 text-sm ${className || ""}`}
        autoFocus
        placeholder={placeholder}
      />
    );
  }

  return (
    <span
      className={`cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 ${className || ""}`}
      onClick={() => { setDraft(value); setEditing(true); }}
      title="Click to edit"
    >
      {value || <span className="text-muted-foreground italic">{placeholder || "Click to edit"}</span>}
    </span>
  );
}

function AISyllabusImport() {
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [outline, setOutline] = useState<CourseOutline | null>(null);
  const [fullPreview, setFullPreview] = useState<CourseOutline | null>(null);
  const [result, setResult] = useState<{ courseName: string; topicCount: number } | null>(null);
  const [activeChat, setActiveChat] = useState<{ topicIdx: number; skillIdx: number } | null>(null);
  const [studyPlan, setStudyPlan] = useState<any[] | null>(null);
  const [studyDays, setStudyDays] = useState("10");
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 1: Analyze files → editable outline (no content)
  const analyzeMutation = useMutation({
    mutationFn: async (selectedFiles: File[]) => {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      const formData = new FormData();
      for (const file of selectedFiles) {
        formData.append("files", file);
      }
      const res = await fetch("/api/admin/syllabus-analyze", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Upload failed" }));
        throw new Error(err.message || "Upload failed");
      }
      return res.json() as Promise<CourseOutline>;
    },
    onSuccess: (data) => {
      setOutline(data);
      setFiles([]);
      setFullPreview(null);
      setResult(null);
    },
    onError: (err: Error) => {
      toast({ title: "Analysis failed", description: err.message, variant: "destructive" });
    },
  });

  // Step 2: Generate content for each skill
  const generateMutation = useMutation({
    mutationFn: async (currentOutline: CourseOutline) => {
      const res = await apiRequest("POST", "/api/admin/syllabus-generate-content", currentOutline);
      return res.json() as Promise<CourseOutline>;
    },
    onSuccess: (data) => {
      setFullPreview(data);
    },
    onError: (err: Error) => {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    },
  });

  // Step 3: Create course in DB
  const createMutation = useMutation({
    mutationFn: async (structure: CourseOutline) => {
      const res = await apiRequest("POST", "/api/admin/syllabus-create", structure);
      return res.json();
    },
    onSuccess: (data) => {
      setResult({ courseName: data.course.name, topicCount: data.topicCount });
      setOutline(null);
      setFullPreview(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({ title: "Course created from syllabus" });
    },
    onError: (err: Error) => {
      toast({ title: "Creation failed", description: err.message, variant: "destructive" });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selected]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Outline editing helpers
  const updateOutline = (updater: (o: CourseOutline) => CourseOutline) => {
    setOutline((prev) => prev ? updater({ ...prev }) : null);
  };

  const updateTopic = (ti: number, field: string, value: string) => {
    updateOutline((o) => {
      const topics = [...o.topics];
      topics[ti] = { ...topics[ti], [field]: value };
      return { ...o, topics };
    });
  };

  const deleteTopic = (ti: number) => {
    updateOutline((o) => ({ ...o, topics: o.topics.filter((_, i) => i !== ti) }));
  };

  const addTopic = () => {
    updateOutline((o) => ({
      ...o,
      topics: [...o.topics, { name: "New Topic", description: "", icon: "📝", skills: [{ title: "New Skill" }] }],
    }));
  };

  const updateSkill = (ti: number, si: number, title: string) => {
    updateOutline((o) => {
      const topics = [...o.topics];
      const skills = [...topics[ti].skills];
      skills[si] = { ...skills[si], title };
      topics[ti] = { ...topics[ti], skills };
      return { ...o, topics };
    });
  };

  const deleteSkill = (ti: number, si: number) => {
    updateOutline((o) => {
      const topics = [...o.topics];
      topics[ti] = { ...topics[ti], skills: topics[ti].skills.filter((_, i) => i !== si) };
      return { ...o, topics };
    });
  };

  const addSkill = (ti: number) => {
    updateOutline((o) => {
      const topics = [...o.topics];
      topics[ti] = { ...topics[ti], skills: [...topics[ti].skills, { title: "New Skill" }] };
      return { ...o, topics };
    });
  };

  // Full preview editing helpers
  const updateFullPreviewSkillContent = (ti: number, si: number, content: string) => {
    setFullPreview((prev) => {
      if (!prev) return null;
      const topics = [...prev.topics];
      const skills = [...topics[ti].skills];
      skills[si] = { ...skills[si], content };
      topics[ti] = { ...topics[ti], skills };
      return { ...prev, topics };
    });
  };

  const totalSkills = outline?.topics.reduce((sum, t) => sum + (t.skills?.length || 0), 0) || 0;

  return (
    <div className="space-y-4 mt-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            AI Course Import
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload syllabi, lecture notes, or practice exams (PDF or images). DeepSeek AI will analyze the documents and extract a course structure you can edit before generating content.
          </p>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={analyzeMutation.isPending}>
              <Upload className="w-4 h-4 mr-1.5" />
              Add Files
            </Button>
            <span className="text-xs text-muted-foreground">PDF, JPG, PNG (max 10 files)</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((file, i) => (
                <div key={`${file.name}-${i}`} className="flex items-center justify-between p-2 rounded-md border bg-muted/30">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                    <span className="text-sm truncate">{file.name}</span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      ({(file.size / 1024).toFixed(0)} KB)
                    </span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeFile(i)} disabled={analyzeMutation.isPending}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Button
            onClick={() => analyzeMutation.mutate(files)}
            disabled={files.length === 0 || analyzeMutation.isPending}
            className="w-full"
          >
            {analyzeMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Analyzing documents... this may take 30-60s
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Analyze Documents
              </>
            )}
          </Button>

          {result && (
            <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/40">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="font-semibold text-sm">Course created: {result.courseName}</p>
                    <p className="text-xs text-muted-foreground">{result.topicCount} topics with learn cards</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Step 1: Editable Outline Preview */}
      <Dialog open={!!outline && !fullPreview} onOpenChange={(open) => !open && setOutline(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Course Structure</DialogTitle>
          </DialogHeader>

          {outline && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="grid grid-cols-[auto_1fr] gap-3 items-center">
                  <Label className="text-xs">Name</Label>
                  <Input
                    value={outline.courseName}
                    onChange={(e) => setOutline({ ...outline, courseName: e.target.value })}
                    className="h-8 text-sm font-semibold"
                  />
                </div>
                <div className="grid grid-cols-[auto_1fr] gap-3 items-center">
                  <Label className="text-xs">Desc</Label>
                  <Input
                    value={outline.courseDescription}
                    onChange={(e) => setOutline({ ...outline, courseDescription: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="grid grid-cols-[auto_1fr] gap-3 items-center">
                  <Label className="text-xs">Icon</Label>
                  <Input
                    value={outline.courseIcon}
                    onChange={(e) => setOutline({ ...outline, courseIcon: e.target.value })}
                    className="h-8 text-sm w-20"
                  />
                </div>
              </div>

              <div className="border-t pt-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">{outline.topics.length} Topics, {totalSkills} Skills</p>
                  <Button variant="outline" size="sm" onClick={addTopic}>
                    <Plus className="w-3 h-3 mr-1" /> Add Topic
                  </Button>
                </div>

                <div className="space-y-3">
                  {outline.topics.map((topic, ti) => (
                    <Card key={ti} className="border-muted">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2 mb-2">
                          <Input
                            value={topic.icon}
                            onChange={(e) => updateTopic(ti, "icon", e.target.value)}
                            className="h-7 w-12 text-center text-sm p-0"
                          />
                          <div className="flex-1 space-y-1">
                            <Input
                              value={topic.name}
                              onChange={(e) => updateTopic(ti, "name", e.target.value)}
                              className="h-7 text-sm font-semibold"
                              placeholder="Topic name"
                            />
                            <Input
                              value={topic.description}
                              onChange={(e) => updateTopic(ti, "description", e.target.value)}
                              className="h-7 text-xs"
                              placeholder="Brief description..."
                            />
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => deleteTopic(ti)}>
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        </div>

                        <div className="ml-14 space-y-1">
                          {topic.skills.map((skill, si) => (
                            <div key={si} className="flex items-center gap-1.5 group">
                              <BookOpen className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                              <InlineEdit
                                value={skill.title}
                                onChange={(v) => updateSkill(ti, si, v)}
                                className="text-sm flex-1"
                                placeholder="Skill title"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => deleteSkill(ti, si)}
                              >
                                <X className="w-3 h-3 text-destructive" />
                              </Button>
                            </div>
                          ))}
                          <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground mt-1" onClick={() => addSkill(ti)}>
                            <Plus className="w-3 h-3 mr-1" /> Add Skill
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setOutline(null)}>Cancel</Button>
            <Button
              onClick={() => outline && generateMutation.mutate(outline)}
              disabled={generateMutation.isPending || !outline?.topics.length}
            >
              {generateMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" />Generating content... 1-2 min</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" />Generate Content</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Step 2: Full Content Preview */}
      <Dialog open={!!fullPreview} onOpenChange={(open) => { if (!open) { setFullPreview(null); } }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{fullPreview?.courseIcon}</span>
              {fullPreview?.courseName} — Content Preview
            </DialogTitle>
          </DialogHeader>

          {fullPreview && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{fullPreview.courseDescription}</p>

              {fullPreview.topics.map((topic, ti) => (
                <Card key={ti}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">{topic.icon}</span>
                      <h3 className="font-semibold text-sm">{topic.name}</h3>
                    </div>
                    <div className="space-y-3">
                      {topic.skills.map((skill, si) => (
                        <div key={si} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                              {skill.title}
                            </h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={() => setActiveChat(activeChat?.topicIdx === ti && activeChat?.skillIdx === si ? null : { topicIdx: ti, skillIdx: si })}
                            >
                              <Sparkles className="w-3 h-3 mr-1" />
                              AI Refine
                            </Button>
                          </div>
                          <div className="max-h-60 overflow-y-auto">
                            <RichContent content={skill.content || ""} className="text-sm" />
                          </div>
                          {activeChat?.topicIdx === ti && activeChat?.skillIdx === si && (
                            <div className="mt-3 border-t pt-3">
                              <AIChatPanel
                                currentContent={skill.content || ""}
                                onContentUpdate={(newContent) => updateFullPreviewSkillContent(ti, si, newContent)}
                                context={`Course: ${fullPreview.courseName}, Topic: ${topic.name}, Skill: ${skill.title}`}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Study Plan Section */}
              <Card className="border-dashed">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    Study Plan (Optional)
                  </h3>
                  <div className="flex items-center gap-3 mb-3">
                    <Label className="text-xs">Days</Label>
                    <Input
                      type="number"
                      value={studyDays}
                      onChange={(e) => setStudyDays(e.target.value)}
                      className="h-8 w-20 text-sm"
                      min={1}
                      max={60}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        setGeneratingPlan(true);
                        try {
                          const topicList = fullPreview.topics.map((t) => ({
                            name: t.name,
                            skillCount: t.skills.length,
                          }));
                          const res = await apiRequest("POST", "/api/admin/study-plan/generate", {
                            courseName: fullPreview.courseName,
                            topics: topicList,
                            totalDays: parseInt(studyDays) || 10,
                          });
                          const data = await res.json();
                          setStudyPlan(data.plan);
                        } catch {
                          toast({ title: "Failed to generate study plan", variant: "destructive" });
                        } finally {
                          setGeneratingPlan(false);
                        }
                      }}
                      disabled={generatingPlan}
                    >
                      {generatingPlan ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                      Generate Plan
                    </Button>
                  </div>

                  {studyPlan && (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {studyPlan.map((day: any, i: number) => (
                        <div key={i} className="flex gap-3 text-xs border-b pb-2 last:border-b-0">
                          <div className="font-semibold text-primary w-12 flex-shrink-0">Day {day.day}</div>
                          <div className="flex-1">
                            {day.topics?.map((t: any, j: number) => (
                              <div key={j}>
                                <span className="font-medium">{t.topicName}</span>
                                <span className="text-muted-foreground ml-1">({t.estimatedHours}h)</span>
                              </div>
                            ))}
                          </div>
                          <div className="text-muted-foreground flex-shrink-0">{day.totalHours}h</div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { setFullPreview(null); }}>Back to Outline</Button>
            <Button
              onClick={() => fullPreview && createMutation.mutate(fullPreview)}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating...</>
              ) : (
                <><Plus className="w-4 h-4 mr-2" />Create Course</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// AI Chat Panel for refining content — used in AI Import preview and card editor
function AIChatPanel({ currentContent, onContentUpdate, context }: {
  currentContent: string;
  onContentUpdate: (newContent: string) => void;
  context?: string;
}) {
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const suggestions = ["Add more examples", "Simplify the explanation", "Add practice questions", "Add more detail"];

  const sendMessage = async (msg: string) => {
    if (!msg.trim() || loading) return;
    const userMsg = msg.trim();
    setMessage("");
    setHistory((h) => [...h, { role: "user", text: userMsg }]);
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/admin/ai-chat", {
        content: currentContent,
        message: userMsg,
        context,
      });
      const data = await res.json();
      setHistory((h) => [...h, { role: "ai", text: "Content updated." }]);
      onContentUpdate(data.content);
    } catch {
      setHistory((h) => [...h, { role: "ai", text: "Failed to refine content. Try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      {history.length > 0 && (
        <div className="max-h-32 overflow-y-auto space-y-1.5 text-xs">
          {history.map((h, i) => (
            <div key={i} className={`flex ${h.role === "user" ? "justify-end" : "justify-start"}`}>
              <span className={`inline-block rounded-lg px-2 py-1 max-w-[80%] ${h.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {h.text}
              </span>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-1">
        {suggestions.map((s) => (
          <Button key={s} variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => sendMessage(s)} disabled={loading}>
            {s}
          </Button>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask AI to refine this content..."
          className="h-8 text-sm"
          onKeyDown={(e) => e.key === "Enter" && sendMessage(message)}
          disabled={loading}
        />
        <Button size="sm" className="h-8" onClick={() => sendMessage(message)} disabled={!message.trim() || loading}>
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Send"}
        </Button>
      </div>
    </div>
  );
}

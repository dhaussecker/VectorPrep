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
import {
  Plus, Pencil, Trash2, BookOpen, ClipboardCheck,
  FolderOpen, Loader2, ImageIcon, Video,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Topic, LearnCard, QuestionTemplate } from "@shared/schema";

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
        <p className="text-muted-foreground text-sm mb-6">Create and manage topics, learn cards, and question templates</p>

        <Tabs defaultValue="topics">
          <TabsList data-testid="tabs-admin">
            <TabsTrigger value="topics" data-testid="tab-topics">
              <FolderOpen className="w-4 h-4 mr-1.5" />
              Topics
            </TabsTrigger>
            <TabsTrigger value="cards" data-testid="tab-cards">
              <BookOpen className="w-4 h-4 mr-1.5" />
              Learn Cards
            </TabsTrigger>
            <TabsTrigger value="templates" data-testid="tab-templates">
              <ClipboardCheck className="w-4 h-4 mr-1.5" />
              Question Templates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="topics">
            <TopicsManager />
          </TabsContent>
          <TabsContent value="cards">
            <CardsManager />
          </TabsContent>
          <TabsContent value="templates">
            <TemplatesManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function TopicsManager() {
  const { toast } = useToast();
  const [editTopic, setEditTopic] = useState<Topic | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: topics, isLoading } = useQuery<Topic[]>({
    queryKey: ["/api/admin/topics"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/topics", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/topics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress/overview"] });
      setShowCreate(false);
      toast({ title: "Topic created" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PUT", `/api/admin/topics/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/topics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress/overview"] });
      setEditTopic(null);
      toast({ title: "Topic updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/topics/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/topics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress/overview"] });
      setDeleteId(null);
      toast({ title: "Topic deleted" });
    },
  });

  if (isLoading) {
    return <div className="space-y-3 mt-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>;
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowCreate(true)} data-testid="button-create-topic">
          <Plus className="w-4 h-4" />
          Add Topic
        </Button>
      </div>

      {topics?.map((topic) => (
        <Card key={topic.id} data-testid={`card-admin-topic-${topic.id}`}>
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="text-2xl flex-shrink-0">{topic.icon}</span>
              <div className="min-w-0">
                <h3 className="font-semibold truncate">{topic.name}</h3>
                <p className="text-xs text-muted-foreground truncate">{topic.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Badge variant="outline">#{topic.orderIndex}</Badge>
              <Button variant="ghost" size="icon" onClick={() => setEditTopic(topic)} data-testid={`button-edit-topic-${topic.id}`}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setDeleteId(topic.id)} data-testid={`button-delete-topic-${topic.id}`}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <TopicFormDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onSubmit={(data) => createMutation.mutate(data)}
        isPending={createMutation.isPending}
        title="Create Topic"
      />

      {editTopic && (
        <TopicFormDialog
          open={!!editTopic}
          onOpenChange={(open) => !open && setEditTopic(null)}
          onSubmit={(data) => updateMutation.mutate({ id: editTopic.id, data })}
          isPending={updateMutation.isPending}
          title="Edit Topic"
          defaultValues={editTopic}
        />
      )}

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Topic?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete the topic and all its learn cards, question templates, and related progress. This cannot be undone.
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

function TopicFormDialog({ open, onOpenChange, onSubmit, isPending, title, defaultValues }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  isPending: boolean;
  title: string;
  defaultValues?: Topic;
}) {
  const [name, setName] = useState(defaultValues?.name || "");
  const [description, setDescription] = useState(defaultValues?.description || "");
  const [icon, setIcon] = useState(defaultValues?.icon || "");
  const [orderIndex, setOrderIndex] = useState(String(defaultValues?.orderIndex ?? 0));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Calculus I" data-testid="input-topic-name" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description..." data-testid="input-topic-description" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Icon/Label</Label>
              <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="e.g. f(x)" data-testid="input-topic-icon" />
            </div>
            <div className="space-y-2">
              <Label>Order</Label>
              <Input type="number" value={orderIndex} onChange={(e) => setOrderIndex(e.target.value)} data-testid="input-topic-order" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSubmit({ name, description, icon, orderIndex: parseInt(orderIndex) || 0 })} disabled={isPending || !name || !description} data-testid="button-submit-topic">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CardsManager() {
  const { toast } = useToast();
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");
  const [editCard, setEditCard] = useState<LearnCard | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: topics } = useQuery<Topic[]>({ queryKey: ["/api/admin/topics"] });

  const { data: cards, isLoading } = useQuery<LearnCard[]>({
    queryKey: ["/api/admin/topics", selectedTopicId, "cards"],
    enabled: !!selectedTopicId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/cards", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/topics", selectedTopicId, "cards"] });
      setShowCreate(false);
      toast({ title: "Learn card created" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PUT", `/api/admin/cards/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/topics", selectedTopicId, "cards"] });
      setEditCard(null);
      toast({ title: "Learn card updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/cards/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/topics", selectedTopicId, "cards"] });
      setDeleteId(null);
      toast({ title: "Learn card deleted" });
    },
  });

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="w-64">
          <Select value={selectedTopicId} onValueChange={setSelectedTopicId}>
            <SelectTrigger data-testid="select-topic-cards">
              <SelectValue placeholder="Select a topic..." />
            </SelectTrigger>
            <SelectContent>
              {topics?.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedTopicId && (
          <Button onClick={() => setShowCreate(true)} data-testid="button-create-card">
            <Plus className="w-4 h-4" />
            Add Card
          </Button>
        )}
      </div>

      {!selectedTopicId && (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Select a topic to manage its learn cards</p>
          </CardContent>
        </Card>
      )}

      {selectedTopicId && isLoading && (
        <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
      )}

      {selectedTopicId && cards?.map((card) => (
        <Card key={card.id} data-testid={`card-admin-learn-${card.id}`}>
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
              <Button variant="ghost" size="icon" onClick={() => setEditCard(card)} data-testid={`button-edit-card-${card.id}`}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setDeleteId(card.id)} data-testid={`button-delete-card-${card.id}`}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {selectedTopicId && cards?.length === 0 && (
        <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">No learn cards yet. Create one above.</CardContent></Card>
      )}

      {showCreate && (
        <CardFormDialog
          open={showCreate}
          onOpenChange={setShowCreate}
          onSubmit={(data) => createMutation.mutate({ ...data, topicId: selectedTopicId })}
          isPending={createMutation.isPending}
          title="Create Learn Card"
        />
      )}

      {editCard && (
        <CardFormDialog
          open={!!editCard}
          onOpenChange={(open) => !open && setEditCard(null)}
          onSubmit={(data) => updateMutation.mutate({ id: editCard.id, data })}
          isPending={updateMutation.isPending}
          title="Edit Learn Card"
          defaultValues={editCard}
        />
      )}

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Learn Card?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This will permanently delete this learn card and any related progress.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending} data-testid="button-confirm-delete-card">
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CardFormDialog({ open, onOpenChange, onSubmit, isPending, title, defaultValues }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  isPending: boolean;
  title: string;
  defaultValues?: LearnCard;
}) {
  const [cardTitle, setCardTitle] = useState(defaultValues?.title || "");
  const [content, setContent] = useState(defaultValues?.content || "");
  const [formula, setFormula] = useState(defaultValues?.formula || "");
  const [quickCheck, setQuickCheck] = useState(defaultValues?.quickCheck || "");
  const [quickCheckAnswer, setQuickCheckAnswer] = useState(defaultValues?.quickCheckAnswer || "");
  const [orderIndex, setOrderIndex] = useState(String(defaultValues?.orderIndex ?? 0));
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const insertAtCursor = useInsertAtCursor(textareaRef, content, setContent);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
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
            <Label>Content (Markdown + LaTeX)</Label>
            <FormulaInsertBar onInsert={insertAtCursor} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Edit</p>
                <Textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={"Write content using Markdown and LaTeX...\n\nUse $...$ for inline math: $f(x) = x^2$\nUse $$...$$ for display math:\n$$\\int_0^1 x\\,dx = \\frac{1}{2}$$"}
                  className="min-h-[250px] font-mono text-sm"
                  data-testid="input-card-content"
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Preview</p>
                <Card className="min-h-[250px] overflow-auto">
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
              <Label>Cheat Sheet Formula (optional)</Label>
              <Badge variant="outline" className="text-[10px]">Shows on cheat sheet</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                placeholder='e.g. $$\int_a^b f(x)\,dx$$'
                className="font-mono text-sm"
                data-testid="input-card-formula"
              />
              <Card className="overflow-auto">
                <CardContent className="p-2 min-h-[36px] flex items-center">
                  {formula ? (
                    <RichContent content={formula} className="text-sm" />
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Formula preview...</p>
                  )}
                </CardContent>
              </Card>
            </div>
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSubmit({ title: cardTitle, content, formula: formula || null, quickCheck: quickCheck || null, quickCheckAnswer: quickCheckAnswer || null, orderIndex: parseInt(orderIndex) || 0 })} disabled={isPending || !cardTitle || !content} data-testid="button-submit-card">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TemplatesManager() {
  const { toast } = useToast();
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");
  const [editTemplate, setEditTemplate] = useState<QuestionTemplate | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: topics } = useQuery<Topic[]>({ queryKey: ["/api/admin/topics"] });

  const { data: templates, isLoading } = useQuery<QuestionTemplate[]>({
    queryKey: ["/api/admin/topics", selectedTopicId, "templates"],
    enabled: !!selectedTopicId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/templates", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/topics", selectedTopicId, "templates"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/admin/topics", selectedTopicId, "templates"] });
      setEditTemplate(null);
      toast({ title: "Question template updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/topics", selectedTopicId, "templates"] });
      setDeleteId(null);
      toast({ title: "Question template deleted" });
    },
  });

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="w-64">
          <Select value={selectedTopicId} onValueChange={setSelectedTopicId}>
            <SelectTrigger data-testid="select-topic-templates">
              <SelectValue placeholder="Select a topic..." />
            </SelectTrigger>
            <SelectContent>
              {topics?.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedTopicId && (
          <Button onClick={() => setShowCreate(true)} data-testid="button-create-template">
            <Plus className="w-4 h-4" />
            Add Template
          </Button>
        )}
      </div>

      {!selectedTopicId && (
        <Card>
          <CardContent className="p-8 text-center">
            <ClipboardCheck className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Select a topic to manage its question templates</p>
          </CardContent>
        </Card>
      )}

      {selectedTopicId && isLoading && (
        <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
      )}

      {selectedTopicId && templates?.map((template) => (
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

      {selectedTopicId && templates?.length === 0 && (
        <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">No question templates yet. Create one above.</CardContent></Card>
      )}

      {showCreate && (
        <TemplateFormDialog
          open={showCreate}
          onOpenChange={setShowCreate}
          onSubmit={(data) => createMutation.mutate({ ...data, topicId: selectedTopicId })}
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
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
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

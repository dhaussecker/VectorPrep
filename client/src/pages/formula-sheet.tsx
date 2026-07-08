import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { RichContent } from "@/components/rich-content";

type FormulaEntry = {
  id: string;
  formula: string;
  source: "preset" | "user";
};

type ContentGroup = {
  contentId: string;
  contentTitle: string;
  formulas: FormulaEntry[];
};

type Section = {
  tool: { id: string; name: string; icon: string; courseId?: string | null };
  groups: ContentGroup[];
};

export default function FormulaSheetPage() {
  const { data, isLoading } = useQuery<Section[]>({
    queryKey: ["/api/cheatsheet"],
  });

  // Only show sections/groups where the user has explicitly unlocked formulas (source: "user")
  const unlocked = (data ?? [])
    .map((section) => ({
      ...section,
      groups: section.groups
        .map((g) => ({ ...g, formulas: g.formulas.filter((f) => f.source === "user") }))
        .filter((g) => g.formulas.length > 0),
    }))
    .filter((section) => section.groups.length > 0);

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", color: "white" }} className="pb-32 md:pb-10">

      {/* Header */}
      <div style={{ padding: "40px 24px 28px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 11, fontFamily: "monospace", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>
          Your collection
        </p>
        <h1 style={{ fontSize: 42, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1 }}>Formula Sheet.</h1>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px" }}>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" style={{ background: "#151515" }} />
            ))}
          </div>
        ) : unlocked.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📋</div>
            <p style={{ fontWeight: 900, fontSize: 20, marginBottom: 8, color: "rgba(255,255,255,0.6)" }}>
              Nothing here yet
            </p>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.25)", maxWidth: 280, margin: "0 auto" }}>
              Complete stages in your quests and formulas will automatically appear here.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {unlocked.map((section) => (
              <div key={section.tool.id}>
                {/* Section header */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <span style={{ fontSize: 22 }}>{section.tool.icon}</span>
                  <h2 style={{ fontWeight: 900, fontSize: 18, letterSpacing: "-0.01em" }}>{section.tool.name}</h2>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {section.groups.map((group) => (
                    group.formulas.map((entry) => (
                      <FormulaCard key={entry.id} title={group.contentTitle} formula={entry.formula} />
                    ))
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FormulaCard({ title, formula }: { title: string; formula: string }) {
  return (
    <div style={{
      background: "#111",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 16,
      padding: "18px 22px",
    }}>
      <p style={{ fontSize: 11, fontFamily: "monospace", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
        {title}
      </p>
      <div className="[&_.katex]:text-[1.5rem] [&_.katex-display]:my-0 [&_p]:m-0" style={{ color: "white" }}>
        <RichContent content={formula} />
      </div>
    </div>
  );
}

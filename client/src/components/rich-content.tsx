import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import { useRef, useCallback } from "react";
import "katex/dist/katex.min.css";

interface RichContentProps {
  content: string;
  className?: string;
  onAddFormula?: (formula: string) => void;
}

export function RichContent({ content, className = "", onAddFormula }: RichContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!onAddFormula) return;
    const target = e.target as HTMLElement;
    // Check if click was on or inside a .formula-add-btn
    const btn = target.closest(".formula-add-btn");
    if (!btn) return;

    // Find the nearest .katex-display ancestor
    const display = btn.closest(".katex-display-wrap")?.querySelector(".katex-display");
    if (!display) return;

    const annotation = display.querySelector("annotation");
    if (annotation?.textContent) {
      onAddFormula(annotation.textContent);
    }
  }, [onAddFormula]);

  return (
    <div
      className={`rich-content ${className} ${onAddFormula ? "has-formula-buttons" : ""}`}
      ref={containerRef}
      onClick={handleClick}
    >
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // rehype-katex wraps display math in a <p> containing <span class="katex-display">
          // We override <p> to detect and wrap display math with a button
          p: ({ children, node }) => {
            const hasBlock = Array.isArray(children) && children.some(
              (child: any) => typeof child === "object" && child?.type && ["img", "video", "iframe"].includes(child.type)
            );
            if (hasBlock) return <div className="my-2">{children}</div>;

            // Check if this paragraph contains display math (katex-display)
            if (onAddFormula && node) {
              const hasDisplayMath = node.children?.some(
                (child: any) =>
                  child.type === "element" &&
                  child.properties?.className?.includes("katex-display")
              );
              if (hasDisplayMath) {
                return (
                  <div className="katex-display-wrap my-2 leading-relaxed" style={{ position: "relative" }}>
                    {children}
                    <button
                      type="button"
                      className="formula-add-btn"
                      title="Add to cheat sheet"
                      style={{
                        position: "absolute",
                        top: "2px",
                        right: "2px",
                        width: "28px",
                        height: "28px",
                        borderRadius: "6px",
                        background: "hsl(var(--primary) / 0.1)",
                        color: "hsl(var(--primary))",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: 0,
                        transition: "opacity 0.15s",
                        zIndex: 10,
                        border: "none",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "hsl(var(--primary) / 0.2)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "hsl(var(--primary) / 0.1)";
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </button>
                  </div>
                );
              }
            }

            return <p className="my-2 leading-relaxed">{children}</p>;
          },
          img: ({ src, alt }) => (
            <img
              src={src}
              alt={alt || ""}
              className="max-w-full rounded-md my-2"
              loading="lazy"
            />
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2"
            >
              {children}
            </a>
          ),
          code: ({ className: codeClassName, children, ...props }) => {
            const isInline = !codeClassName;
            if (isInline) {
              return (
                <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <pre className="bg-muted rounded-md p-3 overflow-x-auto my-3">
                <code className={`text-sm font-mono ${codeClassName || ""}`} {...props}>
                  {children}
                </code>
              </pre>
            );
          },
          ul: ({ children }) => <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="text-sm">{children}</li>,
          h1: ({ children }) => <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-semibold mt-3 mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-semibold mt-2 mb-1">{children}</h3>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-primary/50 pl-4 my-3 text-muted-foreground italic">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-border bg-muted px-3 py-1.5 text-left font-medium">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-3 py-1.5">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
      {onAddFormula && (
        <style>{`
          .katex-display-wrap:hover .formula-add-btn {
            opacity: 1 !important;
          }
        `}</style>
      )}
    </div>
  );
}

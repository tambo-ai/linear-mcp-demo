import { useTambo } from "@tambo-ai/react";
import mermaid from "mermaid";
import * as React from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Loader2Icon, X } from "lucide-react";

// Types for diagram rendering
export const renderDiagramSchema = z.object({
  diagram: z
    .string()
    .describe("Mermaid diagram definition string (e.g., 'graph TD; A-->B;')"),
  title: z.string().optional().describe("Optional title for the diagram"),
  theme: z
    .enum(["default", "dark", "forest", "base", "neutral"])
    .optional()
    .default("default")
    .describe("Mermaid theme to use for rendering"),
  width: z
    .string()
    .optional()
    .default("100%")
    .describe("Width of the diagram container (CSS value)"),
  height: z
    .string()
    .optional()
    .default("400px")
    .describe("Height of the diagram container (CSS value)"),
});

export type RenderDiagramProps = z.infer<typeof renderDiagramSchema>;

export const RenderDiagram: React.FC<RenderDiagramProps> = ({
  diagram,
  title,
  theme = "default",
  width = "100%",
  height = "400px",
}) => {
  const { thread } = useTambo();
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [lastValidSvg, setLastValidSvg] = React.useState<string | null>(null);
  const diagramRef = React.useRef<HTMLDivElement>(null);
  const diagramId = React.useId();

  const isComplete =
    thread?.generationStage === "COMPLETE" ||
    thread?.generationStage === "IDLE";

  // Initialize Mermaid once
  React.useEffect(() => {
    if (!isInitialized) {
      mermaid.initialize({
        startOnLoad: false,
        theme: theme,
        securityLevel: "loose",
        fontFamily: "inherit",
      });
      setIsInitialized(true);
    }
  }, [theme, isInitialized]);

  // Render diagram when initialized or diagram changes
  React.useEffect(() => {
    if (!isInitialized || !diagram || !diagramRef.current) return;

    const renderDiagram = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Clear previous content
        if (diagramRef.current) {
          diagramRef.current.innerHTML = "";
        }

        // Validate and render the diagram
        const { svg } = await mermaid.render(`diagram-${diagramId}`, diagram);

        // Store the last valid SVG
        setLastValidSvg(svg);

        // Only update the DOM if we're not streaming or if this is a valid diagram
        if (isComplete || !error) {
          if (diagramRef.current) {
            diagramRef.current.innerHTML = svg;
          }
        }
      } catch (err) {
        console.error("Failed to render diagram:", err);
        setError(
          err instanceof Error
            ? `Invalid diagram syntax: ${err.message}`
            : "Failed to render diagram",
        );

        // If we're not streaming, show the error
        if (isComplete) {
          if (diagramRef.current) {
            diagramRef.current.innerHTML = "";
          }
        } else {
          // During streaming, keep showing the last valid diagram
          if (diagramRef.current && lastValidSvg) {
            diagramRef.current.innerHTML = lastValidSvg;
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    renderDiagram();
  }, [isInitialized, diagram, diagramId, isComplete, lastValidSvg, error]);

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-sm font-medium text-gray-900 mb-2">{title}</h3>
      )}

      <div
        className="relative overflow-hidden rounded-lg bg-white ring-1 ring-gray-100 transition-shadow hover:ring-gray-200"
        style={{ width, height }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-[1px]">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Loader2Icon className="h-3 w-3 animate-spin" />
              <span className="text-gray-600">Rendering diagram...</span>
            </div>
          </div>
        )}

        {error && isComplete && (
          <div className="absolute inset-0 flex items-center justify-center bg-white">
            <div className="px-4 py-3 rounded-md bg-red-50 max-w-md w-full mx-4">
              <div className="flex items-center gap-2 mb-1">
                <X className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium text-red-800">
                  Diagram Error
                </span>
              </div>
              <p className="text-sm text-red-700 leading-relaxed">
                {error}
              </p>
            </div>
          </div>
        )}

        <div
          ref={diagramRef}
          className={cn(
            "w-full h-full flex items-center justify-center overflow-auto p-4",
            isLoading ? "opacity-0" : "opacity-100",
            "transition-opacity duration-200"
          )}
        >
          {/* Mermaid diagram will be rendered here */}
        </div>
      </div>
    </div>
  );
};

RenderDiagram.displayName = "RenderDiagram";

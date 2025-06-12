import { useTambo } from "@tambo-ai/react";
import mermaid from "mermaid";
import * as React from "react";
import { z } from "zod";

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
        <h3 className="text-lg font-semibold mb-3 text-gray-800">{title}</h3>
      )}

      <div
        className="border border-gray-200 rounded-lg bg-white shadow-sm"
        style={{ width, height }}
      >
        {isLoading && (
          <div className="h-full flex items-center justify-center">
            <div className="flex items-center gap-2 text-gray-500">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              Rendering diagram...
            </div>
          </div>
        )}

        {error && isComplete && (
          <div className="h-full flex items-center justify-center p-4">
            <div className="text-center">
              <div className="text-red-600 font-medium mb-2">Diagram Error</div>
              <div className="text-sm text-gray-600 max-w-md">{error}</div>
            </div>
          </div>
        )}

        <div
          ref={diagramRef}
          className="w-full h-full flex items-center justify-center overflow-auto"
          style={{ display: isLoading ? "none" : "flex" }}
        />
      </div>
    </div>
  );
};

RenderDiagram.displayName = "RenderDiagram";

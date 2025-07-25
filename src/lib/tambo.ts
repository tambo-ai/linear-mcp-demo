/**
 * @file tambo.ts
 * @description Central configuration file for Tambo components and tools
 *
 * This file serves as the central place to register your Tambo components and tools.
 * It exports arrays that will be used by the TamboProvider.
 *
 * Read more about Tambo at https://tambo.co/docs
 */

import { DataCard, dataCardSchema } from "@/components/ui/card-data";
import {
  EditableIssueTableWithTamboSave,
  editableIssueTableSchema,
} from "@/components/ui/editable-issue-table";
import { Graph, graphSchema } from "@/components/ui/graph";
import {
  RenderDiagram,
  renderDiagramSchema,
} from "@/components/ui/render-diagram";
import type { TamboComponent } from "@tambo-ai/react";
import { TamboTool } from "@tambo-ai/react";

/**
 * tools
 *
 * This array contains all the Tambo tools that are registered for use within the application.
 * Each tool is defined with its name, description, and expected props. The tools
 * can be controlled by AI to dynamically fetch data based on user interactions.
 */

export const tools: TamboTool[] = [
  // Set the MCP tools https://localhost:3000/mcp-config
  // Add non MCP tools here
];

/**
 * components
 *
 * This array contains all the Tambo components that are registered for use within the application.
 * Each component is defined with its name, description, and expected props. The components
 * can be controlled by AI to dynamically render UI elements based on user interactions.
 */
export const components: TamboComponent[] = [
  {
    name: "Graph",
    description:
      "Use this when you want to display a chart. It supports bar, line, and pie charts. When you see data generally use this component.",
    component: Graph,
    propsSchema: graphSchema,
  },
  {
    name: "DataCards",
    description:
      "Use this when you want to display a list of information (>2 elements) that user might want to select from. Not anything that is a list or has links. ",
    component: DataCard,
    propsSchema: dataCardSchema,
  },
  {
    name: "EditableIssueTable",
    description:
      "Displays a table of Linear issues with inline editing for title, description, assignee, and status. Allows batch saving of changes. Use when you want to let users review and edit multiple issues at once.",
    component: EditableIssueTableWithTamboSave,
    propsSchema: editableIssueTableSchema,
  },
  {
    name: "RenderDiagram",
    description:
      "Renders Mermaid diagrams in the browser. Use this when you want to display flowcharts, sequence diagrams, gantt charts, or any other diagram that can be defined with Mermaid syntax. Supports different themes and customizable dimensions.",
    component: RenderDiagram,
    propsSchema: renderDiagramSchema,
  },
  // Add more components here
];

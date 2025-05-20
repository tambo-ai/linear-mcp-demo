import * as React from "react";
import { z } from "zod";

// Types for issues, people, and statuses
export const editableIssueTableSchema = z.object({
  issues: z.array(
    z.object({
      id: z.string().describe("Unique issue ID"),
      title: z.string().describe("Issue title"),
      description: z.string().describe("Issue description"),
      assigneeId: z.string().nullable().describe("Assignee user ID (nullable)"),
      status: z
        .string()
        .describe("Status value (should match one of statuses)"),
      lastUpdated: z.string().describe("Last updated ISO string"),
    }),
  ),
  people: z.array(
    z.object({
      id: z.string().describe("User ID"),
      name: z.string().describe("User display name"),
      avatarUrl: z.string().optional().describe("Avatar URL (optional)"),
    }),
  ),
  statuses: z.array(
    z.object({
      value: z.string().describe("Status value"),
      label: z.string().describe("Status display label"),
    }),
  ),
  onSave: z
    .function()
    .args(
      z.array(
        z.object({
          id: z.string(),
          changes: z.object({
            title: z.string().optional(),
            description: z.string().optional(),
            assigneeId: z.string().nullable().optional(),
            status: z.string().optional(),
          }),
        }),
      ),
    )
    .returns(z.void()),
});

export type EditableIssueTableProps = z.infer<typeof editableIssueTableSchema>;

export const EditableIssueTable: React.FC<EditableIssueTableProps> = ({
  issues,
  people,
  statuses,
  onSave,
}) => {
  // TODO: Replace manual loading state with useMutation from react-query
  const [editState, setEditState] = React.useState(() => {
    // Map of issueId -> { ...fields }
    const state: Record<
      string,
      Partial<
        Omit<EditableIssueTableProps["issues"][number], "id" | "lastUpdated">
      >
    > = {};
    return state;
  });
  const [isSaving, setIsSaving] = React.useState(false);

  const handleFieldChange = (
    id: string,
    field: string,
    value: string | null,
  ) => {
    if (isSaving) return;
    setEditState((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    const changes = Object.entries(editState)
      .filter(([idFields]) => Object.keys(editState[idFields]).length > 0)
      .map(([id, fields]) => ({ id, changes: fields }));
    if (changes.length > 0) {
      setIsSaving(true);
      try {
        await onSave(changes);
        setEditState({});
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border text-sm bg-white">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-3 py-2 border-b text-left">ID</th>
            <th className="px-3 py-2 border-b text-left">Title</th>
            <th className="px-3 py-2 border-b text-left">Description</th>
            <th className="px-3 py-2 border-b text-left">Assignee</th>
            <th className="px-3 py-2 border-b text-left">Status</th>
            <th className="px-3 py-2 border-b text-left">Last Updated</th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue) => {
            const edited = editState[issue.id] || {};
            return (
              <tr key={issue.id} className="border-b hover:bg-gray-50">
                <td className="px-3 py-2 font-mono text-xs text-gray-500">
                  {issue.id}
                </td>
                <td className="px-3 py-2">
                  <input
                    className="w-full border rounded px-1 py-0.5 text-sm"
                    value={edited.title ?? issue.title}
                    onChange={(e) =>
                      handleFieldChange(issue.id, "title", e.target.value)
                    }
                    disabled={isSaving}
                  />
                </td>
                <td className="px-3 py-2">
                  <textarea
                    className="w-full border rounded px-1 py-0.5 text-sm"
                    value={edited.description ?? issue.description}
                    onChange={(e) =>
                      handleFieldChange(issue.id, "description", e.target.value)
                    }
                    rows={2}
                    disabled={isSaving}
                  />
                </td>
                <td className="px-3 py-2">
                  <select
                    className="w-full border rounded px-1 py-0.5 text-sm"
                    value={edited.assigneeId ?? issue.assigneeId ?? ""}
                    onChange={(e) =>
                      handleFieldChange(
                        issue.id,
                        "assigneeId",
                        e.target.value || null,
                      )
                    }
                    disabled={isSaving}
                  >
                    <option value="">Unassigned</option>
                    {people.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <select
                    className="w-full border rounded px-1 py-0.5 text-sm"
                    value={edited.status ?? issue.status}
                    onChange={(e) =>
                      handleFieldChange(issue.id, "status", e.target.value)
                    }
                    disabled={isSaving}
                  >
                    {statuses.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2 text-xs text-gray-400">
                  {new Date(issue.lastUpdated).toLocaleString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="mt-3 flex justify-end">
        <button
          className="bg-blue-600 text-white px-4 py-1.5 rounded shadow hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          onClick={handleSave}
          disabled={Object.keys(editState).length === 0 || isSaving}
        >
          {isSaving && (
            <svg className="animate-spin h-4 w-4 mr-1" viewBox="0 0 24 24">
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
          )}
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

EditableIssueTable.displayName = "EditableIssueTable";

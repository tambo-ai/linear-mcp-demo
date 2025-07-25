import { useTamboThread } from "@tambo-ai/react";
import * as React from "react";
import { z } from "zod";

// Types for issues, people, and statuses
export const editableIssueTableSchema = z.object({
  issues: z
    .array(
      z.object({
        id: z.string().describe("Raw issue ID from the API"),
        identifier: z
          .string()
          .describe("Issue identifier e.g. XYZ-123")
          .optional(),
        title: z.string().describe("Issue title"),
        description: z.string().describe("Issue description"),
        assigneeId: z
          .string()
          .nullable()
          .describe("Assignee user ID (nullable)"),
        status: z
          .string()
          .describe("Status value (should match one of statuses)"),
        priority: z
          .number()
          .describe(
            "Priority level: 0 = No priority, 1 = Urgent, 2 = High, 3 = Normal, 4 = Low",
          ),
        lastUpdated: z.string().describe("Last updated ISO string"),
      }),
    )
    .describe("Array of issues to display or triage"),
  people: z
    .array(
      z.object({
        id: z.string().describe("Raw user ID from the API"),
        name: z.string().describe("User display name"),
        avatarUrl: z.string().optional().describe("Avatar URL (optional)"),
      }),
    )
    .describe(
      "Array of all users in the organization. Query linear for an authoritative list by calling list_users before displaying",
    ),
  statuses: z
    .array(
      z.object({
        value: z.string().describe("Status id from the API"),
        label: z.string().describe("Status display label from the API"),
      }),
    )
    .describe(
      "Array of all possible statuses for issues, in the organization. Query linear for an authoritativelist before displaying",
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
            priority: z.number().optional(),
          }),
        }),
      ),
    )
    .returns(z.promise(z.void())),
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
        [field]: field === "priority" ? (value ? Number(value) : 0) : value,
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
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">ID</th>
            <th className="px-4 py-2 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">Title</th>
            <th className="px-4 py-2 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">Description</th>
            <th className="px-4 py-2 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">Assignee</th>
            <th className="px-4 py-2 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
            <th className="px-4 py-2 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">Priority</th>
            <th className="px-4 py-2 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">Last Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {issues?.map((issue) => {
            const edited = editState[issue.identifier ?? issue.id] || {};
            return (
              <tr key={issue.id} className="group hover:bg-gray-50/50">
                <td className="px-4 py-2 font-mono text-xs text-gray-500">
                  {issue.identifier ?? issue.id}
                </td>
                <td className="px-4 py-2">
                  <input
                    className="w-full bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 py-0.5"
                    value={edited.title ?? issue.title}
                    onChange={(e) =>
                      handleFieldChange(
                        issue.identifier ?? issue.id,
                        "title",
                        e.target.value,
                      )
                    }
                    disabled={isSaving}
                  />
                </td>
                <td className="px-4 py-2">
                  <textarea
                    className="w-full bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 py-0.5 min-h-[2.5rem]"
                    value={edited.description ?? issue.description}
                    onChange={(e) =>
                      handleFieldChange(
                        issue.identifier ?? issue.id,
                        "description",
                        e.target.value,
                      )
                    }
                    rows={2}
                    disabled={isSaving}
                  />
                </td>
                <td className="px-4 py-2">
                  <select
                    className="w-full bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 py-0.5 cursor-pointer"
                    value={edited.assigneeId ?? issue.assigneeId ?? ""}
                    onChange={(e) =>
                      handleFieldChange(
                        issue.identifier ?? issue.id,
                        "assigneeId",
                        e.target.value || null,
                      )
                    }
                    disabled={isSaving}
                  >
                    <option value="">Unassigned</option>
                    {people?.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2">
                  <select
                    className="w-full bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 py-0.5 cursor-pointer"
                    value={edited.status ?? issue.status}
                    onChange={(e) =>
                      handleFieldChange(
                        issue.identifier ?? issue.id,
                        "status",
                        e.target.value,
                      )
                    }
                    disabled={isSaving}
                  >
                    {statuses?.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2">
                  <select
                    className="w-full bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 py-0.5 cursor-pointer"
                    value={edited.priority ?? issue.priority ?? 0}
                    onChange={(e) =>
                      handleFieldChange(
                        issue.identifier ?? issue.id,
                        "priority",
                        e.target.value,
                      )
                    }
                    disabled={isSaving}
                  >
                    <option value={0}>No priority</option>
                    <option value={1}>Urgent</option>
                    <option value={2}>High</option>
                    <option value={3}>Normal</option>
                    <option value={4}>Low</option>
                  </select>
                </td>
                <td className="px-4 py-2 text-xs text-gray-400">
                  {new Date(issue.lastUpdated).toLocaleString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="mt-4 flex justify-end">
        <button
          className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
          onClick={handleSave}
          disabled={Object.keys(editState).length === 0 || isSaving}
        >
          {isSaving && (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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

/**
 * Wrapper component that handles onSave by sending a message to Tambo via sendThreadMessage.
 * Accepts all EditableIssueTableProps except onSave.
 */
export type EditableIssueTableWithTamboSaveProps = Omit<
  EditableIssueTableProps,
  "onSave"
>;

export const EditableIssueTableWithTamboSave: React.FC<
  EditableIssueTableWithTamboSaveProps
> = (props) => {
  const { sendThreadMessage } = useTamboThread();

  // Forward all props except onSave
  const handleSave = async (
    changes: Array<{
      id: string;
      changes: {
        title?: string;
        description?: string;
        assigneeId?: string | null;
        status?: string;
        priority?: number;
      };
    }>,
  ) => {
    // Format changes as a nicely formatted markdown message
    const formatPriority = (priority: number) => {
      const priorities = {
        0: "No priority",
        1: "Urgent",
        2: "High",
        3: "Normal",
        4: "Low",
      };
      return priorities[priority as keyof typeof priorities] || "Unknown";
    };

    let content = "## Linear Issue Updates\n\n";
    content += `Please update the following ${changes.length} issue${
      changes.length > 1 ? "s" : ""
    } in Linear:\n\n`;

    changes.forEach((change, index) => {
      content += `### Issue ${change.id}\n\n`;

      const changeFields = Object.entries(change.changes);
      if (changeFields.length > 0) {
        changeFields.forEach(([field, value]) => {
          const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
          let displayValue = value;

          if (field === "priority" && typeof value === "number") {
            displayValue = formatPriority(value);
          } else if (field === "assigneeId") {
            displayValue = value || "Unassigned";
          }

          content += `- **${fieldName}**: ${displayValue}\n`;
        });
      }

      if (index < changes.length - 1) {
        content += "\n";
      }
    });

    await sendThreadMessage(content);
  };

  return <EditableIssueTable {...props} onSave={handleSave} />;
};

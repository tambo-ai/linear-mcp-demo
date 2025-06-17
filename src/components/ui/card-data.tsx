"use client";

import { cn } from "@/lib/utils";
import { useTamboComponentState } from "@tambo-ai/react";
import * as React from "react";
import { z } from "zod";

// Define option type for individual options in the multi-select
export type DataCardItem = {
  id: string;
  label: string;
  value: string;
  description?: string;
  url?: string;
};

// Define the component state type
export type DataCardState = {
  selectedValues: string[];
};

// Define the component props schema with Zod
export const dataCardSchema = z.object({
  title: z.string().describe("Title displayed above the data cards"),
  options: z
    .array(
      z.object({
        id: z.string().describe("Unique identifier for this card"),
        label: z.string().describe("Display text for the card title"),
        value: z.string().describe("Value associated with this card"),
        description: z
          .string()
          .optional()
          .describe("Optional summary for the card"),
        url: z
          .string()
          .optional()
          .describe("Optional URL for the card to navigate to"),
      })
    )
    .describe("Array of selectable cards to display"),
});

// Define the props type based on the Zod schema
export type DataCardProps = z.infer<typeof dataCardSchema> &
  React.HTMLAttributes<HTMLDivElement>;

/**
 * DataCard Component
 *
 * A component that displays options as clickable cards with links and summaries
 * with the ability to select multiple items.
 */
export const DataCard = React.forwardRef<HTMLDivElement, DataCardProps>(
  ({ title, options, className, ...props }, ref) => {
    // Initialize Tambo component state
    const [state, setState] = useTamboComponentState<DataCardState>(
      `data-card`,
      { selectedValues: [] }
    );

    // Handle option selection
    const handleToggleCard = (value: string) => {
      if (!state) return;

      const selectedValues = [...state.selectedValues];
      const index = selectedValues.indexOf(value);

      // Toggle selection
      if (index > -1) {
        // Remove if already selected
        selectedValues.splice(index, 1);
      } else {
        selectedValues.push(value);
      }

      // Update component state
      setState({ selectedValues });
    };

    // Handle navigation to URL
    const handleNavigate = (url?: string) => {
      if (url) {
        // Added "noopener,noreferrer" to prevent reverse-tabnabbing
        window.open(url, "_blank", "noopener,noreferrer");
      }
    };

    return (
      <div ref={ref} className={cn("w-full space-y-4", className)} {...props}>
        {title && (
          <h2 className="text-sm font-medium text-gray-900">{title}</h2>
        )}

        <div className="space-y-1">
          {options?.map((card) => (
            <div
              key={card.id}
              className={cn(
                "group relative rounded-md transition-all duration-100",
                "hover:bg-gray-50/75"
              )}
            >
              <div
                className={cn(
                  "flex items-start p-2.5",
                  state?.selectedValues.includes(card.value) &&
                    "bg-gray-50/90"
                )}
              >
                <div
                  className="flex-shrink-0 mr-3 mt-0.5 cursor-pointer"
                  onClick={() => handleToggleCard(card.value)}
                >
                  <div
                    className={cn(
                      "w-4 h-4 rounded transition-all duration-100",
                      "border border-gray-200",
                      "flex items-center justify-center",
                      state?.selectedValues.includes(card.value)
                        ? "bg-blue-500 border-blue-500"
                        : "hover:border-gray-300"
                    )}
                  >
                    {state?.selectedValues.includes(card.value) && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-2.5 w-2.5 text-white"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() =>
                    card.url
                      ? handleNavigate(card.url)
                      : handleToggleCard(card.value)
                  }
                >
                  <h3
                    className={cn(
                      "text-sm font-medium text-gray-900",
                      "group-hover:text-gray-900",
                      state?.selectedValues.includes(card.value) &&
                        "text-gray-900"
                    )}
                  >
                    {card.label}
                  </h3>
                  {card.description && (
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                      {card.description}
                    </p>
                  )}
                  {card.url && (
                    <span className="mt-1 text-xs text-gray-400 block truncate">
                      {card.url}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

DataCard.displayName = "DataCard";

export default DataCard;

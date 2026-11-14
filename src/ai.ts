// The AI plug-in slot. Version 1 has no AI, but the rest of the app only
// talks to AI through this interface, so Claude or a local model (Ollama,
// LM Studio) can be added later by writing one new provider here.

import type { AIProvider } from "./model";
import type { Project } from "./model";

export type AssistantTask = "related-scriptures" | "summarize" | "questions";

export interface AssistantRequest {
  task: AssistantTask;
  project: Project;
}

export interface StudyAssistant {
  id: AIProvider;
  label: string;
  /** True when it's set up and ready. */
  ready(): boolean;
  ask(request: AssistantRequest): Promise<string>;
}

const off: StudyAssistant = {
  id: "off",
  label: "Off",
  ready: () => false,
  ask: async () => {
    throw new Error("No assistant is connected.");
  },
};

/** Providers planned for later. Listed so the settings screen can show them. */
export const PLANNED_PROVIDERS: { id: AIProvider; label: string }[] = [
  { id: "claude", label: "Claude (needs an API key; notes are sent to Anthropic)" },
  { id: "local", label: "Local model (Ollama or LM Studio; notes stay on this Mac)" },
];

export function getAssistant(_provider: AIProvider): StudyAssistant {
  // Only "off" exists in version 1.
  return off;
}

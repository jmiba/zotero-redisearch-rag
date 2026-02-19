export const RELEASE_NOTES: Record<string, string[]> = {
  "0.8.1": [
    "Switch What's New splash content to bundled versioned release notes instead of changelog parsing.",
    "Improve update-splash reliability while keeping once-per-version display behavior.",
  ],
  "0.8.0": [
    "Add optional agentic retrieval mode with a lightweight planner step before answer generation.",
    "Add agentic retrieval actions: keep current context, expansion-retry retrieval, and full-document retrieval for synthesis-heavy queries.",
    "Add agentic controls in settings: Enable agentic retrieval and Agentic max iterations.",
    "Extend RAG output with agentic_mode and agentic_trace for debugging and tuning.",
    "Add an animated Thinking indicator in the assistant bubble before response streaming starts.",
    "Add an automatic What's New splash shown once after plugin version updates.",
  ],
};

import type { Assessment } from "./model";

/** A fictional system. "Harborview Public Library" does not exist; nothing here describes a real organisation. */
export function exampleAssessment(): Assessment {
  return {
    schemaVersion: 1,
    overview: {
      name: "Reading Recommender (fictional)",
      owner: "Head of Digital Services, Harborview Public Library (fictional)",
      purpose:
        "Suggests the next books to borrow from a member's own loan history, shown on the member's account page.",
      stage: "pilot",
      deploymentContext:
        "Web account page for adult and teen members, in one city. Staff can switch it off per member. No decisions about access to services are made by it.",
    },
    useCases: [
      { id: "uc-1", description: "Show up to five suggested titles on a member's own account page.", misuse: false },
      { id: "uc-2", description: "Help staff answer 'what is similar to this?' at the desk.", misuse: false },
      {
        id: "uc-3",
        description: "Staff or a partner using the loan history to infer a member's beliefs or health.",
        misuse: true,
      },
    ],
    stakeholders: [
      { id: "sh-1", name: "Adult members", role: "Primary users", vulnerabilityNotes: "" },
      {
        id: "sh-2",
        name: "Teen members (13-17)",
        role: "Primary users",
        vulnerabilityNotes: "Minors; loan history can be sensitive; guardians may not know what they borrow.",
      },
      { id: "sh-3", name: "Library staff", role: "Operators", vulnerabilityNotes: "" },
      { id: "sh-4", name: "Local authors and small presses", role: "Indirectly affected", vulnerabilityNotes: "Visibility depends on what is recommended." },
    ],
    dataAndModel: {
      modelType: "Item-to-item collaborative filtering over borrowing counts (no generative model).",
      dataSources:
        "Pseudonymised loan history and public catalogue metadata. No demographic data. Fictional data for this example.",
      usesPersonalData: true,
      humanOversight:
        "A librarian reviews the top recommended titles monthly and can block a title or switch the feature off per member.",
    },
    impacts: [
      {
        id: "imp-1",
        description: "Members discover books they would not have found, raising borrowing diversity.",
        stakeholderId: "sh-1",
        scope: "individual",
        direction: "benefit",
        severity: 2,
        likelihood: 4,
        mitigation: "",
        residualSeverity: 1,
        residualLikelihood: 1,
      },
      {
        id: "imp-2",
        description: "Recommendations reveal sensitive reading habits to someone sharing the screen or account.",
        stakeholderId: "sh-2",
        scope: "individual",
        direction: "harm",
        severity: 4,
        likelihood: 3,
        mitigation:
          "Off by default for members under 18; sensitive subject categories are excluded; one-click hide; no recommendation text in emails.",
        residualSeverity: 3,
        residualLikelihood: 1,
      },
      {
        id: "imp-3",
        description: "Popularity feedback loop narrows what is shown and starves small presses of visibility.",
        stakeholderId: "sh-4",
        scope: "group",
        direction: "harm",
        severity: 2,
        likelihood: 4,
        mitigation: "Reserve one of five slots for a low-borrowing title; report catalogue coverage quarterly.",
        residualSeverity: 2,
        residualLikelihood: 2,
      },
      {
        id: "imp-4",
        description: "Staff over-trust the suggestions and stop using their own judgement at the desk.",
        stakeholderId: "sh-3",
        scope: "group",
        direction: "harm",
        severity: 2,
        likelihood: 2,
        mitigation: "",
        residualSeverity: 2,
        residualLikelihood: 2,
      },
    ],
    monitoring: {
      indicators:
        "Share of members who hide or switch off the feature; catalogue coverage of suggestions; complaints tagged 'recommender'.",
      reviewCadence: "Every six months, and before any new data source is added.",
      incidentContact: "digital-services@example.invalid",
    },
    review: {
      status: "in-review",
      reviewer: "Data protection lead (fictional)",
      reviewDate: "2026-03-02",
      nextReviewDate: "2026-09-02",
      notes: "Fictional example shipped with ai-governance-toolkit. Not a real assessment.",
    },
  };
}

# 1. Plain data model, no form library

Status: accepted

## Context

The assessment is a tree of strings, booleans, enums and short lists. The valuable logic (completeness, risk, export) must be testable without a browser and reusable if someone wants a CLI or a different UI.

## Decision

The assessment is a plain TypeScript object (`src/lib/model.ts`). All rules live in pure functions under `src/lib/`. React holds one `Assessment` in state and every field calls a single `update(draft => ...)` helper that applies the change to a structured clone. No form library, no state manager, no schema library.

## Consequences

- The domain logic is tested at 99% line coverage without rendering anything.
- Whole-object cloning on each keystroke is fine at this size (a few KB). If an assessment ever holds thousands of items, this needs revisiting.
- Adding a section means touching the model, `validate`, `io` and one view; there is no schema to generate it from.

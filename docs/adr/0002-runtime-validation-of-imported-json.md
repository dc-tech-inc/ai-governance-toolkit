# 2. Runtime validation of imported JSON

Status: accepted

## Context

A user can import any file. TypeScript types do not exist at runtime, so a casted `JSON.parse` result could put a number where the UI expects a string, or an unknown enum value, and fail later in an unrelated place.

## Decision

`fromJSON` in `src/lib/io.ts` checks every field by hand (type, enum membership, 1-5 levels, lists of objects) and throws `ImportError` with the path of the first bad field, for example `impacts[0].severity must be a whole number from 1 to 5`. The file carries a `schemaVersion`; an unknown version is rejected. A failed import leaves the current draft untouched.

## Consequences

- No new dependency, and error messages a person can act on.
- The checker has to be kept in step with the model by hand; the round-trip test (`fromJSON(toJSON(x))` equals `x`) catches a field added to one and not the other.
- It rejects extra unknown fields silently by ignoring them rather than failing; the export never contains them.
- A JSON Schema file for the export is on the roadmap, for people who want to validate outside this app.

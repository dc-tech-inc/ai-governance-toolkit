# 3. Simple severity x likelihood scoring

Status: accepted

## Context

An impact assessment needs some way to say which harms matter most and whether a mitigation helped. The standard this project follows in spirit is guidance and does not hand us a scoring formula, and inventing one that looks official would be misleading.

## Decision

Each harm gets a severity (1-5) and a likelihood (1-5). The score is their product (1-25), banded as low (below 5), moderate (5-9), high (10-14) and critical (15 and above). A harm with a mitigation is re-rated (residual severity and likelihood); a harm without one keeps its inherent score; benefits are rated for size and likelihood but carry no residual risk. The bands and the matrix are in `src/lib/risk.ts`, in one place, so a team can change them.

## Consequences

- It is easy to explain and to audit, and it is a convention, not a method from any standard. The README says so.
- Multiplying ordinal scales is crude: 5x1 and 1x5 score the same. A team that cares about severity-first treatment should change the function, not argue with the number.
- Rating is subjective. The tool records the reasoning (mitigation text) but cannot check it.

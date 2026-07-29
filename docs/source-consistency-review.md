# Source consistency review

## Purpose

Help users notice a narrow set of potentially important differences across verified, source-linked records without pretending that software can determine which record is true.

## Compared values

The initial deterministic review compares only:

- agreed price;
- payment deadline;
- delivery date.

A review item appears only when at least two verified facts belong to the same supported category, have different normalized values, come from different local source records, and retain matching source file IDs and SHA-256 hashes.

Suggested, uncertain, unsupported, missing-source, and hash-mismatched facts are excluded. Agreed-price formatting ignores separators between digits, so `₹5,000` and `₹5000` do not create a false difference.

## User decisions

Users can either select one source-linked value for the organized case record or mark the values as potentially contextual. The decision does not delete, rewrite, downgrade, or hide any verified fact or original record. An optional local note can explain the decision.

Decisions are stored on the local case record with the exact derived conflict ID and participating fact IDs. If the participating facts change, the old decision fails closed and the new comparison returns to unresolved.

## Readiness

Unresolved comparisons reduce only the visible review-completion component of Record Readiness. Resolving a comparison restores that portion. The score remains an organization score and does not measure legal strength, authenticity, credibility, fault, or outcome likelihood.

## Trust and privacy boundaries

A detected difference is a prompt to compare original records, not a finding that either source is false or contradictory. All comparison and decisions are deterministic and local. No new AI call, network request, synchronization permission, or original-byte transfer is introduced.

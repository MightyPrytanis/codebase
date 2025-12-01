---
Document ID: ARCHIVED-STATUS
Title: Status
Subject(s): Archived | One-Off | Limited Utility
Project: Cyrano
Version: v548
Created: Unknown
Last Substantive Revision: Unknown
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Summary: One-off document (status report, completion summary, agent instructions, etc.) archived due to limited current utility.
Status: Archived
---

**ARCHIVED:** This document is a one-off (status report, completion summary, handoff, agent instructions, etc.) and has limited current utility. Archived 2025-11-28.

---

# LexFiat STATUS

Last updated: 2025-09-21 18:58:19 UTC

Purpose

This STATUS.md is the single source of truth for project features, their current status, known obstacles, estimated timelines (ETAs), next actionable steps, and authoritative pointers to where work is tracked (issues and pull requests). All factual statements reference existing repository threads or the user when possible.

Summary of current known threads (as discussed in conversation)

- Issues: #12, #14, #19, #21, #24
- Pull Requests: #11, #13, #15, #16, #17, #18, #20, #22

Notes: These thread numbers were referenced during a repo audit in this conversation. Confirm current live state on GitHub if you need the most recent status.

Feature inventory

1) Copilot instructions (developer guidance)
- Goal: Provide canonical guidance for using GitHub Copilot in this project: prompt phrasing, constraints, validation checks, and merge/PR guidance.
- Current status: Consolidation in progress. Issue #21 is the canonical issue. PR #22 implements the consolidated guidance in draft form. Multiple duplicate issues and PRs (#12, #14, #19 and #13, #15, #20) exist and should be closed as duplicates pointing to #21 / #22.
- Obstacles: Multiple overlapping threads created by Copilot caused fragmentation; content differences need reconciliation.
- ETA: Owner-driven; user has proposed assigning a Copilot agent to complete consolidation before the end of the current month/quarter (user indicated this option).
- Next steps: Close duplicates, finish PR #22, merge when aligned with STATUS.md and project conventions.
- References: issue #21, PR #22, duplicates #12 #14 #19 and PRs #13 #15 #20

2) BYOS: iCloud Storage Adapter
- Goal: Add an iCloud storage adapter as a future option for Bring-Your-Own-Storage (BYOS).
- Current status: Planned; Issue #24 tracks this enhancement (label: enhancement).
- Obstacles: Platform-specific API, authentication/entitlements, privacy considerations.
- ETA: TBD — requires design and an adapter scaffold PR.
- Next steps: Create an adapter design document, prototype auth flow, and draft an adapter PR.
- References: issue #24

3) MAE / MACV refactor and agent API selection scaffold
- Goal: Refactor MACV to MAE and implement agent API selection scaffold (high-level architecture changes).
- Current status: Planning PRs exist: PR #11 (refactor scaffold, draft), PR #18 (initial planning, needs clarification). PR #17 and PR #16 touch related provider setup and persistence priorities.
- Obstacles: Large-surface refactor, potential breaking changes, need for migration plan and tests.
- ETA: Depends on scoping; propose breaking into smaller scaffold PRs with clear milestones.
- Next steps: Author scaffold PRs that implement non-breaking toggles and compatibility shims, add migration docs and tests.
- References: PRs #11, #17, #18, #16

4) Persistence and provider prioritization
- Goal: Re-scope persistence improvements — stronger DB support and encryption, and prioritize AI-provider ordering (Perplexity, etc.) while ensuring user sovereignty.
- Current status: PR #16 contains changes to AI provider setup; it should be re-scoped into a focused persistence & security enhancement.
- Obstacles: Deciding default provider ordering, handling credentials securely, backward compatibility.
- ETA: TBD after scoping into a concrete PR.
- Next steps: Create a persistence design doc, enumerate provider options, and produce a targeted PR.
- References: PR #16

5) UI / Theme and Piquette style
- Goal: Introduce a new style sheet named "Piquette" combining elements of Glass-Ocean, industrial, and modernist/brutalist themes already used in SwimMeet and LexFiat.
- Priority: Low relative to must-have functionality. Visual/aesthetic work should follow functional deliverables.
- Requirements for Piquette (TO-DO):
  - Glass-and-steel international style / minimalist / modernist look
  - Precise, clean edges and right angles with few or no rounded corners
  - Slightly polished/reflective and translucent surfaces
  - Caustic (high-contrast) lighting
  - Color palette: similar to SwimMeet but slightly darker and more saturated aligned with LexFiat's current colorway
- Current status: Not started; add to UI backlog as a lower-priority epic.
- Next steps: Draft the stylesheet and a component theme map; create a PR implementing tokens and sample components.

6) Ethics and Human-AI protocol
- Goal: Provide clear ethical principles and a protocol for Ethical Human-AI interactions in a dedicated Markdown document provided by the project owner.
- Current status: The user will supply the *.md containing general principles and the Ethical Human-AI protocol. Once provided, this document will be added to the repo and linked from STATUS.md.
- Next steps: Await the user's document; then integrate and reference in contributing and CODE_OF_CONDUCT style docs.

Project-level risks & blockers

- Fragmented threads: Duplicates and multiple Copilot-created threads are making it hard to find the single source of truth. Consolidation will reduce cognitive overhead.
- Large refactors: MAE/MACV work is a broad refactor that needs careful scoping to avoid regressions.
- Platform-specific adapters (iCloud): require entitlement and privacy review.
- Security & Persistence: any changes involving secrets, local encryption, or storage must follow secure-by-default patterns.

Administrative notes

- Duplicate-cleanup actions (recommended): Close issues #12, #14, #19 as duplicates of #21; close PRs #13, #15, #20 as superseded by #22. Use the CLI or GitHub UI to add the canonical comments and close.
- Assignments: The user indicated they may assign a Copilot agent to finalize the Copilot instructions before period end; confirm assignment and deadline in the issue or project board.

Acknowledgements & sources

- Thread references: issue and PR numbers are taken from a repo audit performed during this session. For the most up-to-date state, confirm on GitHub: https://github.com/MightyPrytanis/LexFiat
- Design notes: SwimMeet visual language referenced from the user's message; any concrete design assets should be added to the repo's design folder and referenced by commit.

Maintenance

- Keep STATUS.md updated in every release milestone, or when major threads are opened/closed. Treat it as living documentation.

--
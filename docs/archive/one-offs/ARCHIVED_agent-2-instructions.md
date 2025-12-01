---
Document ID: ARCHIVED-AGENT_2_INSTRUCTIONS
Title: Agent 2 Instructions
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

---
Document ID: AGENT-2-INSTRUCTIONS
Title: Agent 2 Instructions
Subject(s): Cyrano | Guide
Project: Cyrano
Version: v548
Created: Unknown
Last Substantive Revision: Unknown
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Status: Active
---

# Instructions for Module Specialist

## Your Focus
Module abstraction, Chronometric module

## Current Tasks
Check `/Users/davidtowne/Desktop/Coding/codebase/Cyrano/.agent-coord/tasks.json` for your assigned tasks.

## How to Work

1. **Check your tasks:**
   ```bash
   npx tsx scripts/agent-coordinator.ts status
   ```

2. **Start working on a task:**
   - Update task status to 'in-progress'
   - Work on the task
   - Update status to 'completed' when done

3. **Update task status:**
   ```bash
   npx tsx scripts/agent-coordinator.ts update <task-id> <status>
   ```

## Available Scripts

- `scripts/generate-tool.ts` - Generate tool boilerplate
- `scripts/generate-module.ts` - Generate module boilerplate
- `scripts/generate-engine.ts` - Generate engine boilerplate
- `scripts/discover-tools.sh` - Discover tools in codebase
- `scripts/analyze-codebase.ts` - Analyze codebase for issues

## Communication

- Log your progress in: `/Users/davidtowne/Desktop/Coding/codebase/Cyrano/.agent-logs/agent-2.log`
- Check for blockers in: `/Users/davidtowne/Desktop/Coding/codebase/Cyrano/.agent-coord/blockers.json`
- Coordinate with other agents via task dependencies

## Priority

Work on tasks in this order:
1. Critical path items (no dependencies)
2. High priority items
3. Medium priority items
4. Low priority items

Good luck!

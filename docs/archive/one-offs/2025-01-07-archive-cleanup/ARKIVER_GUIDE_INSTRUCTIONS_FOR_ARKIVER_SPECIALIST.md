---
Document ID: AGENT-6-INSTRUCTIONS
Title: Instructions for Arkiver Specialist
Subject(s): Arkiver
Project: Cyrano
Version: v548
Created: 2025-11-28 (2025-W48)
Last Substantive Revision: 2025-11-28 (2025-W48)
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Status: Active
---

ArkiverMJ recreation and integration

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

- Log your progress in: `/Users/davidtowne/Desktop/Coding/codebase/Cyrano/.agent-logs/agent-6.log`
- Check for blockers in: `/Users/davidtowne/Desktop/Coding/codebase/Cyrano/.agent-coord/blockers.json`
- Coordinate with other agents via task dependencies

## Priority

Work on tasks in this order:
1. Critical path items (no dependencies)
2. High priority items
3. Medium priority items
4. Low priority items

Good luck!

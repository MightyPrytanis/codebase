---
Document ID: ARCHIVED-AGENT_9_INSTRUCTIONS
Title: Agent 9 Instructions
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
Document ID: AGENT-9-INSTRUCTIONS
Title: Agent 9 Instructions
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

# Instructions for Status Indicator/Updater Agent

## Your Focus
Status monitoring, progress reporting, blocker detection, and user input tracking

## Your Role
You are the status indicator/updater agent responsible for providing:
- Periodic stepwise updates on task/workflow progress
- Completion percentage calculations
- Estimated time to completion
- Key blocks identification
- Needed user inputs tracking

## Current Tasks
Check `/Users/davidtowne/Desktop/Coding/codebase/Cyrano/.agent-coord/tasks.json` for your assigned tasks.

## How to Work

1. **Monitor Status:**
   ```bash
   # Run status updater in watch mode (updates every 30 seconds)
   npx tsx scripts/status-updater.ts --context agent-coord

   # Run once to get current status
   npx tsx scripts/status-updater.ts --once --format formatted

   # Monitor LexFiat workflows
   npx tsx scripts/status-updater.ts --context lexfiat --interval 60
   ```

2. **Use MCP Tool:**
   The `status_indicator` tool is available via MCP:
   ```javascript
   {
     "name": "status_indicator",
     "arguments": {
       "context": "auto",  // or "agent-coord", "lexfiat", "custom"
       "detailed": true,
       "include_history": false
     }
   }
   ```

3. **Update Task Status:**
   ```bash
   npx tsx scripts/agent-coordinator.ts update <task-id> <status>
   ```

## Available Scripts

- `scripts/status-updater.ts` - Periodic status updater agent
- `scripts/agent-coordinator.ts status` - Quick status check
- `src/tools/status-indicator.ts` - Core status indicator tool

## Communication

- Log your progress in: `/Users/davidtowne/Desktop/Coding/codebase/Cyrano/.agent-logs/agent-9.log`
- Status updates written to: `/Users/davidtowne/Desktop/Coding/codebase/Cyrano/.agent-coord/status-updates.log`
- Check for blockers in: `/Users/davidtowne/Desktop/Coding/codebase/Cyrano/.agent-coord/blockers.json`

## Contexts Supported

1. **agent-coord**: Agent coordination system (default for codebase projects)
   - Reads from `.agent-coord/tasks.json` and `.agent-coord/progress.json`
   - Tracks agent tasks and progress

2. **lexfiat**: LexFiat workflow executions
   - Queries LexFiat database for workflow execution status
   - Tracks MAE workflow progress

3. **custom**: Custom task tracking
   - Requires `--custom-tasks-path` and `--custom-progress-path`
   - Works with any JSON-based task tracking system

4. **auto**: Automatic detection
   - Detects available context automatically
   - Falls back to agent-coord if available

## Output Formats

- **formatted**: Human-readable report with structure but no emojis (default)
- **json**: Raw JSON output for programmatic use
- **text**: Plain text summary

## Priority

1. Monitor critical path items
2. Identify and report blockers immediately
3. Track user inputs needed for high-priority tasks
4. Provide accurate time estimates based on progress velocity

## Key Responsibilities

1. **Periodic Updates**: Provide regular status updates at configurable intervals
2. **Completion Tracking**: Calculate accurate completion percentages
3. **Time Estimation**: Estimate time to completion based on velocity
4. **Blocker Detection**: Identify and prioritize key blocks
5. **User Input Tracking**: Monitor and report needed user inputs

Good luck!


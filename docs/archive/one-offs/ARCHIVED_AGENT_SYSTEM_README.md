---
Document ID: ARCHIVED-AGENT_SYSTEM_README
Title: Agent System Readme
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
Document ID: AGENT-SYSTEM-README
Title: Agent System Readme
Subject(s): Cyrano | Reference
Project: Cyrano
Version: v548
Created: Unknown
Last Substantive Revision: Unknown
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Status: Active
---

# Task Management & Coordination System

## Overview

**Important Note:** This is a task management and coordination system, not true multi-agent parallel execution. It helps organize sequential work efficiently with maximum automation.

The system enables efficient sequential development by organizing work into specialized task categories. While work happens sequentially, the task management system helps prioritize, track progress, and coordinate work effectively.

## Quick Start

1. **Initialize the system:**
   ```bash
   bash scripts/launch-agents.sh
   ```

2. **Check status:**
   ```bash
   npx tsx scripts/agent-coordinator.ts status
   ```

3. **View your agent instructions:**
   - Check `.agent-coord/agent-X-instructions.md` for your specific agent

## Available Agents

1. **Tool Specialist** - Tool discovery, implementation, testing
2. **Module Specialist** - Module abstraction, Chronometric module
3. **Engine Specialist** - Engine abstraction, MAE, GoodCounsel, Potemkin
4. **UI/UX Specialist** - LexFiat frontend, integration wiring
5. **Integration Specialist** - External APIs (Clio, Gmail, etc.)
6. **Arkiver Specialist** - ArkiverMJ recreation and integration
7. **DevOps Specialist** - Automation, deployment, infrastructure
8. **Documentation Specialist** - Documentation, cleanup

## Automation Scripts

### Code Generation
- `scripts/generate-tool.ts <tool-name>` - Generate tool boilerplate
- `scripts/generate-module.ts <module-name>` - Generate module boilerplate
- `scripts/generate-engine.ts <engine-name>` - Generate engine boilerplate
- `scripts/generate-tests.ts <type> <name>` - Generate test suites

### Analysis & Discovery
- `scripts/discover-tools.sh` - Discover all tools in codebase
- `scripts/analyze-codebase.ts` - Analyze for mocks, missing code, quality issues

### Coordination
- `scripts/agent-coordinator.ts init` - Initialize coordination system
- `scripts/agent-coordinator.ts assign` - Assign tasks to agents
- `scripts/agent-coordinator.ts status` - Show current status
- `scripts/agent-coordinator.ts update <task-id> <status>` - Update task status

## Working as an Agent

1. **Check your assigned tasks:**
   ```bash
   npx tsx scripts/agent-coordinator.ts status
   ```

2. **Start working on a task:**
   - Update task status: `npx tsx scripts/agent-coordinator.ts update <task-id> in-progress`
   - Work on the task
   - Update when complete: `npx tsx scripts/agent-coordinator.ts update <task-id> completed`

3. **Use automation scripts:**
   - Generate boilerplate instead of writing from scratch
   - Use discovery scripts to find existing code
   - Use analysis scripts to identify issues

4. **Log your progress:**
   - Update task status regularly
   - Document blockers in `.agent-coord/blockers.json`

## Task Status Values

- `ready` - Task is ready to start
- `in-progress` - Task is currently being worked on
- `completed` - Task is finished
- `blocked` - Task is blocked by dependency or issue

## File Structure

```
.agent-coord/
├── tasks.json          # All tasks and their status
├── agents.json         # Agent definitions
├── progress.json       # Overall progress tracking
├── agent-1-instructions.md
├── agent-2-instructions.md
└── ... (instructions for each agent)

.agent-logs/
└── agent-X.log         # Individual agent logs
```

## Best Practices

1. **Work in parallel** - Agents can work simultaneously on independent tasks
2. **Use automation** - Generate boilerplate instead of writing manually
3. **Update status** - Keep task status current for coordination
4. **Communicate blockers** - Document dependencies and issues
5. **Follow priorities** - Critical path items first

## Next Steps

1. Review your agent instructions
2. Check assigned tasks
3. Begin work on ready tasks
4. Use automation scripts to speed up development
5. Update task status as you progress


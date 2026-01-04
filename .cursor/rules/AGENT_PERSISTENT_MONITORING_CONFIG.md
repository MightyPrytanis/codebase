# Agent Persistent Monitoring Configuration

## Overview

Three agents are configured for persistent/cyclical operation:

1. **Executor Agent** - Default agent (alwaysApply: true)
2. **Level Set Agent** - Always running with periodic cyclical scans
3. **Human Task Reminder Agent** - Always running with periodic cyclical scans

## Executor Agent (Default)

**Status:** `alwaysApply: true` - DEFAULT AGENT

**Behavior:**
- Default agent for all tasks
- Delegates to specialized agents when appropriate
- Highest authority and autonomy
- Used when no specialized agent is explicitly better suited

## Level Set Agent (Persistent Monitoring)

**Status:** `alwaysApply: true` - ALWAYS RUNNING

**Cyclical Scan Schedule:**
- **Session start:** Initial assessment
- **Daily:** Lightweight consistency checks
- **Weekly:** Comprehensive documentation consistency scans
- **After code changes:** Automated checks after major code changes
- **After git commits:** Verify documentation updates
- **On file changes:** Lightweight validation

**Automated Actions:**
- Auto-update minor discrepancies (with user notification)
- Flag significant discrepancies for user review
- Maintain discrepancy tracking log
- Update documentation when code changes detected

**Monitoring Scope:**
- Tool count verification
- Documentation cross-referencing
- File existence validation
- Definition cross-checking
- Tool registry validation
- Automatic tracking of documentation vs code changes

## Human Task Reminder Agent (Persistent Monitoring)

**Status:** `alwaysApply: true` - ALWAYS RUNNING

**Cyclical Scan Schedule:**
- **Session start:** Immediate check and present reminders
- **Every 4 hours:** Periodic scan for new/updated tasks
- **Daily:** Comprehensive scan of all monitored documents
- **Weekly:** Deep scan for overdue tasks and status changes
- **On document changes:** Immediate scan when task documents are modified

**Reminder Frequency:**
- **Critical tasks:** Remind daily (or more if overdue)
- **High priority tasks:** Remind every 2-3 days
- **Medium priority tasks:** Remind weekly
- **Low priority tasks:** Remind monthly
- **Blocking tasks:** Remind immediately when relevant work starts

**Context-Aware Execution:**
- Before security work: Remind of security tasks
- Before production deployment: Remind of production tasks
- When blocking tasks exist: Remind immediately
- When critical tasks overdue: Remind daily (or more frequently)

**Monitored Documents:**
- `docs/HUMAN_USER_TODOS_STEP_12.md`
- `docs/security/guides/SECURITY_CONFIGURATION_WALKTHROUGH.md`
- Any documents containing "HUMAN TASK" markers

## Implementation Notes

These agents are configured with `alwaysApply: true` in their rule files, which means:

1. They are always available and active
2. They perform their cyclical scans automatically
3. They don't require explicit invocation (though they can be invoked on demand)
4. They operate in the background with periodic checks

The actual implementation of cyclical monitoring depends on the Cursor/Copilot environment's ability to run background tasks. The agents are configured to:

- Run checks at appropriate intervals
- Present findings in chat
- Auto-update minor issues (with notification)
- Flag significant issues for user review
- Maintain audit trails

## Agent Coordination

- **Executor Agent** coordinates with all other agents and can delegate tasks
- **Level Set Agent** coordinates with Documentation Agent for documentation updates
- **Human Task Reminder Agent** coordinates with Project Orchestrator Agent on blocking tasks

All three agents work together to ensure:
- Documentation stays synchronized (Level Set)
- Human tasks are never forgotten (Human Task Reminder)
- All work is executed flawlessly (Executor)

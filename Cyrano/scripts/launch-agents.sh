#!/bin/bash

# Multi-Agent Launch Script
# Launches and coordinates multiple agent instances

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
COORD_DIR="$PROJECT_ROOT/.agent-coord"
LOG_DIR="$PROJECT_ROOT/.agent-logs"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Launching Multi-Agent System...${NC}\n"

# Create log directory
mkdir -p "$LOG_DIR"

# Initialize coordination system if needed
if [ ! -f "$COORD_DIR/tasks.json" ]; then
    echo -e "${YELLOW}Initializing coordination system...${NC}"
    npx tsx "$SCRIPT_DIR/agent-coordinator.ts" init
fi

# Agent assignments (can be customized)
# Using a function to map agent IDs to tasks
get_agent_tasks() {
    case "$1" in
        "agent-1") echo "Tool discovery, implementation, testing" ;;
        "agent-2") echo "Module abstraction, Chronometric module" ;;
        "agent-3") echo "Engine abstraction, MAE, GoodCounsel, Potemkin" ;;
        "agent-4") echo "LexFiat UI/UX, integration wiring" ;;
        "agent-5") echo "External integrations (Clio, Gmail, etc.)" ;;
        "agent-6") echo "ArkiverMJ recreation and integration" ;;
        "agent-7") echo "DevOps, automation, deployment" ;;
        "agent-8") echo "Documentation, cleanup" ;;
        *) echo "Unknown agent" ;;
    esac
}

AGENT_IDS=("agent-1" "agent-2" "agent-3" "agent-4" "agent-5" "agent-6" "agent-7" "agent-8")

# Function to create agent instruction file
create_agent_instructions() {
    local agent_id=$1
    local agent_name=$2
    local tasks=$3
    
    local instruction_file="$COORD_DIR/${agent_id}-instructions.md"
    
    cat > "$instruction_file" << EOF
# Instructions for ${agent_name}

## Your Focus
${tasks}

## Current Tasks
Check \`$COORD_DIR/tasks.json\` for your assigned tasks.

## How to Work

1. **Check your tasks:**
   \`\`\`bash
   npx tsx scripts/agent-coordinator.ts status
   \`\`\`

2. **Start working on a task:**
   - Update task status to 'in-progress'
   - Work on the task
   - Update status to 'completed' when done

3. **Update task status:**
   \`\`\`bash
   npx tsx scripts/agent-coordinator.ts update <task-id> <status>
   \`\`\`

## Available Scripts

- \`scripts/generate-tool.ts\` - Generate tool boilerplate
- \`scripts/generate-module.ts\` - Generate module boilerplate
- \`scripts/generate-engine.ts\` - Generate engine boilerplate
- \`scripts/discover-tools.sh\` - Discover tools in codebase
- \`scripts/analyze-codebase.ts\` - Analyze codebase for issues

## Communication

- Log your progress in: \`$LOG_DIR/${agent_id}.log\`
- Check for blockers in: \`$COORD_DIR/blockers.json\`
- Coordinate with other agents via task dependencies

## Priority

Work on tasks in this order:
1. Critical path items (no dependencies)
2. High priority items
3. Medium priority items
4. Low priority items

Good luck!
EOF

    echo "$instruction_file"
}

# Create instruction files for each agent
echo -e "${YELLOW}Creating agent instruction files...${NC}"
for agent_id in "${AGENT_IDS[@]}"; do
    case $agent_id in
        "agent-1") agent_name="Tool Specialist" ;;
        "agent-2") agent_name="Module Specialist" ;;
        "agent-3") agent_name="Engine Specialist" ;;
        "agent-4") agent_name="UI/UX Specialist" ;;
        "agent-5") agent_name="Integration Specialist" ;;
        "agent-6") agent_name="Arkiver Specialist" ;;
        "agent-7") agent_name="DevOps Specialist" ;;
        "agent-8") agent_name="Documentation Specialist" ;;
        *) agent_name="Agent" ;;
    esac
    
    tasks=$(get_agent_tasks "$agent_id")
    instruction_file=$(create_agent_instructions "$agent_id" "$agent_name" "$tasks")
    echo -e "  ${GREEN}✅${NC} Created instructions for $agent_name"
done

# Show current status
echo -e "\n${BLUE}Current Status:${NC}"
npx tsx "$SCRIPT_DIR/agent-coordinator.ts" status

echo -e "\n${GREEN}✅ Multi-Agent System Ready!${NC}\n"
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Review agent instructions in: $COORD_DIR/"
echo "  2. Each agent should check their tasks and begin work"
echo "  3. Agents can work in parallel on independent tasks"
echo "  4. Use 'npx tsx scripts/agent-coordinator.ts status' to track progress"
echo ""
echo -e "${BLUE}Agent Instruction Files:${NC}"
for agent_id in "${AGENT_IDS[@]}"; do
    echo "  - $COORD_DIR/${agent_id}-instructions.md"
done


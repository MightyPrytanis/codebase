#!/bin/bash

# Tool Discovery Script
# Automatically scans codebase and generates tool inventory

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUTPUT_DIR="$PROJECT_ROOT/docs/inventory"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔍 Starting Tool Discovery...${NC}"
echo ""

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Find all TypeScript files that might be tools
echo -e "${YELLOW}Scanning for tool files...${NC}"
TOOL_FILES=$(find "$PROJECT_ROOT" -type f -name "*.ts" -o -name "*.tsx" | grep -E "(tool|module|engine)" | grep -v node_modules | grep -v dist)

# Initialize output files
INVENTORY_FILE="$OUTPUT_DIR/TOOL_INVENTORY.md"
MISSING_FILE="$OUTPUT_DIR/MISSING_TOOLS.md"
CATEGORIES_FILE="$OUTPUT_DIR/TOOL_CATEGORIES.md"

# Start inventory file
cat > "$INVENTORY_FILE" << 'EOF'
# Tool Inventory
**Generated:** $(date)
**Purpose:** Comprehensive list of all tools found in codebase

## Registered Tools (in mcp-server.ts)

EOF

# Extract registered tools from mcp-server.ts
if [ -f "$PROJECT_ROOT/src/mcp-server.ts" ]; then
    echo -e "${YELLOW}Extracting registered tools...${NC}"
    grep -E "getToolDefinition\(\)|\.execute\(|case '" "$PROJECT_ROOT/src/mcp-server.ts" | \
        grep -E "case |getToolDefinition" | \
        sed 's/.*case //' | sed 's/:.*//' | sed 's/.*\.//' | sed 's/\.getToolDefinition.*//' | \
        sort -u | while read tool; do
            echo "- \`$tool\`" >> "$INVENTORY_FILE"
        done
fi

echo "" >> "$INVENTORY_FILE"
echo "## Unregistered Tools (found in codebase)" >> "$INVENTORY_FILE"
echo "" >> "$INVENTORY_FILE"

# Find potential tools by pattern
echo -e "${YELLOW}Finding potential tools...${NC}"
find "$PROJECT_ROOT/src" -type f -name "*.ts" | while read file; do
    # Check if file contains tool-like patterns
    if grep -qE "extends BaseTool|class.*Tool|getToolDefinition" "$file"; then
        filename=$(basename "$file" .ts)
        echo "- \`$filename\` - \`$file\`" >> "$INVENTORY_FILE"
    fi
done

# Generate missing tools file
cat > "$MISSING_FILE" << 'EOF'
# Missing Tools
**Generated:** $(date)
**Purpose:** Tools required but not yet implemented

## Critical Missing Tools

### Chronometric Module Tools
- [ ] Gap identification tool
- [ ] Email artifact collector
- [ ] Calendar artifact collector
- [ ] Document artifact collector
- [ ] Recollection support tool
- [ ] Pre-fill logic tool
- [ ] DupeCheck tool
- [ ] Provenance tracker

### GoodCounsel Engine Tools
- [ ] Next action tool (from Cosmos)
- [ ] Habit detection tool
- [ ] Ethics watchdog
- [ ] Wellness tracker
- [ ] Burnout detector
- [ ] Professional development tracker
- [ ] User help system
- [ ] Crisis recovery tool

### Potemkin Engine Tools
- [ ] OpinionDriftTest
- [ ] BiasDetector
- [ ] HonestyAssessment
- [ ] TenRulesCompliance
- [ ] IntegrityMonitor
- [ ] IntegrityAlertAssistant
- [ ] IntegrityAlertConfig

### MAE Engine Tools
- [ ] Workflow visual editor
- [ ] Agent selection UI
- [ ] Workflow execution engine

### Integration Tools
- [ ] Westlaw integration
- [ ] Lexis/Nexis integration
- [ ] MiFile integration
- [ ] Enhanced Gmail integration
- [ ] Enhanced Outlook integration

### Legal Tools
- [ ] Jurisdiction-specific format checker
- [ ] Legal research tool
- [ ] Legal writing assistant
- [ ] Legal triage tool

EOF

# Generate categories file
cat > "$CATEGORIES_FILE" << 'EOF'
# Tool Categories
**Generated:** $(date)

## Category Definitions

### Legal Analysis
Tools for analyzing legal documents, cases, and compliance.

### Data Extraction
Tools for extracting and processing data from various sources.

### Workflow Management
Tools for managing cases, workflows, and processes.

### Ethics & Wellness
Tools for ethical guidance, wellness tracking, and professional development.

### Verification
Tools for fact-checking, integrity monitoring, and verification.

### Integration
Tools for integrating with external services (Clio, Gmail, etc.).

### Timekeeping
Tools for tracking and reconstructing billable time.

### System
System-level tools (auth, status, sync, etc.).

## Tools by Category

### Legal Analysis
- document-analyzer
- contract-comparator (formerly legal-comparator)
- legal-reviewer
- compliance-checker
- fact-checker
- quality-assessor

### Data Extraction
- extract-conversations
- extract-text-content
- categorize-with-keywords
- process-with-regex
- generate-categorized-files
- run-extraction-pipeline
- create-arkiver-config

### Workflow Management
- workflow-manager
- case-manager
- ai-orchestrator

### Ethics & Wellness
- good-counsel
- (GoodCounsel engine tools - see MISSING_TOOLS.md)

### Verification
- red-flag-finder
- (Potemkin engine tools - see MISSING_TOOLS.md)

### Integration
- clio-integration
- sync-manager

### Timekeeping
- (Chronometric module tools - see MISSING_TOOLS.md)

### System
- auth
- system-status

EOF

echo -e "${GREEN}✅ Tool discovery complete!${NC}"
echo ""
echo "Generated files:"
echo "  - $INVENTORY_FILE"
echo "  - $MISSING_FILE"
echo "  - $CATEGORIES_FILE"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Review generated inventory files"
echo "  2. Manually verify and update as needed"
echo "  3. Use this as input for tool implementation planning"


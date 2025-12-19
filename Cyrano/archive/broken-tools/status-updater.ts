#!/usr/bin/env tsx

/**
 * Status Updater Agent
 * 
 * Provides periodic stepwise updates, completion percentage, estimated time to completion,
 * key blocks, and needed user inputs for ongoing projects.
 * 
 * Works with:
 * - Agent coordination system (codebase projects)
 * - LexFiat workflow executions
 * - Custom task tracking systems
 * 
 * Usage:
 *   tsx scripts/status-updater.ts [options]
 * 
 * Options:
 *   --context <agent-coord|lexfiat|beta-release|custom|auto>  Context to monitor (default: auto)
 *   --interval <seconds>                         Update interval in seconds (default: 30)
 *   --output <console|file|both>                 Output destination (default: console)
 *   --format <json|text|formatted>               Output format (default: formatted)
 *   --once                                       Run once and exit (no periodic updates)
 */

/*
 * ⚠️ BROKEN TOOL - ARCHIVED
 * 
 * This tool has been archived because it depends on status-indicator.ts,
 * which was archived due to fundamental design flaws.
 * 
 * See: Cyrano/archive/broken-tools/README.md
 * Archived: 2025-12-08
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
// status-indicator tool archived - see Cyrano/archive/broken-tools/

// If status-indicator.js is missing or unreachable, handle gracefully
let statusIndicator: any = null;
try {
  // Try both JS and TS extensions, and relative to this script.
  statusIndicator = require('../../src/tools/status-indicator');
} catch (err1) {
  try {
    statusIndicator = require('../../src/tools/status-indicator.js');
  } catch (err2) {
    // Provide fallback: dummy implementation and a warning
    console.warn('[status-updater] Warning: Could not load status-indicator module. Some features may be unavailable.');
    statusIndicator = {
      getStatus: () => ({ 
        status: 'unknown', 
        progress: 0, 
        blocks: ['Unknown, unable to load status-indicator'],
        estimatedTime: null
      }),
      formatStatus: (status: any) => JSON.stringify(status, null, 2)
    };
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

interface UpdaterConfig {
  context: 'agent-coord' | 'lexfiat' | 'custom' | 'auto';
  interval: number;
  output: 'console' | 'file' | 'both';
  format: 'json' | 'text' | 'formatted';
  once: boolean;
  customTasksPath?: string;
  customProgressPath?: string;
}

function parseArgs(): UpdaterConfig {
  const args = process.argv.slice(2);
  const config: UpdaterConfig = {
    context: 'auto',
    interval: 30,
    output: 'console',
    format: 'formatted',
    once: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--context':
        if (i + 1 < args.length) {
          const context = args[++i] as any;
          if (['agent-coord', 'lexfiat', 'beta-release', 'custom', 'auto'].includes(context)) {
            config.context = context;
          }
        }
        break;
      case '--interval':
        if (i + 1 < args.length) {
          config.interval = parseInt(args[++i], 10) || 30;
        }
        break;
      case '--output':
        if (i + 1 < args.length) {
          const output = args[++i] as any;
          if (['console', 'file', 'both'].includes(output)) {
            config.output = output;
          }
        }
        break;
      case '--format':
        if (i + 1 < args.length) {
          const format = args[++i] as any;
          if (['json', 'text', 'formatted'].includes(format)) {
            config.format = format;
          }
        }
        break;
      case '--once':
        config.once = true;
        break;
      case '--custom-tasks-path':
        if (i + 1 < args.length) {
          config.customTasksPath = args[++i];
        }
        break;
      case '--custom-progress-path':
        if (i + 1 < args.length) {
          config.customProgressPath = args[++i];
        }
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
    }
  }

  return config;
}

function printHelp() {
  console.log(`
Status Updater Agent

Provides periodic stepwise updates, completion percentage, estimated time to completion,
key blocks, and needed user inputs for ongoing projects.

Usage:
  tsx scripts/status-updater.ts [options]

Options:
  --context <agent-coord|lexfiat|beta-release|custom|auto>
    Context to monitor (default: auto)
    - agent-coord: Agent coordination system (codebase projects)
    - lexfiat: LexFiat workflow executions
    - beta-release: Beta release project (15-step codebase review/refactoring)
    - custom: Custom task tracking (requires --custom-tasks-path)
    - auto: Automatically detect context

  --interval <seconds>
    Update interval in seconds (default: 30)

  --output <console|file|both>
    Output destination (default: console)
    - console: Print to console
    - file: Write to .agent-coord/status-updates.log
    - both: Print and write to file

  --format <json|text|formatted>
    Output format (default: formatted)
    - json: Raw JSON output
    - text: Plain text summary
    - formatted: Formatted report with emojis and structure

  --once
    Run once and exit (no periodic updates)

  --custom-tasks-path <path>
    Custom path to tasks JSON file (for custom context)

  --custom-progress-path <path>
    Custom path to progress JSON file (for custom context)

  --help, -h
    Show this help message

Examples:
  # Monitor agent coordination system, update every 30 seconds
  tsx scripts/status-updater.ts --context agent-coord

  # Monitor LexFiat workflows, update every 60 seconds, output to file
  tsx scripts/status-updater.ts --context lexfiat --interval 60 --output file

  # Run once and get formatted report
  tsx scripts/status-updater.ts --once --format formatted

  # Monitor custom task system
  tsx scripts/status-updater.ts --context custom \\
    --custom-tasks-path /path/to/tasks.json \\
    --custom-progress-path /path/to/progress.json
`);
}

async function getStatusUpdate(config: UpdaterConfig): Promise<string> {
  // Tool is archived - return error message
  const errorMsg = `⚠️ ERROR: This tool has been archived and is no longer functional.\n\n` +
    `The status-indicator tool it depends on was archived due to fundamental design flaws.\n` +
    `See: Cyrano/archive/broken-tools/README.md for details.\n\n` +
    `Archived: 2025-12-08`;
  
  if (config.format === 'json') {
    return JSON.stringify({
      error: true,
      message: errorMsg,
      archived: true,
      archivedDate: '2025-12-08'
    }, null, 2);
  } else {
    return errorMsg;
  }
}

function formatTextReport(data: any): string {
  let report = `\nStatus Update - ${new Date(data.timestamp).toLocaleString()}\n`;
  report += `═══════════════════════════════════════════════════════════\n\n`;
  report += `Completion: ${data.summary.completionPercentage}\n`;
  report += `Estimated Time Remaining: ${data.summary.estimatedTimeToCompletion}\n`;
  report += `Tasks: ${data.summary.tasksCompleted}/${data.summary.totalTasks} completed, `;
  report += `${data.summary.tasksInProgress} in progress, ${data.summary.tasksBlocked} blocked\n\n`;

  if (data.keyBlocks && data.keyBlocks.length > 0) {
    report += `Key Blocks (${data.keyBlocks.length}):\n`;
    data.keyBlocks.forEach((block: any, idx: number) => {
      report += `  ${idx + 1}. [${block.severity.toUpperCase()}] ${block.description}\n`;
    });
    report += `\n`;
  }

  if (data.neededUserInputs && data.neededUserInputs.length > 0) {
    report += `Needed User Inputs (${data.neededUserInputs.length}):\n`;
    data.neededUserInputs.forEach((input: any, idx: number) => {
      report += `  ${idx + 1}. ${input.required ? '[REQUIRED]' : '[Optional]'} ${input.description}\n`;
    });
    report += `\n`;
  }

  if (data.stepwiseUpdates && data.stepwiseUpdates.length > 0) {
    report += `Stepwise Updates:\n`;
    data.stepwiseUpdates.forEach((update: any, idx: number) => {
      report += `  ${idx + 1}. [${update.taskId}] ${update.title}\n`;
      report += `     Status: ${update.status} | Progress: ${update.progress}\n`;
      report += `     Current Step: ${update.currentStep}\n`;
    });
    report += `\n`;
  }

  return report;
}

function writeToFile(content: string) {
  const logDir = path.join(PROJECT_ROOT, '.agent-coord');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  const logFile = path.join(logDir, 'status-updates.log');
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFile, `\n[${timestamp}]\n${content}\n`);
}

async function runUpdater(config: UpdaterConfig) {
  console.error(`⚠️  WARNING: This tool has been archived and is no longer functional.\n`);
  console.error(`The status-indicator tool it depends on was archived due to fundamental design flaws.\n`);
  console.error(`See: Cyrano/archive/broken-tools/README.md for details.\n`);
  console.error(`Archived: 2025-12-08\n`);
  
  if (config.once) {
    const report = await getStatusUpdate(config);
    if (config.output === 'console' || config.output === 'both') {
      console.log(report);
    }
    if (config.output === 'file' || config.output === 'both') {
      writeToFile(report);
    }
    return;
  }
  
  console.log(`🚀 Status Updater Agent Starting...\n`);
  console.log(`Context: ${config.context}`);
  console.log(`Interval: ${config.interval} seconds`);
  console.log(`Output: ${config.output}`);
  console.log(`Format: ${config.format}\n`);

  const update = async () => {
    try {
      const report = await getStatusUpdate(config);

      if (config.output === 'console' || config.output === 'both') {
        console.log(report);
      }

      if (config.output === 'file' || config.output === 'both') {
        writeToFile(report);
      }
    } catch (error) {
      const errorMsg = `Error generating status update: ${error instanceof Error ? error.message : String(error)}`;
      console.error(`❌ ${errorMsg}`);
      if (config.output === 'file' || config.output === 'both') {
        writeToFile(`ERROR: ${errorMsg}`);
      }
    }
  };

  // Run initial update
  await update();

  // If --once, exit now
  if (config.once) {
    return;
  }

  // Set up periodic updates
  console.log(`\n⏰ Starting periodic updates (every ${config.interval} seconds)...`);
  console.log(`Press Ctrl+C to stop\n`);

  const intervalId = setInterval(update, config.interval * 1000);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log(`\n\n🛑 Stopping status updater...`);
    clearInterval(intervalId);
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log(`\n\n🛑 Stopping status updater...`);
    clearInterval(intervalId);
    process.exit(0);
  });
}

// Main execution
const config = parseArgs();
runUpdater(config).catch((error) => {
  console.error(`Fatal error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});


#!/usr/bin/env tsx

/**
 * Multi-Agent Coordination System
 * Manages task assignment, progress tracking, and parallel execution
 * 
 * Usage: tsx scripts/agent-coordinator.ts [command]
 * Commands:
 *   init - Initialize coordination system
 *   assign - Assign tasks to agents
 *   status - Show current status
 *   update - Update task status
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const COORD_DIR = path.join(PROJECT_ROOT, '.agent-coord');
const TASKS_FILE = path.join(COORD_DIR, 'tasks.json');
const AGENTS_FILE = path.join(COORD_DIR, 'agents.json');
const PROGRESS_FILE = path.join(COORD_DIR, 'progress.json');

// Agent definitions
const AGENTS = {
  toolSpecialist: {
    id: 'agent-1',
    name: 'Tool Specialist',
    focus: 'All tool-related work',
    capabilities: ['tool-implementation', 'tool-testing', 'tool-documentation'],
    currentTasks: [],
    status: 'ready'
  },
  moduleSpecialist: {
    id: 'agent-2',
    name: 'Module Specialist',
    focus: 'Module layer implementation',
    capabilities: ['module-abstraction', 'module-implementation', 'chronometric'],
    currentTasks: [],
    status: 'ready'
  },
  engineSpecialist: {
    id: 'agent-3',
    name: 'Engine Specialist',
    focus: 'Engine layer implementation',
    capabilities: ['engine-abstraction', 'mae', 'goodcounsel', 'potemkin'],
    currentTasks: [],
    status: 'ready'
  },
  uiSpecialist: {
    id: 'agent-4',
    name: 'UI/UX Specialist',
    focus: 'LexFiat frontend',
    capabilities: ['ui-components', 'integration-wiring', 'ux-refinement'],
    currentTasks: [],
    status: 'ready'
  },
  integrationSpecialist: {
    id: 'agent-5',
    name: 'Integration Specialist',
    focus: 'External integrations',
    capabilities: ['clio', 'gmail', 'outlook', 'westlaw', 'lexis'],
    currentTasks: [],
    status: 'ready'
  },
  arkiverSpecialist: {
    id: 'agent-6',
    name: 'Arkiver Specialist',
    focus: 'ArkiverMJ recreation',
    capabilities: ['arkiver-backend', 'tool-extraction', 'mcp-integration'],
    currentTasks: [],
    status: 'ready'
  },
  devopsSpecialist: {
    id: 'agent-7',
    name: 'DevOps Specialist',
    focus: 'Infrastructure and deployment',
    capabilities: ['deployment', 'cicd', 'security', 'monitoring'],
    currentTasks: [],
    status: 'ready'
  },
  documentationSpecialist: {
    id: 'agent-8',
    name: 'Documentation Specialist',
    focus: 'Documentation and cleanup',
    capabilities: ['documentation', 'user-guides', 'cleanup'],
    currentTasks: [],
    status: 'ready'
  },
  statusUpdater: {
    id: 'agent-9',
    name: 'Status Indicator/Updater',
    focus: 'Status monitoring and progress reporting',
    capabilities: ['status-tracking', 'progress-reporting', 'blocker-detection', 'user-input-tracking'],
    currentTasks: [],
    status: 'ready'
  }
};

// Task definitions from implementation plan
const INITIAL_TASKS = [
  // Phase 1: Foundation
  {
    id: 'task-001',
    title: 'Tool Discovery and Inventory',
    agent: 'agent-1',
    priority: 'critical',
    status: 'ready',
    estimatedHours: 4,
    dependencies: [],
    deliverables: ['TOOL_INVENTORY.md', 'MISSING_TOOLS.md', 'TOOL_CATEGORIES.md']
  },
  {
    id: 'task-002',
    title: 'Design Module Abstraction',
    agent: 'agent-2',
    priority: 'critical',
    status: 'ready',
    estimatedHours: 8,
    dependencies: [],
    deliverables: ['MODULE_ARCHITECTURE.md', 'base-module.ts']
  },
  {
    id: 'task-003',
    title: 'Design Engine Abstraction',
    agent: 'agent-3',
    priority: 'critical',
    status: 'ready',
    estimatedHours: 8,
    dependencies: [],
    deliverables: ['ENGINE_ARCHITECTURE.md', 'base-engine.ts']
  },
  {
    id: 'task-004',
    title: 'Review Base44 Specifications',
    agent: 'agent-6',
    priority: 'high',
    status: 'ready',
    estimatedHours: 6,
    dependencies: [],
    deliverables: ['ARKIVERMJ_SPECS.md']
  },
  {
    id: 'task-005',
    title: 'Set Up Automation Scripts',
    agent: 'agent-7',
    priority: 'critical',
    status: 'in-progress',
    estimatedHours: 12,
    dependencies: [],
    deliverables: ['All automation scripts']
  },
  {
    id: 'task-006',
    title: 'Generate Initial Documentation',
    agent: 'agent-8',
    priority: 'medium',
    status: 'ready',
    estimatedHours: 8,
    dependencies: [],
    deliverables: ['Initial documentation from code']
  },
  // More tasks can be added here
];

function init() {
  console.log('🚀 Initializing Multi-Agent Coordination System...\n');
  
  // Create coordination directory
  if (!fs.existsSync(COORD_DIR)) {
    fs.mkdirSync(COORD_DIR, { recursive: true });
  }
  
  // Initialize tasks
  fs.writeFileSync(TASKS_FILE, JSON.stringify(INITIAL_TASKS, null, 2));
  console.log(`✅ Created ${TASKS_FILE}`);
  
  // Initialize agents
  fs.writeFileSync(AGENTS_FILE, JSON.stringify(AGENTS, null, 2));
  console.log(`✅ Created ${AGENTS_FILE}`);
  
  // Initialize progress tracking
  const progress = {
    startDate: new Date().toISOString(),
    tasksCompleted: 0,
    tasksInProgress: 0,
    tasksReady: INITIAL_TASKS.length,
    totalTasks: INITIAL_TASKS.length,
    hoursCompleted: 0,
    hoursRemaining: INITIAL_TASKS.reduce((sum, t) => sum + t.estimatedHours, 0)
  };
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
  console.log(`✅ Created ${PROGRESS_FILE}`);
  
  console.log('\n✅ Coordination system initialized!');
  console.log(`\nAgents ready: ${Object.keys(AGENTS).length}`);
  console.log(`Tasks queued: ${INITIAL_TASKS.length}`);
}

function assignTasks() {
  console.log('📋 Assigning tasks to agents...\n');
  
  const tasks = JSON.parse(fs.readFileSync(TASKS_FILE, 'utf-8'));
  const agents = JSON.parse(fs.readFileSync(AGENTS_FILE, 'utf-8'));
  
  // Group tasks by agent
  const assignments: Record<string, any[]> = {};
  
  tasks.forEach((task: any) => {
    if (task.status === 'ready' && task.agent) {
      if (!assignments[task.agent]) {
        assignments[task.agent] = [];
      }
      assignments[task.agent].push(task);
    }
  });
  
  // Display assignments
  Object.keys(assignments).forEach(agentId => {
    const agent = Object.values(agents).find((a: any) => a.id === agentId);
    console.log(`\n${agent ? (agent as any).name : agentId}:`);
    assignments[agentId].forEach(task => {
      console.log(`  - [${task.id}] ${task.title} (${task.estimatedHours}h)`);
    });
  });
  
  console.log('\n✅ Task assignments complete!');
  console.log('\nAgents can now begin work on their assigned tasks.');
}

function showStatus() {
  console.log('📊 Current Status\n');
  
  const tasks = JSON.parse(fs.readFileSync(TASKS_FILE, 'utf-8'));
  const agents = JSON.parse(fs.readFileSync(AGENTS_FILE, 'utf-8'));
  const progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  
  // Task status summary
  const statusCounts = tasks.reduce((acc: any, task: any) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {});
  
  console.log('Tasks:');
  console.log(`  Ready: ${statusCounts.ready || 0}`);
  console.log(`  In Progress: ${statusCounts['in-progress'] || 0}`);
  console.log(`  Completed: ${statusCounts.completed || 0}`);
  console.log(`  Blocked: ${statusCounts.blocked || 0}`);
  
  console.log('\nAgents:');
  Object.values(agents).forEach((agent: any) => {
    const agentTasks = tasks.filter((t: any) => t.agent === agent.id && t.status === 'in-progress');
    console.log(`  ${agent.name}: ${agentTasks.length} active task(s)`);
  });
  
  console.log('\nProgress:');
  console.log(`  Hours Completed: ${progress.hoursCompleted}`);
  console.log(`  Hours Remaining: ${progress.hoursRemaining}`);
  const percentComplete = progress.totalTasks > 0 
    ? ((progress.tasksCompleted / progress.totalTasks) * 100).toFixed(1)
    : '0';
  console.log(`  Completion: ${percentComplete}%`);
}

function updateTask(taskId: string, status: string) {
  const tasks = JSON.parse(fs.readFileSync(TASKS_FILE, 'utf-8'));
  const task = tasks.find((t: any) => t.id === taskId);
  
  if (!task) {
    console.error(`❌ Task ${taskId} not found`);
    return;
  }
  
  const previousStatus = task.status;
  task.status = status;
  task.updatedAt = new Date().toISOString();
  
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
  console.log(`✅ Updated task ${taskId} to status: ${status}`);
  
  // Update progress
  const progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  const statusCounts = tasks.reduce((acc: any, t: any) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});
  
  progress.tasksCompleted = statusCounts.completed || 0;
  progress.tasksInProgress = statusCounts['in-progress'] || 0;
  progress.tasksReady = statusCounts.ready || 0;
  
  // Only update hours if:
  // 1. Status changed to 'completed'
  // 2. Previous status was NOT 'completed' (avoid double-counting)
  // 3. estimatedHours is a valid number
  if (status === 'completed' && previousStatus !== 'completed') {
    const estimatedHours = typeof task.estimatedHours === 'number' && !isNaN(task.estimatedHours) 
      ? task.estimatedHours 
      : 0;
    
    if (estimatedHours > 0) {
      progress.hoursCompleted += estimatedHours;
      progress.hoursRemaining -= estimatedHours;
      
      // Ensure hoursRemaining doesn't go negative
      if (progress.hoursRemaining < 0) {
        progress.hoursRemaining = 0;
      }
    }
  }
  
  // If status changed FROM 'completed' to something else, reverse the hours
  if (previousStatus === 'completed' && status !== 'completed') {
    const estimatedHours = typeof task.estimatedHours === 'number' && !isNaN(task.estimatedHours) 
      ? task.estimatedHours 
      : 0;
    
    if (estimatedHours > 0) {
      progress.hoursCompleted -= estimatedHours;
      progress.hoursRemaining += estimatedHours;
      
      // Ensure hoursCompleted doesn't go negative
      if (progress.hoursCompleted < 0) {
        progress.hoursCompleted = 0;
      }
    }
  }
  
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

// Main command handler
const command = process.argv[2];

switch (command) {
  case 'init':
    init();
    break;
  case 'assign':
    assignTasks();
    break;
  case 'status':
    showStatus();
    break;
  case 'update': {
    const taskId = process.argv[3];
    const status = process.argv[4];
    if (!taskId || !status) {
      console.error('Usage: tsx agent-coordinator.ts update <task-id> <status>');
      process.exit(1);
    }
    updateTask(taskId, status);
    break;
  }
  default:
    console.log('Multi-Agent Coordination System');
    console.log('\nCommands:');
    console.log('  init    - Initialize coordination system');
    console.log('  assign  - Assign tasks to agents');
    console.log('  status  - Show current status');
    console.log('  update  - Update task status');
    console.log('\nExample: tsx scripts/agent-coordinator.ts init');

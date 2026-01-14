/**
 * Workflow Utilities
 * 
 * Utilities for workflow execution, including topological sort for dependency resolution.
 * Extracted and adapted from Legacy/SwimMeet/server/workflow-engine.ts
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */

import { Workflow, WorkflowStep } from '../base-engine.js';

export interface WorkflowNode {
  id: string;
  type: 'start' | 'ai' | 'decision' | 'end' | 'module' | 'engine' | 'tool' | 'condition';
  title?: string;
  dependencies?: string[]; // IDs of nodes that must execute before this one
}

export interface WorkflowConnection {
  id: string;
  from: string;
  to: string;
}

export interface ExecutionPlan {
  step: number;
  nodeId: string;
  dependencies: string[];
}

/**
 * Build execution plan with topological sort
 * 
 * This implements the topological sort algorithm from SwimMeet's workflow engine,
 * adapted for Cyrano's workflow model. It ensures that nodes with dependencies
 * are executed in the correct order.
 * 
 * @param nodes Array of workflow nodes
 * @param connections Array of connections defining dependencies
 * @returns Sorted execution plan
 */
export function buildExecutionPlan(
  nodes: WorkflowNode[],
  connections: WorkflowConnection[]
): ExecutionPlan[] {
  const plan: ExecutionPlan[] = [];
  const processed = new Set<string>();
  
  // Build dependency map from connections
  const dependencyMap = new Map<string, string[]>();
  connections.forEach(conn => {
    if (!dependencyMap.has(conn.to)) {
      dependencyMap.set(conn.to, []);
    }
    dependencyMap.get(conn.to)!.push(conn.from);
  });

  // Also use explicit dependencies from nodes
  nodes.forEach(node => {
    if (node.dependencies && node.dependencies.length > 0) {
      if (!dependencyMap.has(node.id)) {
        dependencyMap.set(node.id, []);
      }
      dependencyMap.get(node.id)!.push(...node.dependencies);
    }
  });

  // Topological sort - recursive function
  function processNode(nodeId: string, currentStep: number): number {
    if (processed.has(nodeId)) {
      return currentStep;
    }

    const node = nodes.find(n => n.id === nodeId);
    if (!node) {
      return currentStep;
    }

    const dependencies = dependencyMap.get(nodeId) || [];
    
    // Process dependencies first (recursive)
    let maxStep = currentStep;
    for (const depId of dependencies) {
      maxStep = Math.max(maxStep, processNode(depId, currentStep));
    }

    // Add this node to plan
    plan.push({ 
      step: maxStep, 
      nodeId: node.id, 
      dependencies 
    });
    processed.add(nodeId);

    // Process connected nodes (downstream)
    const nextNodes = connections
      .filter(conn => conn.from === nodeId)
      .map(conn => conn.to);
    
    let nextStep = maxStep + 1;
    for (const nextNodeId of nextNodes) {
      nextStep = Math.max(nextStep, processNode(nextNodeId, nextStep));
    }

    return nextStep;
  }

  // Start with start node (or first node if no start node)
  const startNode = nodes.find(n => n.type === 'start');
  if (startNode) {
    processNode(startNode.id, 0);
  } else if (nodes.length > 0) {
    // If no start node, process all nodes (they may have dependencies)
    nodes.forEach(node => {
      if (!processed.has(node.id)) {
        processNode(node.id, 0);
      }
    });
  }

  return plan.sort((a, b) => a.step - b.step);
}

/**
 * Convert Workflow (step-based) to node-based format for topological sort
 * 
 * This allows using topological sort with Cyrano's step-based workflow model
 * by converting steps to nodes and inferring connections from onSuccess/onFailure.
 */
export function workflowToNodes(workflow: Workflow): {
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
} {
  const nodes: WorkflowNode[] = workflow.steps.map(step => ({
    id: step.id,
    type: step.type,
    title: step.id,
    dependencies: [], // Will be populated from connections
  }));

  const connections: WorkflowConnection[] = [];
  
  // Build connections from onSuccess/onFailure
  workflow.steps.forEach(step => {
    if (step.onSuccess) {
      connections.push({
        id: `${step.id}_to_${step.onSuccess}`,
        from: step.id,
        to: step.onSuccess,
      });
    }
    if (step.onFailure) {
      connections.push({
        id: `${step.id}_to_${step.onFailure}`,
        from: step.id,
        to: step.onFailure,
      });
    }
  });

  // Update dependencies based on connections
  connections.forEach(conn => {
    const node = nodes.find(n => n.id === conn.to);
    if (node) {
      if (!node.dependencies) {
        node.dependencies = [];
      }
      if (!node.dependencies.includes(conn.from)) {
        node.dependencies.push(conn.from);
      }
    }
  });

  return { nodes, connections };
}

/**
 * Validate workflow structure
 * 
 * Adapted from SwimMeet's validateWorkflow function
 */
export function validateWorkflowStructure(
  nodes: WorkflowNode[],
  connections: WorkflowConnection[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for start node
  const startNodes = nodes.filter(n => n.type === 'start');
  if (startNodes.length === 0) {
    errors.push('Workflow must have a start node');
  } else if (startNodes.length > 1) {
    errors.push('Workflow can only have one start node');
  }

  // Check for end node
  const endNodes = nodes.filter(n => n.type === 'end');
  if (endNodes.length === 0) {
    errors.push('Workflow must have at least one end node');
  }

  // Check for disconnected nodes (except start and end)
  const connectedNodes = new Set<string>();
  connections.forEach(conn => {
    connectedNodes.add(conn.from);
    connectedNodes.add(conn.to);
  });

  nodes.forEach(node => {
    if (!connectedNodes.has(node.id) && node.type !== 'start' && node.type !== 'end') {
      errors.push(`Node "${node.id}" is not connected to the workflow`);
    }
  });

  // Check for circular dependencies
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  
  function hasCycle(nodeId: string): boolean {
    if (recursionStack.has(nodeId)) {
      return true; // Circular dependency detected
    }
    if (visited.has(nodeId)) {
      return false;
    }

    visited.add(nodeId);
    recursionStack.add(nodeId);

    const node = nodes.find(n => n.id === nodeId);
    if (node && node.dependencies) {
      for (const depId of node.dependencies) {
        if (hasCycle(depId)) {
          return true;
        }
      }
    }

    // Also check connections
    const outgoingConnections = connections.filter(conn => conn.from === nodeId);
    for (const conn of outgoingConnections) {
      if (hasCycle(conn.to)) {
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  for (const node of nodes) {
    if (!visited.has(node.id) && hasCycle(node.id)) {
      errors.push(`Circular dependency detected involving node "${node.id}"`);
      break;
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Group steps by execution level for parallel execution
 * 
 * Steps at the same level can potentially execute in parallel
 */
export function groupStepsByLevel(plan: ExecutionPlan[]): Map<number, string[]> {
  const levelMap = new Map<number, string[]>();
  
  plan.forEach(item => {
    if (!levelMap.has(item.step)) {
      levelMap.set(item.step, []);
    }
    levelMap.get(item.step)!.push(item.nodeId);
  });
  
  return levelMap;
}


}
)
}
)
}
}
)
}
)
}
)
}
}
)
import { AIService } from './ai-service';

interface WorkflowNode {
  id: string;
  type: 'start' | 'ai' | 'decision' | 'end';
  title: string;
  provider?: string;
  config?: {
    prompt?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  };
}

interface WorkflowConnection {
  id: string;
  from: string;
  to: string;
}

interface WorkflowDefinition {
  name: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  version: string;
}

interface ExecutionContext {
  variables: Record<string, any>;
  results: Record<string, any>;
  currentInput: string;
}

interface ExecutionStep {
  nodeId: string;
  node: WorkflowNode;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
  startTime?: Date;
  endTime?: Date;
}

export class WorkflowEngine {
  private aiService: AIService;

  constructor(aiService: AIService) {
    this.aiService = aiService;
  }

  async executeWorkflow(
    workflow: WorkflowDefinition, 
    initialInput: string,
    userCredentials?: Record<string, string>
  ): Promise<{
    success: boolean;
    result?: any;
    steps: ExecutionStep[];
    error?: string;
  }> {
    try {
      console.log('Starting workflow execution:', workflow.name);
      
      // Build execution plan
      const executionPlan = this.buildExecutionPlan(workflow);
      console.log('Execution plan:', executionPlan);

      // Initialize context
      const context: ExecutionContext = {
        variables: {},
        results: {},
        currentInput: initialInput
      };

      const steps: ExecutionStep[] = [];

      // Execute workflow steps
      for (const step of executionPlan) {
        const executionStep: ExecutionStep = {
          nodeId: step.node.id,
          node: step.node,
          status: 'pending',
          startTime: new Date()
        };
        
        steps.push(executionStep);

        try {
          executionStep.status = 'running';
          console.log(`Executing step: ${step.node.title}`);

          // Execute the node based on its type
          const result = await this.executeNode(step.node, context, userCredentials);
          
          executionStep.result = result;
          executionStep.status = 'completed';
          executionStep.endTime = new Date();

          // Update context with results
          context.results[step.node.id] = result;
          
          // For AI nodes, update current input for next step
          if (step.node.type === 'ai' && typeof result === 'string') {
            context.currentInput = result;
          }

        } catch (error) {
          executionStep.error = error instanceof Error ? error.message : 'Unknown error';
          executionStep.status = 'failed';
          executionStep.endTime = new Date();
          
          console.error(`Step failed: ${step.node.title}`, error);
          
          return {
            success: false,
            steps,
            error: `Workflow failed at step "${step.node.title}": ${executionStep.error}`
          };
        }
      }

      // Get final result
      const endNode = workflow.nodes.find(n => n.type === 'end');
      const finalResult = endNode ? context.results[endNode.id] || context.currentInput : context.currentInput;

      return {
        success: true,
        result: finalResult,
        steps
      };

    } catch (error) {
      console.error('Workflow execution failed:', error);
      return {
        success: false,
        steps: [],
        error: error instanceof Error ? error.message : 'Unknown workflow error'
      };
    }
  }

  private buildExecutionPlan(workflow: WorkflowDefinition): { step: number; node: WorkflowNode; dependencies: string[] }[] {
    const plan: { step: number; node: WorkflowNode; dependencies: string[] }[] = [];
    const processed = new Set<string>();
    
    // Build dependency map
    const dependencyMap = new Map<string, string[]>();
    workflow.connections.forEach(conn => {
      if (!dependencyMap.has(conn.to)) {
        dependencyMap.set(conn.to, []);
      }
      dependencyMap.get(conn.to)!.push(conn.from);
    });

    // Topological sort
    function processNode(nodeId: string, currentStep: number): number {
      if (processed.has(nodeId)) {
        return currentStep;
      }

      const node = workflow.nodes.find(n => n.id === nodeId);
      if (!node) return currentStep;

      const dependencies = dependencyMap.get(nodeId) || [];
      
      // Process dependencies first
      let maxStep = currentStep;
      for (const depId of dependencies) {
        maxStep = Math.max(maxStep, processNode(depId, currentStep));
      }

      plan.push({ 
        step: maxStep, 
        node, 
        dependencies 
      });
      processed.add(nodeId);

      // Process connected nodes
      const nextNodes = workflow.connections
        .filter(conn => conn.from === nodeId)
        .map(conn => conn.to);
      
      let nextStep = maxStep + 1;
      for (const nextNodeId of nextNodes) {
        nextStep = Math.max(nextStep, processNode(nextNodeId, nextStep));
      }

      return nextStep;
    }

    // Start with start node
    const startNode = workflow.nodes.find(n => n.type === 'start');
    if (startNode) {
      processNode(startNode.id, 0);
    }

    return plan.sort((a, b) => a.step - b.step);
  }

  private async executeNode(
    node: WorkflowNode, 
    context: ExecutionContext,
    userCredentials?: Record<string, string>
  ): Promise<any> {
    switch (node.type) {
      case 'start':
        return context.currentInput;

      case 'ai':
        if (!node.provider) {
          throw new Error('AI node missing provider');
        }

        // Build the prompt for this AI node
        let prompt = node.config?.prompt || 'Analyze the following input:';
        
        // Replace template variables
        prompt = prompt.replace(/\{input\}/g, context.currentInput);
        prompt = prompt.replace(/\{(\w+)\}/g, (match, varName) => {
          return context.variables[varName] || context.results[varName] || match;
        });

        // Add the current input to the prompt
        const fullPrompt = `${prompt}\n\nInput: ${context.currentInput}`;

        console.log(`Sending to ${node.provider}:`, fullPrompt);

        // Execute AI request
        const aiResponse = await this.aiService.queryAI(
          node.provider,
          fullPrompt,
          userCredentials
        );

        return aiResponse.content;

      case 'decision':
        // For decision nodes, we could implement logic to choose between paths
        // For now, just pass through the current input
        return context.currentInput;

      case 'end':
        return context.currentInput;

      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  // Validate workflow before execution
  validateWorkflow(workflow: WorkflowDefinition): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for start node
    const startNodes = workflow.nodes.filter(n => n.type === 'start');
    if (startNodes.length === 0) {
      errors.push('Workflow must have a start node');
    } else if (startNodes.length > 1) {
      errors.push('Workflow can only have one start node');
    }

    // Check for end node
    const endNodes = workflow.nodes.filter(n => n.type === 'end');
    if (endNodes.length === 0) {
      errors.push('Workflow must have an end node');
    }

    // Check AI nodes have providers
    workflow.nodes.filter(n => n.type === 'ai').forEach(node => {
      if (!node.provider) {
        errors.push(`AI node "${node.title}" is missing a provider`);
      }
    });

    // Check for disconnected nodes (except start and end)
    const connectedNodes = new Set<string>();
    workflow.connections.forEach(conn => {
      connectedNodes.add(conn.from);
      connectedNodes.add(conn.to);
    });

    workflow.nodes.forEach(node => {
      if (!connectedNodes.has(node.id) && node.type !== 'start' && node.type !== 'end') {
        errors.push(`Node "${node.title}" is not connected to the workflow`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
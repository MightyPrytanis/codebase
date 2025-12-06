import React, { useState, useRef, useCallback } from 'react';
import { Zap, MessageSquare, CheckCircle, ArrowRight, Move, Plus, Download, Edit, Trash, Settings } from 'lucide-react';

interface Node {
  id: string;
  type: 'start' | 'ai' | 'decision' | 'end';
  x: number;
  y: number;
  title: string;
  provider?: string;
  config?: {
    prompt?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  };
}

interface Connection {
  id: string;
  from: string;
  to: string;
  animated: boolean;
}

const SAMPLE_NODES: Node[] = [
  { id: 'start', type: 'start', x: 100, y: 150, title: 'Query Input' },
  { id: 'gpt', type: 'ai', x: 300, y: 100, title: 'ChatGPT-4', provider: 'openai' },
  { id: 'claude', type: 'ai', x: 300, y: 200, title: 'Claude 4', provider: 'anthropic' },
  { id: 'decision', type: 'decision', x: 500, y: 150, title: 'Best Response' },
  { id: 'end', type: 'end', x: 700, y: 150, title: 'Final Answer' }
];

const SAMPLE_CONNECTIONS: Connection[] = [
  { id: 'c1', from: 'start', to: 'gpt', animated: true },
  { id: 'c2', from: 'start', to: 'claude', animated: true },
  { id: 'c3', from: 'gpt', to: 'decision', animated: false },
  { id: 'c4', from: 'claude', to: 'decision', animated: false },
  { id: 'c5', from: 'decision', to: 'end', animated: true }
];

interface WorkflowBuilderProps {
  onExecute?: (workflow: { nodes: any[], edges: any[] }) => void;
}

export function WorkflowBuilder({ onExecute }: WorkflowBuilderProps = {}) {
  const [nodes, setNodes] = useState<Node[]>(SAMPLE_NODES);
  const [connections, setConnections] = useState<Connection[]>(SAMPLE_CONNECTIONS);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showNodeEditor, setShowNodeEditor] = useState(false);
  const [nodeBeingEdited, setNodeBeingEdited] = useState<Node | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [executionStep, setExecutionStep] = useState<number>(-1);
  const [workflowName, setWorkflowName] = useState('My AI Workflow');

  const handleNodeDrag = useCallback((nodeId: string, newX: number, newY: number) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, x: newX, y: newY } : node
    ));
  }, []);

  const addNode = (type: Node['type'], provider?: string) => {
    const getProviderName = (provider?: string) => {
      switch (provider) {
        case 'openai': return 'ChatGPT-4';
        case 'anthropic': return 'Claude 4';
        case 'google': return 'Gemini Pro';
        case 'perplexity': return 'Perplexity';
        default: return 'AI';
      }
    };

    const newNode: Node = {
      id: `node_${Date.now()}`,
      type,
      x: 300 + Math.random() * 200,
      y: 150 + Math.random() * 100,
      title: type === 'ai' ? getProviderName(provider) : `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
      provider,
      config: type === 'ai' ? { 
        prompt: 'Analyze the input and provide insights',
        temperature: 0.7,
        maxTokens: 500
      } : undefined
    };
    setNodes(prev => [...prev, newNode]);
  };

  const deleteNode = (nodeId: string) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId));
    setConnections(prev => prev.filter(conn => conn.from !== nodeId && conn.to !== nodeId));
  };

  const editNode = (node: Node) => {
    setNodeBeingEdited(node);
    setShowNodeEditor(true);
  };

  const saveNodeEdit = (updatedNode: Node) => {
    setNodes(prev => prev.map(node => 
      node.id === updatedNode.id ? updatedNode : node
    ));
    setShowNodeEditor(false);
    setNodeBeingEdited(null);
  };

  const exportWorkflow = () => {
    const workflow = {
      name: workflowName,
      nodes,
      connections,
      version: '1.0',
      created: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflowName.replace(/\s+/g, '_')}.json`;
    a.click();
  };

  const executeWorkflow = async () => {
    // This would integrate with your existing AI query system
    console.log('Executing workflow:', { nodes, connections });
    
    // Find start node
    const startNode = nodes.find(n => n.type === 'start');
    if (!startNode) {
      alert('No start node found!');
      return;
    }

    // Build execution plan
    const executionPlan = buildExecutionPlan(nodes, connections);
    console.log('Execution plan:', executionPlan);
    
    // Simulate execution for demo
    simulateExecution();
  };

  const buildExecutionPlan = (nodes: Node[], connections: Connection[]) => {
    // Build a topological sort of the workflow
    const plan: { step: number; node: Node; dependencies: string[] }[] = [];
    const processed = new Set<string>();
    
    function processNode(nodeId: string, step: number): number {
      if (processed.has(nodeId)) return step;
      
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return step;
      
      const dependencies = connections
        .filter(conn => conn.to === nodeId)
        .map(conn => conn.from);
      
      plan.push({ step, node, dependencies });
      processed.add(nodeId);
      
      // Process connected nodes
      const nextConnections = connections.filter(conn => conn.from === nodeId);
      let nextStep = step + 1;
      for (const conn of nextConnections) {
        nextStep = Math.max(nextStep, processNode(conn.to, nextStep));
      }
      
      return nextStep;
    }
    
    const startNode = nodes.find(n => n.type === 'start');
    if (startNode) {
      processNode(startNode.id, 0);
    }
    
    return plan.sort((a, b) => a.step - b.step);
  };

  const getNodeIcon = (type: string, provider?: string) => {
    switch (type) {
      case 'start': return <Zap className="w-4 h-4" />;
      case 'ai': return <MessageSquare className="w-4 h-4" />;
      case 'decision': return <CheckCircle className="w-4 h-4" />;
      case 'end': return <CheckCircle className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getNodeColor = (type: string, provider?: string) => {
    switch (type) {
      case 'start': return 'bg-green-500';
      case 'ai': 
        switch (provider) {
          case 'openai': return 'bg-blue-500';
          case 'anthropic': return 'bg-orange-500';
          case 'google': return 'bg-red-500';
          default: return 'bg-purple-500';
        }
      case 'decision': return 'bg-yellow-500';
      case 'end': return 'bg-gray-500';
      default: return 'bg-purple-500';
    }
  };

  const renderConnection = (conn: Connection) => {
    const fromNode = nodes.find(n => n.id === conn.from);
    const toNode = nodes.find(n => n.id === conn.to);
    if (!fromNode || !toNode) return null;

    const x1 = fromNode.x + 40;
    const y1 = fromNode.y + 20;
    const x2 = toNode.x;
    const y2 = toNode.y + 20;

    // Create curved path for better visual flow
    const midX = (x1 + x2) / 2;
    const path = `M ${x1} ${y1} Q ${midX} ${y1} ${x2} ${y2}`;

    return (
      <g key={conn.id}>
        <path
          d={path}
          stroke="#64748b"
          strokeWidth="2"
          fill="none"
          className={conn.animated ? "animate-pulse" : ""}
          markerEnd="url(#arrowhead)"
        />
        {conn.animated && (
          <circle 
            r="4" 
            fill="#3b82f6"
            className="animate-bounce"
          >
            <animateMotion dur="3s" repeatCount="indefinite" path={path} />
          </circle>
        )}
      </g>
    );
  };

  const simulateExecution = () => {
    setExecutionStep(0);
    const steps = ['start', 'gpt', 'claude', 'decision', 'end'];
    
    steps.forEach((step, index) => {
      setTimeout(() => {
        setExecutionStep(index);
        // Animate connections leading to this step
        setConnections(prev => prev.map(conn => ({
          ...conn,
          animated: conn.to === step || (index === steps.length - 1 && conn.from === 'decision')
        })));
      }, index * 1500);
    });

    setTimeout(() => {
      setExecutionStep(-1);
      setConnections(SAMPLE_CONNECTIONS);
    }, steps.length * 1500 + 2000);
  };

  return (
    <div className="p-6 bg-white/80 backdrop-blur-sm rounded-lg border border-slate-200 shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">AI Workflow Builder</h3>
          <p className="text-sm text-slate-600">Drag nodes to rearrange • Click to simulate execution</p>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            placeholder="Workflow name"
          />
          <button
            onClick={executeWorkflow}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
            data-testid="button-execute-workflow"
          >
            <Zap className="w-4 h-4" />
            Execute
          </button>
          <button
            onClick={simulateExecution}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            data-testid="button-simulate-workflow"
          >
            <Zap className="w-4 h-4" />
            Simulate
          </button>
          <div className="relative group">
            <button
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors flex items-center gap-2"
              data-testid="button-add-node"
            >
              <Plus className="w-4 h-4" />
              Add Node
            </button>
            <div className="absolute top-full mt-2 right-0 bg-white border border-slate-300 rounded-lg shadow-lg p-2 hidden group-hover:block z-20">
              <button
                onClick={() => addNode('ai', 'openai')}
                className="block w-full text-left px-3 py-2 hover:bg-blue-50 rounded text-sm"
              >
                + OpenAI Node
              </button>
              <button
                onClick={() => addNode('ai', 'anthropic')}
                className="block w-full text-left px-3 py-2 hover:bg-orange-50 rounded text-sm"
              >
                + Anthropic Node
              </button>
              <button
                onClick={() => addNode('ai', 'google')}
                className="block w-full text-left px-3 py-2 hover:bg-red-50 rounded text-sm"
              >
                + Google Node
              </button>
              <button
                onClick={() => addNode('ai', 'perplexity')}
                className="block w-full text-left px-3 py-2 hover:bg-purple-50 rounded text-sm"
              >
                + Perplexity Node
              </button>
              <button
                onClick={() => addNode('decision')}
                className="block w-full text-left px-3 py-2 hover:bg-yellow-50 rounded text-sm"
              >
                + Decision Node
              </button>
            </div>
          </div>
          <button
            onClick={exportWorkflow}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2"
            data-testid="button-export-workflow"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          
          {onExecute && (
            <button
              onClick={() => onExecute({ nodes, edges: connections })}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              data-testid="button-execute-workflow"
            >
              <Zap className="w-4 h-4" />
              Execute Workflow
            </button>
          )}
        </div>
      </div>

      <div className="relative bg-slate-50/50 rounded-lg border-2 border-dashed border-slate-300 min-h-[400px] overflow-hidden">
        {/* SVG for connections */}
        <svg 
          ref={svgRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          style={{ minHeight: '400px' }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="#64748b"
              />
            </marker>
          </defs>
          {connections.map(renderConnection)}
        </svg>

        {/* Nodes */}
        {nodes.map((node) => (
          <div
            key={node.id}
            className={`absolute z-20 cursor-move transition-all duration-200 ${
              executionStep !== -1 ? 
                (nodes.indexOf(node) <= executionStep ? 'scale-110 shadow-lg' : 'opacity-50') : 
                'hover:scale-105'
            }`}
            style={{ 
              left: node.x, 
              top: node.y,
              transform: draggedNode === node.id ? 'scale(1.1)' : 'scale(1)'
            }}
            draggable
            onDragStart={(e) => {
              setDraggedNode(node.id);
              e.dataTransfer.effectAllowed = 'move';
            }}
            onDrag={(e) => {
              if (e.clientX > 0 && e.clientY > 0) {
                const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                if (rect) {
                  const newX = e.clientX - rect.left - 40;
                  const newY = e.clientY - rect.top - 20;
                  handleNodeDrag(node.id, Math.max(0, newX), Math.max(0, newY));
                }
              }
            }}
            onDragEnd={() => setDraggedNode(null)}
            data-testid={`node-${node.id}`}
            onDoubleClick={() => editNode(node)}
          >
            <div className={`
              w-20 h-10 ${getNodeColor(node.type, node.provider)} 
              rounded-lg flex items-center justify-center text-white shadow-md
              border-2 border-white relative group
              ${executionStep !== -1 && nodes.indexOf(node) === executionStep ? 
                'animate-pulse ring-4 ring-blue-300' : ''}
            `}>
              {getNodeIcon(node.type, node.provider)}
              <Move className="absolute -top-2 -right-2 w-3 h-3 opacity-60" />
              
              {/* Node controls */}
              <div className="absolute -top-1 -left-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    editNode(node);
                  }}
                  className="w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-blue-600"
                  title="Edit node"
                >
                  <Edit className="w-2 h-2" />
                </button>
                {node.type !== 'start' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNode(node.id);
                    }}
                    className="w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                    title="Delete node"
                  >
                    <Trash className="w-2 h-2" />
                  </button>
                )}
              </div>
            </div>
            <div className="text-xs text-center mt-1 font-medium text-slate-700 bg-white/80 rounded px-1">
              {node.title}
            </div>
          </div>
        ))}

        {/* Execution progress indicator */}
        {executionStep !== -1 && (
          <div className="absolute top-4 right-4 z-30 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border">
            <div className="text-sm font-medium text-slate-700 mb-2">Execution Progress</div>
            <div className="flex gap-1">
              {nodes.map((node, index) => (
                <div
                  key={node.id}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index <= executionStep ? 'bg-green-500 scale-110' : 
                    index === executionStep + 1 ? 'bg-yellow-500 animate-pulse' : 'bg-slate-300'
                  }`}
                />
              ))}
            </div>
            <div className="text-xs text-slate-600 mt-1">
              {executionStep < nodes.length ? `Step ${executionStep + 1}: ${nodes[executionStep]?.title}` : 'Complete'}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-slate-600">
        <strong>Workflow Builder Features:</strong>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li><strong>Add Nodes:</strong> Hover over "Add Node" to select AI providers or decision nodes</li>
          <li><strong>Edit Nodes:</strong> Double-click any node or use the edit button to configure settings</li>
          <li><strong>Delete Nodes:</strong> Hover over nodes and click the red trash button</li>
          <li><strong>Drag & Drop:</strong> Rearrange workflow by dragging nodes</li>
          <li><strong>Execute:</strong> Run real workflows through your AI providers</li>
          <li><strong>Export:</strong> Save workflows as JSON files for reuse</li>
        </ul>
      </div>

      {/* Node Editor Modal */}
      {showNodeEditor && nodeBeingEdited && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full">
            <h3 className="text-lg font-semibold mb-4">Edit Node: {nodeBeingEdited.title}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Node Title</label>
                <input
                  type="text"
                  value={nodeBeingEdited.title}
                  onChange={(e) => setNodeBeingEdited({...nodeBeingEdited, title: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              {nodeBeingEdited.type === 'ai' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">AI Provider</label>
                    <select
                      value={nodeBeingEdited.provider || ''}
                      onChange={(e) => setNodeBeingEdited({...nodeBeingEdited, provider: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    >
                      <option value="openai">OpenAI (ChatGPT-4)</option>
                      <option value="anthropic">Anthropic (Claude)</option>
                      <option value="google">Google (Gemini)</option>
                      <option value="perplexity">Perplexity</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Prompt Template</label>
                    <textarea
                      value={nodeBeingEdited.config?.prompt || ''}
                      onChange={(e) => setNodeBeingEdited({
                        ...nodeBeingEdited, 
                        config: {...nodeBeingEdited.config, prompt: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg h-20"
                      placeholder="Enter the prompt for this AI node..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Temperature</label>
                      <input
                        type="number"
                        min="0"
                        max="2"
                        step="0.1"
                        value={nodeBeingEdited.config?.temperature || 0.7}
                        onChange={(e) => setNodeBeingEdited({
                          ...nodeBeingEdited, 
                          config: {...nodeBeingEdited.config, temperature: parseFloat(e.target.value)}
                        })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Max Tokens</label>
                      <input
                        type="number"
                        min="1"
                        max="4000"
                        value={nodeBeingEdited.config?.maxTokens || 500}
                        onChange={(e) => setNodeBeingEdited({
                          ...nodeBeingEdited, 
                          config: {...nodeBeingEdited.config, maxTokens: parseInt(e.target.value)}
                        })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => saveNodeEdit(nodeBeingEdited)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Save Changes
              </button>
              <button
                onClick={() => {setShowNodeEditor(false); setNodeBeingEdited(null);}}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
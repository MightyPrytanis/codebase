# Cyrano Pathfinder: Unified Chat Interface

## Overview

The Cyrano Pathfinder is a unified chat interface that provides an intelligent, context-aware assistant for both LexFiat and Arkiver applications. It serves as the autonomous assistant of the Cyrano MCP server, offering guided Q&A, workflow navigation, and cross-app tool orchestration.

## Features

### 🤖 Multi-Model AI Support
- **Perplexity** (default) - Real-time web search capabilities
- **Anthropic Claude** - Advanced reasoning and analysis
- **OpenAI GPT-4** - General-purpose AI with strong capabilities
- **Google Gemini** - Data processing and pattern recognition
- **xAI Grok** - Direct and insightful analysis
- **DeepSeek** - Comprehensive analysis

### 🔧 Dual Operation Modes
1. **Guide Mode** (default) - Q&A and guidance without tool execution
2. **Execute Mode** - Can call MCP tools for actions (rag_query, workflow_manager, arkiver processors)

### 📊 Telemetry & Monitoring
- Tracks provider usage and performance
- Logs tool invocations
- Records success/failure rates
- Provides usage statistics

### 🎨 Consistent Branding
- Technorganic "C" logo with purple-blue gradient
- Consistent design across LexFiat and Arkiver
- Floating chat drawer with minimize/maximize
- Clean, modern UI with metadata badges

## Architecture

### Backend: `cyrano_pathfinder` Tool

Located in: `Cyrano/src/tools/cyrano-pathfinder.ts`

**Input Schema:**
```typescript
{
  message: string,              // User message
  context?: Record<string, any>, // Optional context (app, page, matter, etc.)
  model?: 'perplexity' | 'anthropic' | 'openai' | 'google' | 'xai' | 'deepseek',
  app?: 'lexfiat' | 'arkiver',  // Application context
  mode?: 'guide' | 'execute'     // Operation mode
}
```

**Output:**
```typescript
{
  response: string,              // AI response
  metadata: {
    model: string,               // Model used
    app?: string,                // App context
    mode: string,                // Mode used
    toolsCalled?: string[],      // Tools invoked (if execute mode)
    executionTimeMs: number      // Execution time
  }
}
```

**Key Methods:**
- `buildSystemPrompt()` - Generates branded system prompt
- `shouldExecuteTools()` - Detects action keywords
- `executeWithTools()` - Orchestrates tool calls
- `logTelemetry()` - Records usage data
- `getTelemetryStats()` - Returns usage statistics

### Frontend: CyranoChat Component

**LexFiat:** `LexFiat/client/src/components/cyrano-chat.tsx`
**Arkiver:** `apps/arkiver/frontend/src/components/CyranoChat.tsx`

**Props:**
```typescript
{
  app?: 'lexfiat' | 'arkiver',
  context?: Record<string, any>,
  defaultModel?: AIModel,
  onClose?: () => void,
  minimized?: boolean,
  onMinimize?: () => void
}
```

**Features:**
- Message history with timestamps
- Model selector dropdown
- Tool execution toggle
- Metadata badges (model, tools called, execution time)
- Error display with clear feedback
- Auto-scroll to latest message
- Keyboard shortcuts (Enter to send)

### Frontend: CyranoChatDrawer Component

**LexFiat:** `LexFiat/client/src/components/cyrano-chat-drawer.tsx`
**Arkiver:** `apps/arkiver/frontend/src/components/CyranoChatDrawer.tsx`

Provides a floating, expandable chat interface:
- Floating button in bottom-right corner
- Expands to 400x600px chat window
- Minimize/maximize functionality
- Persistent across page navigation

## Integration

### LexFiat Integration

```tsx
// In App.tsx
import { CyranoChatDrawer } from '@/components/cyrano-chat-drawer';

function App() {
  return (
    <div>
      {/* Other components */}
      <CyranoChatDrawer app="lexfiat" />
    </div>
  );
}
```

### Arkiver Integration

```tsx
// In App.tsx
import { CyranoChatDrawer } from './components/CyranoChatDrawer';

function App() {
  return (
    <div>
      {/* Other components */}
      <CyranoChatDrawer app="arkiver" />
    </div>
  );
}
```

## Configuration

### Environment Variables

The Cyrano Pathfinder requires API keys for AI providers to be configured in a `.env` file (not committed to the repository).

#### Required API Keys

Create a `.env` file in the `Cyrano/` directory with these **three primary providers**:

```bash
# Perplexity (Default - Real-time web search)
PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxx
# Get your key at: https://www.perplexity.ai/settings/api

# Anthropic Claude (Advanced reasoning)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxx
# Get your key at: https://console.anthropic.com/

# OpenAI (General-purpose AI)
OPENAI_API_KEY=sk-xxxxxxxxxxxx
# Get your key at: https://platform.openai.com/api-keys
```

#### Optional Additional Providers

For extended functionality, you can also add:

```bash
# Google Gemini (Long-context analysis)
GEMINI_API_KEY=xxxxxxxxxxxx
# or
GOOGLE_API_KEY=xxxxxxxxxxxx
# Get your key at: https://makersuite.google.com/app/apikey

# xAI Grok (Direct analysis)
XAI_API_KEY=xai-xxxxxxxxxxxx
# Get your key at: https://console.x.ai/

# DeepSeek (Comprehensive analysis)
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxx
# Get your key at: https://platform.deepseek.com/
```

**Note:** The system gracefully handles missing keys. If a provider is not configured, it will be disabled and users will see a helpful error message when attempting to use it.

### MCP Server URL

Frontend apps need the Cyrano MCP server URL:

```bash
# LexFiat .env
VITE_CYRANO_API_URL=http://localhost:5002

# Arkiver .env
VITE_CYRANO_API_URL=http://localhost:5002
```

## Usage Examples

### Basic Q&A (Guide Mode)

```
User: "What features does LexFiat have?"
Cyrano: "LexFiat is a legal workflow intelligence platform with the following features:
• Document intake and monitoring
• AI-powered analysis and red flag detection
• Draft preparation with AI assistance
• Attorney review workflow
• Compliance checking
• Time tracking and billing
..."
```

### Tool Execution (Execute Mode)

```
User: "Search for documents about contracts"
Cyrano: [Calls rag_query tool]
"I found 5 relevant documents about contracts:
1. Contract Review Guidelines (uploaded 2 days ago)
2. Sample Employment Contract (source: Clio)
3. NDA Template (uploaded 1 week ago)
..."
```

### Workflow Guidance

```
User: "How do I run a workflow?"
Cyrano: "To run a workflow in LexFiat:
1. Navigate to the MAE Workflows page
2. Select the workflow type (compare, critique, collaborate, or custom)
3. Provide the required inputs (case ID, documents, parameters)
4. Click 'Execute Workflow'
..."
```

## System Prompt

The Cyrano Pathfinder uses a branded system prompt:

```
You are the Cyrano Pathfinder, the autonomous assistant of the Cyrano Model Context Protocol (MCP) server.

Your mission: Help users navigate and operate [LexFiat|Arkiver]. Be transparent, truthful, and explicit about your capabilities and limitations.

Key principles:
1. **Tool Preference**: When users request actions, prefer using available MCP tools/modules/engines over just describing what to do.
2. **Source Attribution**: Always cite sources when you retrieve information from RAG or other tools.
3. **Transparency**: Be clear about which AI model you are using and what tools you're calling.
4. **User Guidance**: Provide clear, concise guidance for navigating workflows and features.
5. **Error Clarity**: If something goes wrong, explain it clearly and suggest alternatives.

Current mode: [GUIDE|EXECUTE]
```

## Error Handling

### Rate Limit Errors

When rate limits are hit, users see a friendly message:

```
🚦 Rate limit reached for the selected AI provider.

Please try again in a few moments, or switch to a different model in the chat settings.

Tip: Each AI provider has different rate limits. Consider upgrading your API plan if you frequently hit limits.
```

### Configuration Errors

When an AI provider is not configured:

```
AI provider "anthropic" is not configured.

Available providers: perplexity, openai

Please configure API keys in environment variables:
- PERPLEXITY_API_KEY (starts with pplx-)
- ANTHROPIC_API_KEY (starts with sk-ant-)
- OPENAI_API_KEY (starts with sk-)
...
```

## Telemetry

The Cyrano Pathfinder tracks:
- Provider usage (which AI models are used)
- App usage (LexFiat vs Arkiver)
- Mode usage (guide vs execute)
- Tool invocations (which tools are called)
- Success/failure rates
- Execution times

Access telemetry via:
```typescript
const stats = cyranoPathfinder.getTelemetryStats();
// Returns:
// {
//   totalCalls: number,
//   successRate: number,
//   providerUsage: Record<string, number>,
//   appUsage: Record<string, number>,
//   modeUsage: Record<string, number>,
//   toolUsage: Record<string, number>
// }
```

## Testing

Unit tests are located in `Cyrano/tests/tools/cyrano-pathfinder.test.ts`

Run tests:
```bash
cd Cyrano
npm run test:unit -- cyrano-pathfinder
```

Test coverage includes:
- Tool definition validation
- System prompt generation
- Model and mode configuration
- Context handling
- Action keyword detection
- Rate limit error detection
- Telemetry logging
- Tool selection heuristics

## Future Enhancements

Potential improvements:
- [ ] Conversation history persistence
- [ ] User preferences (default model, mode)
- [ ] Custom system prompts per user
- [ ] Advanced tool orchestration with dependencies
- [ ] Voice input/output
- [ ] Multi-turn tool execution with planning
- [ ] Integration with more MCP tools
- [ ] Real-time streaming responses
- [ ] Conversation export/import
- [ ] Multi-language support

## Troubleshooting

### Chat doesn't appear
- Ensure CyranoChatDrawer is included in App.tsx
- Check that the component is not being hidden by z-index issues
- Verify that React is rendering without errors (check console)

### AI responses fail
- Verify API keys are configured correctly
- Check that the Cyrano MCP server is running (default: http://localhost:5002)
- Ensure CORS is configured if accessing from a different origin
- Check browser console for network errors

### Tools not executing
- Ensure mode is set to "execute" (toggle in settings)
- Verify that the message contains action keywords
- Check that the requested tools are available in the MCP server
- Review logs for tool execution errors

## License

Copyright 2025 Cognisint LLC  
Licensed under the Apache License, Version 2.0

## Support

For issues or questions:
- Open an issue in the repository
- Contact the development team
- Review the documentation in `docs/`

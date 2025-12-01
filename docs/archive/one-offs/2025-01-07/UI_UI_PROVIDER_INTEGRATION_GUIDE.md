---
Document ID: PROVIDER-INTEGRATION-GUIDE
Title: Provider Integration Guide
Subject(s): UI
Project: Cyrano
Version: v548
Created: 2025-11-24 (2025-W48)
Last Substantive Revision: 2025-11-24 (2025-W48)
Last Format Update: 2025-11-28 (2025-W48)
Owner: David W Towne / Cognisint LLC
Copyright: © 2025 Cognisint LLC
Status: Active
---

**Created:** 2025-11-24  
**Purpose:** Integrate Gemini, xAI Grok, and DeepSeek into Cyrano's AI provider system

---

## Integration Overview

### Provider Selection Strategy
1. **Default Orchestrator:** Perplexity (real-time research, web data)
2. **Automatic Assignment:** Models selected based on task suitability
3. **User Sovereignty:** Users can override automatic selection
4. **No Provider Preference:** All providers treated equally for their strengths
5. **Fallback Chain:** If selected provider fails, cascade to next best for task

### Integration Checklist
- [ ] Environment variables configured
- [ ] Provider adapter class created
- [ ] Error handling implemented
- [ ] Rate limiting configured
- [ ] Fallback logic added
- [ ] Telemetry/logging enabled
- [ ] Cost tracking added
- [ ] Integration tests written
- [ ] Documentation updated

---

## 1. Google Gemini Integration

### Models to Enable
| Model ID | Description | Context | Cost (per 1M tokens) | Use Case |
|----------|-------------|---------|---------------------|----------|
| `gemini-1.5-pro` | Most capable, multimodal | 2M tokens | $3.50 input / $10.50 output | Long documents, complex analysis |
| `gemini-1.5-flash` | Fast, efficient | 1M tokens | $0.075 input / $0.30 output | Quick tasks, drafting |
| `gemini-1.5-flash-8b` | Fastest, cheapest | 1M tokens | $0.0375 input / $0.15 output | Simple queries, batch processing |

**Recommended Default:** `gemini-1.5-flash` (balance of speed and quality)

### Environment Variables
```bash
# .env file
GEMINI_API_KEY=your-api-key-here
GEMINI_DEFAULT_MODEL=gemini-1.5-flash
GEMINI_MAX_RETRIES=3
GEMINI_TIMEOUT=60000
GEMINI_RATE_LIMIT_RPM=60
```

### API Integration Pattern
```typescript
// src/providers/gemini-provider.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseProvider } from './base-provider';

export class GeminiProvider extends BaseProvider {
  private client: GoogleGenerativeAI;
  
  constructor() {
    super('gemini');
    this.client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }
  
  async chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse> {
    const model = this.client.getGenerativeModel({ 
      model: options?.model || process.env.GEMINI_DEFAULT_MODEL!,
      generationConfig: {
        temperature: options?.temperature || 0.7,
        maxOutputTokens: options?.maxTokens || 8192,
      }
    });
    
    try {
      const chat = model.startChat({
        history: this.convertMessagesToGeminiFormat(messages.slice(0, -1)),
      });
      
      const result = await chat.sendMessage(messages[messages.length - 1].content);
      const response = await result.response;
      
      return {
        content: response.text(),
        model: options?.model || process.env.GEMINI_DEFAULT_MODEL!,
        usage: {
          inputTokens: response.usageMetadata?.promptTokenCount || 0,
          outputTokens: response.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: response.usageMetadata?.totalTokenCount || 0,
        },
        finishReason: this.mapFinishReason(response.candidates?.[0]?.finishReason),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  private convertMessagesToGeminiFormat(messages: Message[]) {
    return messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));
  }
  
  private mapFinishReason(reason?: string): string {
    const mapping: Record<string, string> = {
      'STOP': 'stop',
      'MAX_TOKENS': 'length',
      'SAFETY': 'content_filter',
      'RECITATION': 'content_filter',
    };
    return mapping[reason || 'STOP'] || 'stop';
  }
}
```

### Rate Limits
- Free tier: 15 RPM (requests per minute), 1M TPM (tokens per minute)
- Pay-as-you-go: 360 RPM, 10M TPM
- Implement exponential backoff on 429 errors

### Error Handling
```typescript
private handleError(error: any): ChatResponse {
  if (error.status === 429) {
    throw new RateLimitError('Gemini rate limit exceeded', { retryAfter: 60 });
  }
  if (error.status === 401) {
    throw new AuthenticationError('Invalid Gemini API key');
  }
  if (error.status === 400) {
    throw new ValidationError(`Gemini request invalid: ${error.message}`);
  }
  throw new ProviderError(`Gemini error: ${error.message}`);
}
```

### Testing Checklist
- [ ] API key validation
- [ ] Basic chat request/response
- [ ] Multi-turn conversation
- [ ] Token counting accuracy
- [ ] Rate limit handling
- [ ] Error scenarios (401, 429, 500)
- [ ] Fallback to secondary model
- [ ] Long context handling (1M+ tokens)

---

## 2. xAI Grok Integration

### Models to Enable
| Model ID | Description | Context | Cost (per 1M tokens) | Use Case |
|----------|-------------|---------|---------------------|----------|
| `grok-beta` | Latest model | 128K tokens | TBD (currently in beta) | General purpose |
| `grok-vision-beta` | Multimodal | 128K tokens | TBD | Image analysis |

**Recommended Default:** `grok-beta`

### Environment Variables
```bash
# .env file
XAI_API_KEY=your-api-key-here
XAI_DEFAULT_MODEL=grok-beta
XAI_MAX_RETRIES=3
XAI_TIMEOUT=60000
XAI_BASE_URL=https://api.x.ai/v1
```

### API Integration Pattern
```typescript
// src/providers/xai-provider.ts
import { BaseProvider } from './base-provider';

export class XaiProvider extends BaseProvider {
  private baseUrl: string;
  
  constructor() {
    super('xai');
    this.baseUrl = process.env.XAI_BASE_URL || 'https://api.x.ai/v1';
  }
  
  async chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: options?.model || process.env.XAI_DEFAULT_MODEL,
          messages: messages,
          temperature: options?.temperature || 0.7,
          max_tokens: options?.maxTokens || 4096,
          stream: options?.stream || false,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`xAI API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        content: data.choices[0].message.content,
        model: data.model,
        usage: {
          inputTokens: data.usage.prompt_tokens,
          outputTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        },
        finishReason: data.choices[0].finish_reason,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  private handleError(error: any): ChatResponse {
    if (error.message.includes('401')) {
      throw new AuthenticationError('Invalid xAI API key');
    }
    if (error.message.includes('429')) {
      throw new RateLimitError('xAI rate limit exceeded', { retryAfter: 60 });
    }
    throw new ProviderError(`xAI error: ${error.message}`);
  }
}
```

### Rate Limits
- Beta period: Contact xAI for limits
- Expected: 60 RPM for standard tier

### Special Features
- Real-time access to X (Twitter) data
- Strong reasoning capabilities
- Optimized for factual accuracy

### Testing Checklist
- [ ] API key validation
- [ ] OpenAI-compatible endpoint
- [ ] Basic chat request/response
- [ ] Token counting
- [ ] Rate limit handling
- [ ] Error scenarios
- [ ] Fallback logic

---

## 3. DeepSeek Integration

### Models to Enable
| Model ID | Description | Context | Cost (per 1M tokens) | Use Case |
|----------|-------------|---------|---------------------|----------|
| `deepseek-chat` | General purpose | 64K tokens | $0.14 input / $0.28 output | Conversational AI |
| `deepseek-coder` | Code-focused | 64K tokens | $0.14 input / $0.28 output | Code generation, debugging |

**Recommended Default:** `deepseek-coder` (for legal tech code generation)

### Environment Variables
```bash
# .env file
DEEPSEEK_API_KEY=your-api-key-here
DEEPSEEK_DEFAULT_MODEL=deepseek-coder
DEEPSEEK_MAX_RETRIES=3
DEEPSEEK_TIMEOUT=60000
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
```

### API Integration Pattern
```typescript
// src/providers/deepseek-provider.ts
import { BaseProvider } from './base-provider';

export class DeepSeekProvider extends BaseProvider {
  private baseUrl: string;
  
  constructor() {
    super('deepseek');
    this.baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';
  }
  
  async chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: options?.model || process.env.DEEPSEEK_DEFAULT_MODEL,
          messages: messages,
          temperature: options?.temperature || 0.7,
          max_tokens: options?.maxTokens || 4096,
          stream: options?.stream || false,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        content: data.choices[0].message.content,
        model: data.model,
        usage: {
          inputTokens: data.usage.prompt_tokens,
          outputTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        },
        finishReason: data.choices[0].finish_reason,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  private handleError(error: any): ChatResponse {
    if (error.message.includes('401')) {
      throw new AuthenticationError('Invalid DeepSeek API key');
    }
    if (error.message.includes('429')) {
      throw new RateLimitError('DeepSeek rate limit exceeded', { retryAfter: 60 });
    }
    throw new ProviderError(`DeepSeek error: ${error.message}`);
  }
}
```

### Rate Limits
- Standard tier: 60 RPM
- Pro tier: 300 RPM

### Special Features
- Excellent code generation
- Strong mathematical reasoning
- Cost-effective pricing

### Testing Checklist
- [ ] API key validation
- [ ] OpenAI-compatible endpoint
- [ ] Code generation quality
- [ ] Token counting
- [ ] Rate limit handling
- [ ] Error scenarios
- [ ] Fallback logic

---

## 4. Provider Fallback Strategy

### Fallback Chain
```typescript
// src/providers/provider-manager.ts
export class ProviderManager {
  private providers: BaseProvider[];
  private fallbackChain: string[];
  
  constructor() {
    this.providers = [
      new ClaudeProvider(),
      new OpenAIProvider(),
      new GeminiProvider(),
      new XaiProvider(),
      new DeepSeekProvider(),
    ];
    
    // Default fallback order (customized per task type)
    this.fallbackChain = [
      'perplexity',    // Default orchestrator
      'openai',        // General purpose
      'anthropic',     // Safety-critical
      'gemini',        // Long-context processing
      'xai',           // Direct analysis
      'deepseek',      // Comprehensive analysis
    ];
    
    // Note: Actual provider selection is task-based, not fixed priority
    // Users can always override via options.provider
  }
  
  async chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse> {
    const preferredProvider = options?.provider || this.fallbackChain[0];
    
    for (const providerName of this.reorderFallbackChain(preferredProvider)) {
      const provider = this.getProvider(providerName);
      
      try {
        const response = await provider.chat(messages, options);
        
        // Log successful provider
        this.logProviderSuccess(providerName, response);
        
        return response;
      } catch (error) {
        // Log failure and try next provider
        this.logProviderFailure(providerName, error);
        
        // If last provider, throw error
        if (providerName === this.fallbackChain[this.fallbackChain.length - 1]) {
          throw new Error(`All providers failed: ${error.message}`);
        }
        
        // Continue to next provider
        continue;
      }
    }
    
    throw new Error('No providers available');
  }
  
  private reorderFallbackChain(preferredProvider: string): string[] {
    const chain = [...this.fallbackChain];
    const index = chain.indexOf(preferredProvider);
    
    if (index > 0) {
      chain.splice(index, 1);
      chain.unshift(preferredProvider);
    }
    
    return chain;
  }
  
  private getProvider(name: string): BaseProvider {
    const provider = this.providers.find(p => p.name === name);
    if (!provider) {
      throw new Error(`Provider not found: ${name}`);
    }
    return provider;
  }
  
  private logProviderSuccess(name: string, response: ChatResponse): void {
    console.log(`[ProviderManager] ${name} succeeded`, {
      model: response.model,
      tokens: response.usage?.totalTokens,
    });
  }
  
  private logProviderFailure(name: string, error: any): void {
    console.error(`[ProviderManager] ${name} failed`, {
      error: error.message,
    });
  }
}
```

### Fallback Decision Matrix
| Error Type | Action | Next Provider |
|------------|--------|---------------|
| Rate limit (429) | Wait 60s, retry same provider | If retry fails, next in chain |
| Auth error (401) | Skip provider | Next in chain |
| Server error (500) | Retry once, then skip | Next in chain |
| Timeout | Retry with longer timeout | If retry fails, next in chain |
| Content filter | Try next provider immediately | Next in chain |
| Invalid request (400) | Log error, try next | Next in chain |

---

## 5. Cost Tracking

### Cost Calculator
```typescript
// src/providers/cost-tracker.ts
export class CostTracker {
  private costs: Record<string, number> = {
    'claude-3-opus': { input: 15, output: 75 },           // per 1M tokens
    'gpt-4': { input: 30, output: 60 },
    'gemini-1.5-pro': { input: 3.5, output: 10.5 },
    'gemini-1.5-flash': { input: 0.075, output: 0.3 },
    'gemini-1.5-flash-8b': { input: 0.0375, output: 0.15 },
    'grok-beta': { input: 5, output: 15 },                // estimated
    'deepseek-chat': { input: 0.14, output: 0.28 },
    'deepseek-coder': { input: 0.14, output: 0.28 },
  };
  
  calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const modelCosts = this.costs[model];
    if (!modelCosts) {
      console.warn(`Cost data not available for model: ${model}`);
      return 0;
    }
    
    const inputCost = (inputTokens / 1_000_000) * modelCosts.input;
    const outputCost = (outputTokens / 1_000_000) * modelCosts.output;
    
    return inputCost + outputCost;
  }
  
  async logCost(
    provider: string,
    model: string,
    usage: { inputTokens: number; outputTokens: number }
  ): Promise<void> {
    const cost = this.calculateCost(model, usage.inputTokens, usage.outputTokens);
    
    // Log to database or analytics service
    console.log(`[CostTracker] ${provider}/${model}`, {
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      cost: `$${cost.toFixed(6)}`,
    });
    
    // TODO: Store in database for reporting
  }
}
```

---

## 6. Telemetry & Logging

### Logging Standards
```typescript
// src/providers/telemetry.ts
export interface ProviderTelemetry {
  provider: string;
  model: string;
  timestamp: Date;
  durationMs: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  success: boolean;
  error?: string;
  userId?: string;
  taskType?: string;
}

export class TelemetryLogger {
  async log(telemetry: ProviderTelemetry): Promise<void> {
    // Log to console
    console.log('[Telemetry]', JSON.stringify(telemetry, null, 2));
    
    // TODO: Send to analytics service (e.g., PostHog, Mixpanel)
    // TODO: Store in database for reporting
  }
}
```

### Metrics to Track
- Requests per provider
- Success/failure rates
- Average response time
- Token usage per provider
- Cost per provider
- Fallback frequency
- Error types by provider

---

## 7. Configuration

### Provider Configuration File
```typescript
// src/providers/config.ts
export interface ProviderConfig {
  name: string;
  enabled: boolean;
  priority: number;
  models: string[];
  defaultModel: string;
  rateLimit: {
    rpm: number;    // Requests per minute
    tpm: number;    // Tokens per minute
  };
  timeout: number;  // milliseconds
  maxRetries: number;
  retryDelay: number; // milliseconds
}

export const PROVIDER_CONFIGS: ProviderConfig[] = [
  {
    name: 'claude',
    enabled: true,
    priority: 1,
    models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
    defaultModel: 'claude-3-sonnet',
    rateLimit: { rpm: 50, tpm: 100_000 },
    timeout: 60_000,
    maxRetries: 3,
    retryDelay: 1_000,
  },
  {
    name: 'openai',
    enabled: true,
    priority: 2,
    models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    defaultModel: 'gpt-4-turbo',
    rateLimit: { rpm: 60, tpm: 150_000 },
    timeout: 60_000,
    maxRetries: 3,
    retryDelay: 1_000,
  },
  {
    name: 'gemini',
    enabled: true,
    priority: 3,
    models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'],
    defaultModel: 'gemini-1.5-flash',
    rateLimit: { rpm: 360, tpm: 10_000_000 },
    timeout: 60_000,
    maxRetries: 3,
    retryDelay: 1_000,
  },
  {
    name: 'xai',
    enabled: true,
    priority: 4,
    models: ['grok-beta', 'grok-vision-beta'],
    defaultModel: 'grok-beta',
    rateLimit: { rpm: 60, tpm: 100_000 },
    timeout: 60_000,
    maxRetries: 3,
    retryDelay: 1_000,
  },
  {
    name: 'deepseek',
    enabled: true,
    priority: 5,
    models: ['deepseek-chat', 'deepseek-coder'],
    defaultModel: 'deepseek-coder',
    rateLimit: { rpm: 60, tpm: 100_000 },
    timeout: 60_000,
    maxRetries: 3,
    retryDelay: 1_000,
  },
];
```

---

## 8. Testing Strategy

### Integration Tests
```typescript
// src/providers/__tests__/provider-integration.test.ts
describe('Provider Integration Tests', () => {
  describe('Gemini Provider', () => {
    it('should authenticate successfully', async () => {
      const provider = new GeminiProvider();
      const response = await provider.chat([
        { role: 'user', content: 'Hello' }
      ]);
      expect(response.content).toBeTruthy();
    });
    
    it('should handle rate limits', async () => {
      // Test rate limit handling
    });
    
    it('should fallback on error', async () => {
      // Test fallback logic
    });
  });
  
  // Repeat for xAI and DeepSeek
});
```

### Load Tests
- Test rate limit handling under load
- Test fallback chain performance
- Measure response times per provider

---

## 9. Migration Plan

### Phase 1: Setup (Week 1)
1. Create provider adapter classes
2. Add environment variables
3. Implement basic chat functionality
4. Add unit tests

### Phase 2: Integration (Week 2)
1. Integrate with ProviderManager
2. Implement fallback logic
3. Add cost tracking
4. Add telemetry

### Phase 3: Testing (Week 3)
1. Integration tests
2. Load tests
3. Error scenario tests
4. Fallback chain tests

### Phase 4: Deployment (Week 4)
1. Deploy to staging
2. Monitor performance
3. Tune rate limits
4. Deploy to production

---

## 10. Troubleshooting

### Common Issues
| Issue | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Invalid API key | Check env variable, regenerate key |
| 429 Rate Limit | Too many requests | Implement backoff, check rate limits |
| 500 Server Error | Provider outage | Fallback to next provider |
| Timeout | Slow response | Increase timeout, retry |
| Invalid model | Model name wrong | Check model ID spelling |

### Debug Logging
```typescript
// Enable debug logging
export const DEBUG_PROVIDERS = process.env.DEBUG_PROVIDERS === 'true';

if (DEBUG_PROVIDERS) {
  console.log('[Provider]', {
    provider: this.name,
    model: options?.model,
    messages: messages.length,
    temperature: options?.temperature,
  });
}
```

---

**Last Updated:** 2025-11-24  
**Integration Status:** Planning phase  
**Target Completion:** 4 weeks from start

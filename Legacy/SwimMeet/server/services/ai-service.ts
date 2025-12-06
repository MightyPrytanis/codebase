import OpenAI from "openai";
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from "@google/genai";

/*
Follow these instructions when using this blueprint:
1. Note that the newest OpenAI model is "gpt-4o", not "gpt-4". gpt-4o was released after your knowledge cutoff. Always prefer using gpt-4o as it is the latest model.
2. The newest Anthropic model is "claude-sonnet-4-20250514", not older 3.x models.
3. Note that the newest Gemini model series is "gemini-2.5-flash" or "gemini-2.5-pro"
*/

export interface AIServiceResponse {
  success: boolean;
  content?: string;
  error?: string;
}

export class AIService {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;
  private gemini: GoogleGenAI | null = null;
  private perplexity: OpenAI | null = null;
  private grok: OpenAI | null = null;
  private copilotApiKey: string | null = null;
  private llamaApiKey: string | null = null;

  constructor(credentials: Record<string, string>) {
    this.initializeClients(credentials);
  }

  private initializeClients(credentials: Record<string, string>) {
    // Use stored credentials or fallback to environment variables
    const openaiKey = credentials.openai || process.env.OPENAI_API_KEY;
    const anthropicKey = credentials.anthropic || process.env.ANTHROPIC_API_KEY;
    const geminiKey = credentials.google || process.env.GEMINI_API_KEY;
    const perplexityKey = credentials.perplexity || process.env.PERPLEXITY_API_KEY;
    const xaiKey = credentials.grok || process.env.XAI_API_KEY;
    const copilotKey = credentials.microsoft || process.env.COPILOT_API_KEY || "dfa5965f91msh742cae2064e8d2bp13f2a9jsn65b7d5c83e6b";
    const llamaKey = credentials.llama || process.env.LLAMA_API_KEY || "dfa5965f91msh742cae2064e8d2bp13f2a9jsn65b7d5c83e6b";

    if (openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey });
    }

    if (anthropicKey) {
      this.anthropic = new Anthropic({ apiKey: anthropicKey });
    }

    if (geminiKey) {
      this.gemini = new GoogleGenAI({ apiKey: geminiKey });
    }

    if (perplexityKey) {
      this.perplexity = new OpenAI({ 
        baseURL: "https://api.perplexity.ai", 
        apiKey: perplexityKey 
      });
    }

    if (xaiKey) {
      this.grok = new OpenAI({ 
        baseURL: "https://api.x.ai/v1", 
        apiKey: xaiKey 
      });
    }

    if (copilotKey) {
      this.copilotApiKey = copilotKey;
    }

    if (llamaKey) {
      this.llamaApiKey = llamaKey;
    }
  }

  async queryOpenAI(prompt: string): Promise<AIServiceResponse> {
    if (!this.openai) {
      return { success: false, error: "OpenAI API key not configured" };
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // newest OpenAI model is "gpt-4o"
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2000,
      });

      return {
        success: true,
        content: response.choices[0].message.content || "No response generated",
      };
    } catch (error: any) {
      return {
        success: false,
        error: `OpenAI error: ${error.message}`,
      };
    }
  }

  async queryAnthropic(prompt: string): Promise<AIServiceResponse> {
    if (!this.anthropic) {
      return { success: false, error: "Anthropic API key not configured" };
    }

    try {
      const response = await this.anthropic.messages.create({
        model: "claude-sonnet-4-20250514", // newest Anthropic model
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      });

      return {
        success: true,
        content: response.content[0].type === 'text' ? response.content[0].text : "No text response",
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Anthropic error: ${error.message}`,
      };
    }
  }

  async queryGemini(prompt: string): Promise<AIServiceResponse> {
    if (!this.gemini) {
      return { success: false, error: "Google AI API key not configured" };
    }

    try {
      const response = await this.gemini.models.generateContent({
        model: "gemini-2.5-flash", // newest Gemini model
        contents: prompt,
      });

      return {
        success: true,
        content: response.text || "No response generated",
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Gemini error: ${error.message}`,
      };
    }
  }

  async queryMicrosoft(prompt: string): Promise<AIServiceResponse> {
    if (!this.copilotApiKey) {
      return { success: false, error: "Microsoft Copilot API key not configured" };
    }

    try {
      const response = await fetch("https://copilot5.p.rapidapi.com/copilot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-rapidapi-host": "copilot5.p.rapidapi.com",
          "x-rapidapi-key": this.copilotApiKey,
        },
        body: JSON.stringify({
          message: prompt,
          conversation_id: null,
          mode: "CHAT",
          markdown: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        content: data.data || data.message || "No response generated",
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Microsoft Copilot error: ${error.message}`,
      };
    }
  }

  async queryPerplexity(prompt: string): Promise<AIServiceResponse> {
    if (!this.perplexity) {
      return { success: false, error: "Perplexity API key not configured" };
    }

    try {
      const response = await this.perplexity.chat.completions.create({
        model: "sonar",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2000,
        temperature: 0.2,
      });

      return {
        success: true,
        content: response.choices[0].message.content || "No response generated",
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Perplexity error: ${error.message}`,
      };
    }
  }

  async queryGrok(prompt: string): Promise<AIServiceResponse> {
    if (!this.grok) {
      return { success: false, error: "Grok API key not configured" };
    }

    try {
      const response = await this.grok.chat.completions.create({
        model: "grok-2-1212",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2000,
      });

      return {
        success: true,
        content: response.choices[0].message.content || "No response generated",
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Grok error: ${error.message}`,
      };
    }
  }

  async queryDeepSeek(prompt: string): Promise<AIServiceResponse> {
    return { success: false, error: "DeepSeek API not configured" };
  }

  async queryLlama(prompt: string): Promise<AIServiceResponse> {
    if (!this.llamaApiKey) {
      return { success: false, error: "Llama API key not configured" };
    }

    try {
      const response = await fetch("https://meta-llama-3-8b.p.rapidapi.com/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-rapidapi-host": "meta-llama-3-8b.p.rapidapi.com",
          "x-rapidapi-key": this.llamaApiKey,
        },
        body: JSON.stringify({
          model: "llama-3.1-8B-Instruct",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        content: data.choices?.[0]?.message?.content || data.data || data.message || "No response generated",
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Llama error: ${error.message}`,
      };
    }
  }

  async queryMultiple(prompt: string, providers: string[]): Promise<Record<string, AIServiceResponse>> {
    const results: Record<string, AIServiceResponse> = {};
    
    const promises = providers.map(async (provider) => {
      let result: AIServiceResponse;
      
      switch (provider) {
        case 'openai':
          result = await this.queryOpenAI(prompt);
          break;
        case 'anthropic':
          result = await this.queryAnthropic(prompt);
          break;
        case 'google':
          result = await this.queryGemini(prompt);
          break;
        case 'microsoft':
          result = await this.queryMicrosoft(prompt);
          break;
        case 'perplexity':
          result = await this.queryPerplexity(prompt);
          break;
        case 'grok':
          result = await this.queryGrok(prompt);
          break;
        case 'deepseek':
          result = await this.queryDeepSeek(prompt);
          break;
        case 'llama':
          result = await this.queryLlama(prompt);
          break;
        case 'mistral':
          result = { success: false, error: "Mistral AI not yet implemented" };
          break;
        default:
          result = { success: false, error: `Unsupported provider: ${provider}` };
      }
      
      results[provider] = result;
    });

    await Promise.all(promises);
    return results;
  }

  async humanizeResponse(response: string): Promise<string> {
    // Use Anthropic/Claude to humanize the response naturally
    if (this.anthropic) {
      try {
        const humanizePrompt = `Please rewrite the following response to sound more natural and human-like while preserving all the factual content and meaning. Remove any AI-specific language, make it conversational, and ensure it flows naturally:

"${response}"

Provide only the humanized version, no explanations.`;

        const result = await this.anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          messages: [{ role: "user", content: humanizePrompt }]
        });

        return result.content[0].type === 'text' ? result.content[0].text : response;
      } catch (error) {
        console.error('Humanization failed, using fallback:', error);
      }
    }

    // Fallback method if Anthropic is not available
    const humanizedNames = ['Linda', 'Marcus', 'Sarah', 'David', 'Emma', 'James', 'Maria', 'Alex'];
    const randomName = humanizedNames[Math.floor(Math.random() * humanizedNames.length)];
    
    let humanized = response
      .replace(/As an AI/gi, 'As someone')
      .replace(/I'm an AI/gi, `I'm ${randomName}`)
      .replace(/AI model/gi, 'person')
      .replace(/my training/gi, 'my experience')
      .replace(/I was trained/gi, 'I learned')
      .replace(/based on my training data/gi, 'from what I know')
      .replace(/I don't have real-time/gi, `I don't have the latest`)
      .replace(/ChatGPT|Claude|Gemini|GPT-4|AI assistant/gi, randomName);

    return humanized;
  }
}

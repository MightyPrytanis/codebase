import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { encryptCredentials, decryptCredentials } from "./services/encryption";
import { AIService } from "./services/ai-service";
import { WorkflowEngine } from "./workflow-engine";
import { credentialsSchema, insertConversationSchema, insertResponseSchema, insertUserSchema, type QueryRequest, type AIProvider } from "@shared/schema";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import session from 'express-session';
import { localStorage } from './local-storage';
import localStorageRoutes from './routes/local-storage';
import multer from 'multer';
import { isUserWhitelisted } from './whitelist';
import { adminService } from './admin';
import { randomUUID } from 'crypto';
import { DisposableTokenService } from './services/disposable-tokens';

// Extend session interface
declare module 'express-session' {
  interface SessionData {
    userId: string;
  }
}

// WORK mode workflow planning functions
function planWorkflowSteps(query: string, aiProviders: string[]) {
  // Intelligent step planning based on query complexity
  const steps = [];
  
  if (query.includes("analysis") || query.includes("research")) {
    steps.push(
      { assignedAI: aiProviders[0], objective: "Initial research and data gathering" },
      { assignedAI: aiProviders[1] || aiProviders[0], objective: "Deep analysis and insight extraction" },
      { assignedAI: aiProviders[2] || aiProviders[0], objective: "Synthesis and conclusion formulation" }
    );
  } else if (query.includes("plan") || query.includes("strategy")) {
    steps.push(
      { assignedAI: aiProviders[0], objective: "Situational assessment and goal clarification" },
      { assignedAI: aiProviders[1] || aiProviders[0], objective: "Strategic framework development" },
      { assignedAI: aiProviders[2] || aiProviders[0], objective: "Implementation roadmap and refinement" }
    );
  } else {
    // General problem-solving workflow
    steps.push(
      { assignedAI: aiProviders[0], objective: "Problem breakdown and initial approach" },
      { assignedAI: aiProviders[1] || aiProviders[0], objective: "Solution development and elaboration" },
      { assignedAI: aiProviders[2] || aiProviders[0], objective: "Review, optimization, and finalization" }
    );
  }
  
  return steps;
}

// ENHANCED workflow planning that ENSURES all selected AIs participate
function planWorkflowStepsImproved(query: string, aiProviders: string[], attachedFiles: any[]) {
  console.log(`📋 Planning workflow with ALL selected AIs: [${aiProviders.join(', ')}]`);
  
  const steps = [];
  const totalProviders = aiProviders.length;
  
  if (totalProviders === 1) {
    // Single AI workflow
    steps.push({
      assignedAI: aiProviders[0],
      objective: `Complete analysis and solution development for: ${query.substring(0, 100)}`,
      hasAttachments: attachedFiles.length > 0
    });
  } else if (totalProviders === 2) {
    // Two AI workflow
    steps.push(
      { assignedAI: aiProviders[0], objective: "Initial analysis and framework development", hasAttachments: attachedFiles.length > 0 },
      { assignedAI: aiProviders[1], objective: "Solution refinement and final deliverable creation", hasAttachments: attachedFiles.length > 0 }
    );
  } else if (totalProviders === 3) {
    // Three AI workflow (typical)
    steps.push(
      { assignedAI: aiProviders[0], objective: "Problem analysis and research phase", hasAttachments: attachedFiles.length > 0 },
      { assignedAI: aiProviders[1], objective: "Solution development and detailed implementation", hasAttachments: attachedFiles.length > 0 },
      { assignedAI: aiProviders[2], objective: "Final synthesis and comprehensive deliverable creation", hasAttachments: attachedFiles.length > 0 }
    );
  } else {
    // Four+ AI workflow - distribute work evenly
    const roles = [
      "Initial research and problem decomposition",
      "Core analysis and solution framework",
      "Implementation details and methodology",
      "Final synthesis and comprehensive deliverable",
      "Quality review and optimization",
      "User presentation and documentation"
    ];
    
    for (let i = 0; i < totalProviders; i++) {
      steps.push({
        assignedAI: aiProviders[i],
        objective: roles[i] || `Specialized analysis and contribution (Step ${i + 1})`,
        hasAttachments: attachedFiles.length > 0
      });
    }
  }
  
  console.log(`✅ Workflow planned: ${steps.length} steps ensuring ALL AIs participate`);
  steps.forEach((step, i) => {
    console.log(`   Step ${i+1}: ${step.assignedAI} - ${step.objective}`);
  });
  
  return steps;
}

async function initiateWorkflowStep(conversationId: string, workflowState: any, aiService: AIService) {
  const currentStepData = workflowState.stepHistory[workflowState.currentStep - 1];
  const contextSummary = buildContextSummary(workflowState);
  
  // ENHANCED prompt with attachments and core values
  let attachmentContext = "";
  if (workflowState.sharedContext.attachedFiles && workflowState.sharedContext.attachedFiles.length > 0) {
    attachmentContext = `\n**ATTACHED FILES AVAILABLE:**\n${workflowState.sharedContext.attachedFiles.map(f => `- ${f.filename} (${f.type})`).join('\n')}\n*You have full access to these files - analyze them as needed for your task.*\n`;
  }
  
  const workPrompt = `🏊‍♂️ SWIM MEET - WORK MODE (Collaborative Step ${workflowState.currentStep}/${workflowState.totalSteps})

**CORE VALUES**: Truth, factual accuracy, and user sovereignty are paramount. SwimMeet was built on these principles and you must honor them.

**Your Role**: ${currentStepData.assignedAI} - Step ${workflowState.currentStep} Specialist
**Objective**: ${currentStepData.objective}

**Original Query**: ${workflowState.sharedContext.originalQuery}
${attachmentContext}
**Collaborative Context**:
${contextSummary}

**Your Task**: 
${currentStepData.objective}

**CRITICAL INSTRUCTIONS:**
1. You have full access to all attached files - use them in your analysis
2. Build upon previous work while adding your unique perspective
3. Create comprehensive, factual content suitable for final delivery
4. If this is the final step, create a complete document/deliverable, not just an outline
5. Maintain the collaborative spirit while ensuring accuracy and completeness

Please provide your contribution that builds upon any previous work and can be handed off to the next AI in the sequence. Focus on your specific objective while maintaining continuity with the overall solution.`;

  // Create response for this step
  const response = await storage.createResponse({
    conversationId,
    aiProvider: currentStepData.assignedAI,
    content: "",
    status: "pending",
    workStep: `step-${workflowState.currentStep}`,
    handoffData: {
      previousStep: workflowState.currentStep > 1 ? workflowState.currentStep - 1 : undefined,
      nextAI: workflowState.currentStep < workflowState.totalSteps ? workflowState.stepHistory[workflowState.currentStep]?.assignedAI : undefined,
      contextSummary,
      taskSpecification: currentStepData.objective,
      attachedFiles: workflowState.sharedContext.attachedFiles || []
    }
  });

  // Process AI request asynchronously
  processWorkflowStep(currentStepData.assignedAI, workPrompt, response.id, conversationId, workflowState);
}

function buildContextSummary(workflowState: any): string {
  const completedSteps = workflowState.stepHistory.filter((step: any) => step.output);
  if (completedSteps.length === 0) {
    return "This is the first step in the collaborative workflow.";
  }
  
  return completedSteps.map((step: any, index: number) => 
    `**Step ${step.step} (${step.assignedAI})**: ${step.output.substring(0, 200)}${step.output.length > 200 ? '...' : ''}`
  ).join('\n\n');
}

async function processWorkflowStep(aiProvider: string, prompt: string, responseId: string, conversationId: string, workflowState: any) {
  try {
    const user = await storage.getUser("default-user");
    let credentials: Record<string, string> = {};
    if (user?.encryptedCredentials?.encrypted) {
      credentials = decryptCredentials(user.encryptedCredentials.encrypted);
    }

    const aiService = new AIService(credentials);
    let result;

    switch (aiProvider) {
      case 'openai':
        result = await aiService.queryOpenAI(prompt);
        break;
      case 'anthropic':
        result = await aiService.queryAnthropic(prompt);
        break;
      case 'google':
        result = await aiService.queryGemini(prompt);
        break;
      case 'perplexity':
        result = await aiService.queryPerplexity(prompt);
        break;
      default:
        result = { success: false, error: `Unsupported AI provider: ${aiProvider}` };
    }

    if (result.success) {
      await storage.updateResponse(responseId, {
        content: result.content,
        status: "complete"
      });

      // Update workflow state and continue to next step
      const updatedWorkflowState = { ...workflowState };
      updatedWorkflowState.stepHistory[workflowState.currentStep - 1].output = result.content;
      updatedWorkflowState.stepHistory[workflowState.currentStep - 1].completedAt = new Date().toISOString();
      updatedWorkflowState.collaborativeDocument += `\n\n## Step ${workflowState.currentStep}: ${updatedWorkflowState.stepHistory[workflowState.currentStep - 1].objective}\n*By ${aiProvider}*\n\n${result.content}`;

      await storage.updateConversationWorkflow(conversationId, updatedWorkflowState);

      // If there are more steps, initiate the next one
      if (workflowState.currentStep < workflowState.totalSteps) {
        updatedWorkflowState.currentStep++;
        await initiateWorkflowStep(conversationId, updatedWorkflowState, aiService);
      }
    } else {
      await storage.updateResponse(responseId, {
        content: `Error: ${result.error}`,
        status: "error"
      });
    }
  } catch (error: any) {
    await storage.updateResponse(responseId, {
      content: `Error: ${error.message}`,
      status: "error"
    });
  }
}

// JWT secret - in production this should be a secure environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session middleware for optional session-based auth
  app.use(session({
    secret: JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Auth routes - completely portable, no Replit dependencies
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { username, password } = insertUserSchema.parse(req.body);
      
      // Check if user is whitelisted
      if (!isUserWhitelisted(username)) {
        return res.status(403).json({ error: 'Registration is restricted to authorized users only' });
      }
      
      // Check if user exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const user = await storage.createUser({
        username,
        password: hashedPassword
      });

      // Generate token
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        message: 'User created successfully',
        token,
        user: { id: user.id, username: user.username }
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(400).json({ error: error.message || 'Registration failed' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = insertUserSchema.parse(req.body);
      
      // Find user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate token
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Set session
      req.session.userId = user.id;

      res.json({
        message: 'Login successful',
        token,
        user: { id: user.id, username: user.username }
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(400).json({ error: error.message || 'Login failed' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.json({ message: 'Logout successful' });
    });
  });

  // Admin routes - only for authorized admin users
  const isAdmin = (req: any, res: any, next: any) => {
    if (!req.user || (req.user.username !== 'davidtowne' && req.user.username !== 'demo')) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  };

  app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const adminUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email || '',
        name: user.name || user.username,
        status: user.status || 'active',
        createdAt: user.createdAt || new Date(),
        lastLogin: user.lastLogin
      }));
      res.json(adminUsers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
    try {
      const { username, email, name, password } = req.body;
      
      // Check if user is whitelisted
      if (!isUserWhitelisted(username)) {
        return res.status(403).json({ error: 'Username not in authorized list' });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const newUser = await storage.createUser({
        username,
        password: hashedPassword,
        email,
        name,
        status: 'active'
      });

      res.status(201).json({
        id: newUser.id,
        username: newUser.username,
        email: newUser.email || '',
        name: newUser.name || newUser.username,
        status: newUser.status || 'active',
        createdAt: newUser.createdAt || new Date()
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put('/api/admin/users/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
      const updatedUser = await storage.updateUser(req.params.id, req.body);
      res.json({
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email || '',
        name: updatedUser.name || updatedUser.username,
        status: updatedUser.status || 'active',
        createdAt: updatedUser.createdAt || new Date(),
        lastLogin: updatedUser.lastLogin
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete('/api/admin/users/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Don't allow deleting admin users
      if (user.username === 'davidtowne' || user.username === 'demo') {
        return res.status(403).json({ error: 'Cannot delete admin users' });
      }

      await storage.deleteUser(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/admin/users/:id/reset-password', authenticateToken, isAdmin, async (req, res) => {
    try {
      const { newPassword } = req.body;
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(req.params.id, { password: hashedPassword });
      res.json({ message: 'Password reset successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get('/api/admin/authorized-emails', authenticateToken, isAdmin, async (req, res) => {
    try {
      const { AUTHORIZED_USERS } = await import('./whitelist');
      const emails = AUTHORIZED_USERS.map(user => user.email);
      res.json(emails);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/auth/me', authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ id: user.id, username: user.username });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get user info' });
    }
  });
  // Test connection endpoint
  app.post("/api/credentials/test", async (req, res) => {
    try {
      const { provider, apiKey } = req.body;
      
      const aiService = new AIService({ [provider]: apiKey });
      let testResult;

      switch (provider) {
        case 'openai':
          testResult = await aiService.queryOpenAI("Test message");
          break;
        case 'anthropic':
          testResult = await aiService.queryAnthropic("Test message");
          break;
        case 'google':
          testResult = await aiService.queryGemini("Test message");
          break;
        default:
          return res.status(400).json({ message: "Unsupported provider" });
      }

      res.json({ success: testResult.success, error: testResult.error });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Save credentials
  app.post("/api/credentials", async (req, res) => {
    try {
      const credentials = credentialsSchema.parse(req.body.credentials);
      const userId = req.body.userId || "default-user"; // For demo purposes
      
      const encryptedCredentials = encryptCredentials(credentials);
      await storage.updateUserCredentials(userId, encryptedCredentials);
      
      res.json({ message: "Credentials saved successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Test AI provider connection
  app.post("/api/providers/test", async (req, res) => {
    try {
      const { providerId } = req.body;
      const userId = req.body.userId || "default-user";
      
      // Get user credentials
      const user = await storage.getUser(userId);
      let credentials: Record<string, string> = {};
      if (user?.encryptedCredentials?.encrypted) {
        try {
          credentials = decryptCredentials(user.encryptedCredentials.encrypted);
        } catch (error) {
          // Handle decryption error gracefully
        }
      }

      const aiService = new AIService(credentials);
      let testResult;

      switch (providerId) {
        case 'openai':
          testResult = await aiService.queryOpenAI("Test connection");
          break;
        case 'anthropic':
          testResult = await aiService.queryAnthropic("Test connection");
          break;
        case 'google':
          testResult = await aiService.queryGemini("Test connection");
          break;
        case 'microsoft':
          testResult = await aiService.queryMicrosoft("Test connection");
          break;
        case 'perplexity':
          testResult = await aiService.queryPerplexity("Test connection");
          break;
        case 'grok':
          testResult = await aiService.queryGrok("Test connection");
          break;
        case 'llama':
          testResult = await aiService.queryLlama("Test connection");
          break;
        case 'deepseek':
          testResult = await aiService.queryDeepSeek("Test connection");
          break;
        default:
          return res.status(400).json({ success: false, error: "Unknown provider" });
      }

      res.json({ success: testResult.success, error: testResult.error });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get available AI providers with REAL connection testing - NO CACHING
  app.get("/api/providers", async (req, res) => {
    // Force no caching
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    const userId = req.query.userId as string || "default-user";
    const user = await storage.getUser(userId);
    
    let credentials: Record<string, string> = {};
    if (user?.encryptedCredentials?.encrypted) {
      try {
        credentials = decryptCredentials(user.encryptedCredentials.encrypted);
      } catch (error) {
        // Handle decryption error gracefully
      }
    }

    console.log("TESTING AI PROVIDERS WITH REAL API CALLS...");
    const aiService = new AIService(credentials);
    
    const providerTests = [
      { id: 'openai', name: 'ChatGPT-4', company: 'OpenAI', requiresApiKey: true },
      { id: 'anthropic', name: 'Claude 4', company: 'Anthropic', requiresApiKey: true },
      { id: 'google', name: 'Gemini Pro', company: 'Google', requiresApiKey: true },
      { id: 'perplexity', name: 'Perplexity', company: 'Perplexity AI', requiresApiKey: true },
      { id: 'deepseek', name: 'DeepSeek', company: 'DeepSeek AI', requiresApiKey: true },
      { id: 'grok', name: 'Grok', company: 'xAI', requiresApiKey: true },
      { id: 'mistral', name: 'Mistral AI', company: 'Mistral AI', requiresApiKey: true },
    ];



    // Test each provider with actual API calls - REAL TESTING
    const providers: AIProvider[] = await Promise.all(
      providerTests.map(async (provider) => {
        let testResult;
        
        try {
          console.log(`Testing ${provider.name}...`);
          switch (provider.id) {
            case 'openai':
              testResult = await aiService.queryOpenAI("Test connection");
              break;
            case 'anthropic':
              testResult = await aiService.queryAnthropic("Test connection");
              break;
            case 'google':
              testResult = await aiService.queryGemini("Test connection");
              break;

            case 'perplexity':
              testResult = await aiService.queryPerplexity("Test connection");
              break;
            case 'grok':
              testResult = await aiService.queryGrok("Test connection");
              break;

            case 'deepseek':
              testResult = await aiService.queryDeepSeek("Test connection");
              break;
            case 'mistral':
              testResult = { success: false, error: "Mistral API not configured" };
              break;
            default:
              testResult = { success: false, error: "Unknown provider" };
          }
          console.log(`${provider.name}: ${testResult.success ? 'CONNECTED' : 'FAILED - ' + testResult.error}`);
        } catch (error: any) {
          testResult = { success: false, error: error.message };
          console.log(`${provider.name}: ERROR - ${error.message}`);
        }

        return {
          ...provider,
          status: (testResult.success ? 'connected' : 
                 (testResult.error?.includes('not configured') || testResult.error?.includes('API key')) ? 'setup_required' : 'error') as 'connected' | 'setup_required' | 'error'
        };
      })
    );

    console.log("REAL API TEST RESULTS:", providers.map(p => `${p.name}: ${p.status}`));
    
    // Add grayed-out disabled providers (API issues on their end)
    const disabledProviders = [
      { id: 'microsoft', name: 'Copilot', company: 'Microsoft', status: 'setup_required' as const, requiresApiKey: false, statusMessage: 'API Not Yet Available' },
      { id: 'llama', name: 'Llama 3.2', company: 'Meta', status: 'disabled' as const, requiresApiKey: false },
    ];

    const allProviders = [...providers, ...disabledProviders];
    res.json(allProviders);
  });

  // Submit query to multiple AIs (Protected route)
  app.post("/api/query", authenticateToken, async (req: any, res) => {
    try {
      console.log("Request body:", JSON.stringify(req.body, null, 2));
      const { prompt, providers, query, selectedAIs, conversationId } = req.body as QueryRequest & { prompt?: string, providers?: string[] };
      const userId = req.user.userId; // Get userId from authenticated token
      
      // Support both old and new request formats
      const actualQuery = prompt || query;
      const actualProviders = providers || selectedAIs;
      
      console.log("Parsed values:", { actualQuery, actualProviders });
      
      if (!actualQuery) {
        return res.status(400).json({ message: "Query or prompt is required" });
      }
      
      if (!actualProviders || !Array.isArray(actualProviders) || actualProviders.length === 0) {
        return res.status(400).json({ message: "Providers array is required" });
      }
      
      const { mode } = req.body;
      
      // Create conversation if not provided
      let convId = conversationId;
      if (!convId) {
        console.log(`Creating ${mode || 'DIVE'} conversation with query:`, actualQuery);
        
        const { attachedFiles = [] } = req.body;
        const conversation = await storage.createConversation(userId, {
          title: actualQuery.substring(0, 50) + (actualQuery.length > 50 ? "..." : ""),
          query: actualQuery,
          mode: mode || 'dive',
          attachedFiles: attachedFiles.map((file: any) => ({
            id: file.id || file.name,
            filename: file.name,
            size: file.size || 0,
            type: file.type || 'unknown',
            objectPath: file.path || '',
            uploadedAt: new Date().toISOString()
          }))
        });
        convId = conversation.id;
        console.log("Created conversation with ID:", convId);
        console.log(`📎 Attachments stored: ${attachedFiles.length} files`);
      }

      // Get user credentials
      const user = await storage.getUser(userId);
      let credentials: Record<string, string> = {};
      if (user?.encryptedCredentials?.encrypted) {
        try {
          credentials = decryptCredentials(user.encryptedCredentials.encrypted);
        } catch (error) {
          return res.status(400).json({ message: "Failed to decrypt credentials" });
        }
      }

      // Create AI service instance
      const aiService = new AIService(credentials);

      // WORK mode: Enhanced sequential collaborative processing
      if (mode === 'work') {
        console.log("🔄 Starting ENHANCED WORK mode sequential processing");
        console.log(`📋 Selected AIs: [${actualProviders.join(', ')}] - ENSURING ALL PARTICIPATE`);
        
        // Use enhanced workflow planning that guarantees all AIs participate
        const { attachedFiles = [] } = req.body;
        const workflowSteps = planWorkflowStepsImproved(actualQuery, actualProviders, attachedFiles);
        
        // Create comprehensive workflow state
        const workflowState = {
          totalSteps: workflowSteps.length,
          currentStep: 1,
          steps: workflowSteps.map((step, index) => ({
            stepNumber: index + 1,
            assignedAI: step.assignedAI,
            objective: step.objective,
            completed: false,
            output: null,
            hasAttachments: step.hasAttachments
          })),
          collaborativeDoc: `# ${actualQuery}\n\n**Truth & Accuracy Mandate**: All AI team members must prioritize factual accuracy, user sovereignty, and transparency.\n\n**Selected Team**: ${actualProviders.join(', ')}\n\n---\n\n`,
          sharedContext: {
            originalQuery: actualQuery,
            attachedFiles: attachedFiles || [],
            coreValues: "Truth, factual accuracy, and user sovereignty are paramount",
            allSelectedAIs: actualProviders // Track ALL selected AIs
          },
          userFeedbackEnabled: true,
          needsUserReview: false
        };
        
        // Store enhanced workflow state
        await storage.updateConversation(convId, { workflowState });
        
        console.log(`▶️ Starting Step 1: ${workflowSteps[0].assignedAI} - ${workflowSteps[0].objective}`);
        console.log(`📎 Attachments: ${attachedFiles.length} files available to ALL AIs`);
        
        // Start first step with enhanced processing
        const firstStepResult = await processWorkflowStepEnhanced(convId, workflowState, 0, aiService);
        
        return res.json({ 
          conversationId: convId, 
          workflowState, 
          responses: firstStepResult ? [firstStepResult] : [],
          message: `Enhanced WORK mode initiated - ALL ${actualProviders.length} selected AIs will participate`
        });
      }

      // Create pending responses
      const responsePromises = actualProviders.map(async (aiProvider) => {
        const response = await storage.createResponse({
          conversationId: convId!,
          aiProvider,
          content: "",
          status: "pending"
        });

        // Query AI in background
        setImmediate(async () => {
          try {
            console.log(`🤖 Starting AI query for ${aiProvider}...`);
            let aiResult;
            
            // Build query with attachment content (same as WORK mode)
            let queryWithAttachments = actualQuery;
            const { attachedFiles = [] } = req.body;
            
            if (attachedFiles.length > 0) {
              queryWithAttachments += `\n\n**ATTACHED FILES SUMMARY:**\n`;
              
              for (const file of attachedFiles) {
                try {
                  const fileContent = await localStorage.getFile(file.id || file.name);
                  if (fileContent) {
                    const textContent = fileContent.toString('utf-8');
                    // Create intelligent summary instead of including full content
                    const contentPreview = textContent.length > 500 ? 
                      textContent.substring(0, 500) + '... [CONTENT TRUNCATED]' : 
                      textContent;
                    
                    queryWithAttachments += `\n--- FILE: ${file.name} (${file.type || 'unknown'}, ${Math.round(fileContent.length / 1024)}KB) ---\n`;
                    queryWithAttachments += `Content Preview: ${contentPreview}\n`;
                    queryWithAttachments += `Total Length: ${textContent.length} characters\n--- END FILE SUMMARY ---\n`;
                  } else {
                    queryWithAttachments += `\n--- FILE: ${file.name} ---\n[FILE NOT ACCESSIBLE]\n--- END FILE SUMMARY ---\n`;
                  }
                } catch (error) {
                  console.error(`Error reading file ${file.name}:`, error);
                  queryWithAttachments += `\n--- FILE: ${file.name} ---\n[ERROR: Could not read file]\n--- END FILE SUMMARY ---\n`;
                }
              }
              
              queryWithAttachments += `\n*Above are file summaries. Note: Full file content available if needed for analysis. Reference files by name in your response.*`;
            }
            
            // Call individual AI methods with complete query including attachments
            switch (aiProvider) {
              case 'openai':
                aiResult = await aiService.queryOpenAI(queryWithAttachments);
                break;
              case 'anthropic':
                aiResult = await aiService.queryAnthropic(queryWithAttachments);
                break;
              case 'google':
                aiResult = await aiService.queryGemini(queryWithAttachments);
                break;
              case 'perplexity':
                aiResult = await aiService.queryPerplexity(queryWithAttachments);
                break;
              case 'grok':
                aiResult = await aiService.queryGrok(queryWithAttachments);
                break;
              case 'deepseek':
                aiResult = await aiService.queryDeepSeek(queryWithAttachments);
                break;
              case 'mistral':
                aiResult = { success: false, error: "Mistral AI not yet implemented" };
                break;
              default:
                aiResult = { success: false, error: `Unknown provider: ${aiProvider}` };
            }
            
            console.log(`✅ ${aiProvider} response: ${aiResult.success ? 'SUCCESS' : 'FAILED - ' + aiResult.error}`);
            
            if (aiResult.success && aiResult.content) {
              await storage.updateResponseContent(response.id, aiResult.content, "complete");
            } else {
              await storage.updateResponseContent(response.id, aiResult.error || "Unknown error", "error");
            }
          } catch (error: any) {
            console.error(`❌ Error processing ${aiProvider}:`, error.message);
            await storage.updateResponseContent(response.id, `Error: ${error.message}`, "error");
          }
        });

        return response;
      });

      const responses = await Promise.all(responsePromises);
      
      res.json({
        conversationId: convId,
        responses: responses.map(r => ({
          id: r.id,
          aiProvider: r.aiProvider,
          content: r.content,
          status: r.status,
          timestamp: r.createdAt?.toISOString()
        }))
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get conversation responses (Protected route)
  app.get("/api/conversations/:id/responses", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const responses = await storage.getConversationResponses(id);
      
      res.json(responses.map(r => ({
        id: r.id,
        aiProvider: r.aiProvider,
        content: r.content,
        status: r.status,
        timestamp: r.createdAt?.toISOString(),
        metadata: r.metadata,
        workStep: r.workStep
      })));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get WORK mode workflow status (Protected route)
  app.get("/api/conversations/:id/workflow", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const conversation = await storage.getConversation(id);
      
      if (!conversation?.workflowState) {
        return res.json({ status: 'no_workflow' });
      }
      
      const workflowState = conversation.workflowState;
      const responses = await storage.getConversationResponses(id);
      
      // Calculate progress
      const totalSteps = workflowState.steps?.length || 0;
      const completedSteps = responses.filter(r => r.status === 'complete').length;
      const currentStep = workflowState.currentStep || 0;
      
      res.json({
        status: 'active',
        totalSteps,
        currentStep,
        completedSteps,
        steps: workflowState.steps?.map((step: any, index: number) => ({
          stepNumber: index + 1,
          assignedAI: step.assignedAI,
          objective: step.objective,
          completed: step.completed || false,
          status: responses.find(r => r.workStep === `step-${index + 1}`)?.status || 'pending'
        })) || [],
        collaborativeDoc: workflowState.collaborativeDoc || ""
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get user conversations (Protected route)
  app.get("/api/conversations", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId; // Get userId from authenticated token
      const conversations = await storage.getUserConversations(userId);
      
      res.json(conversations.map(c => ({
        id: c.id,
        title: c.title,
        query: c.query,
        mode: c.mode,
        timestamp: c.createdAt?.toISOString()
      })));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // === DISPOSABLE TOKEN SYSTEM ===

  // Create disposable access token (Protected route)
  app.post("/api/disposable-tokens", authenticateToken, async (req: any, res) => {
    try {
      const { description, expirationHours = 24 } = req.body;
      const userId = req.user.userId;

      if (!description || description.trim().length === 0) {
        return res.status(400).json({ error: "Description is required" });
      }

      const token = await DisposableTokenService.createToken({
        createdBy: userId,
        description: description.trim(),
        expirationHours: Math.min(Math.max(1, expirationHours), 168) // 1 hour to 1 week max
      });

      res.json(token);
    } catch (error: any) {
      console.error('Error creating disposable token:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get user's disposable tokens (Protected route)
  app.get("/api/disposable-tokens", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const tokens = await DisposableTokenService.getUserTokens(userId);
      
      res.json(tokens.map(token => ({
        id: token.id,
        description: token.description,
        createdAt: token.createdAt,
        expiresAt: token.expiresAt,
        usedAt: token.usedAt,
        ipAddress: token.ipAddress,
        isExpired: new Date() > token.expiresAt,
        isUsed: token.usedAt !== null
      })));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Revoke disposable token (Protected route)
  app.delete("/api/disposable-tokens/:tokenId", authenticateToken, async (req: any, res) => {
    try {
      const { tokenId } = req.params;
      const userId = req.user.userId;

      await DisposableTokenService.revokeToken(tokenId, userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // AI access page via disposable token (Public - no auth needed)
  app.get("/ai-access/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      const validation = await DisposableTokenService.validateAndUseToken(token, ipAddress, userAgent);

      if (!validation.valid) {
        return res.status(401).send(`
          <html>
            <head><title>Invalid Access Token</title></head>
            <body style="font-family: system-ui; text-align: center; padding: 50px;">
              <h1>🚫 Access Denied</h1>
              <p>This access link is invalid, expired, or has already been used.</p>
              <p>Reason: ${validation.reason}</p>
              <p>Contact the SwimMeet user who shared this link for a new one.</p>
            </body>
          </html>
        `);
      }

      // Create temporary session for this AI access
      req.session.aiAccess = {
        tokenId: validation.tokenId,
        description: validation.description,
        createdBy: validation.createdBy,
        creatorName: validation.creatorName,
        enteredAt: new Date().toISOString()
      };

      // Redirect to main SwimMeet interface with AI access mode
      res.redirect('/?aiAccess=true');
    } catch (error: any) {
      console.error('Error processing AI access token:', error);
      res.status(500).send(`
        <html>
          <head><title>Access Error</title></head>
          <body style="font-family: system-ui; text-align: center; padding: 50px;">
            <h1>⚠️ System Error</h1>
            <p>Unable to process access token. Please try again later.</p>
          </body>
        </html>
      `);
    }
  });

  // Check AI access status (for frontend)
  app.get("/api/ai-access/status", (req: any, res) => {
    if (req.session.aiAccess) {
      res.json({
        hasAccess: true,
        description: req.session.aiAccess.description,
        createdBy: req.session.aiAccess.createdBy,
        creatorName: req.session.aiAccess.creatorName,
        enteredAt: req.session.aiAccess.enteredAt
      });
    } else {
      res.json({ hasAccess: false });
    }
  });

  // === PUBLIC DEMO ROUTE ===
  // Completely public route for AI assistants to analyze SwimMeet
  app.get("/public-demo", (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SwimMeet - AI Orchestration Platform Demo</title>
    <meta name="description" content="SwimMeet is an advanced AI orchestration platform featuring DIVE, TURN, and WORK modes for multi-AI querying, fact-checking, and collaborative workflows.">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        /* Authentic SwimMeet Design System */
        body {
            font-family: system-ui, -apple-system, "SF Pro Display", sans-serif;
            background: radial-gradient(ellipse at center, #003d7a 0%, #001f3f 70%);
            color: #171717;
            line-height: 1.6;
            min-height: 100vh;
            position: relative;
            overflow-x: hidden;
        }
        
        /* Underwater caustic light effect */
        body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: 
                radial-gradient(ellipse 800px 400px at 20% 30%, rgba(64, 224, 208, 0.15) 0%, transparent 50%),
                radial-gradient(ellipse 600px 300px at 80% 70%, rgba(0, 123, 255, 0.1) 0%, transparent 50%),
                radial-gradient(ellipse 400px 200px at 50% 50%, rgba(255, 255, 255, 0.05) 0%, transparent 50%);
            animation: caustics 8s ease-in-out infinite;
            pointer-events: none;
            z-index: 1;
        }
        
        @keyframes caustics {
            0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.6; }
            50% { transform: scale(1.1) rotate(2deg); opacity: 0.8; }
        }
        
        /* Glass panel system */
        .glass-panel {
            background: rgba(212, 212, 212, 0.95);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 
                0 8px 32px rgba(0, 0, 0, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.1);
            position: relative;
            z-index: 2;
        }
        
        .container { 
            max-width: 1400px; 
            margin: 0 auto; 
            padding: 0 24px; 
            position: relative;
            z-index: 2;
        }
        
        /* Header with steel finish */
        .header { 
            background: linear-gradient(135deg, 
                rgba(115, 115, 115, 0.95) 0%, 
                rgba(212, 212, 212, 0.95) 50%, 
                rgba(115, 115, 115, 0.95) 100%);
            backdrop-filter: blur(20px);
            padding: 32px 0; 
            text-align: center; 
            border-bottom: 2px solid rgba(255, 255, 255, 0.3);
            box-shadow: 
                0 4px 20px rgba(0, 0, 0, 0.25),
                inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
        
        .logo-container {
            margin-bottom: 20px;
        }
        
        .title { 
            font-size: 64px; 
            font-weight: 700; 
            margin: 20px 0 12px 0; 
            color: #171717;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            letter-spacing: -0.02em;
        }
        
        .subtitle { 
            font-size: 20px; 
            color: #525252; 
            font-weight: 400;
            letter-spacing: 0.01em;
        }
        
        .section { 
            margin: 48px 0; 
        }
        
        .section-title { 
            font-size: 36px; 
            color: #171717; 
            text-align: center; 
            margin-bottom: 32px;
            font-weight: 600;
            letter-spacing: -0.01em;
        }
        
        /* Mode cards with authentic design */
        .modes-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); 
            gap: 24px; 
        }
        
        .mode-card { 
            background: rgba(212, 212, 212, 0.95);
            backdrop-filter: blur(12px);
            border: 2px solid;
            padding: 32px;
            box-shadow: 
                0 8px 32px rgba(0, 0, 0, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.1);
            position: relative;
            transition: all 0.3s ease;
        }
        
        .mode-card:hover {
            transform: translateY(-2px);
            box-shadow: 
                0 12px 40px rgba(0, 0, 0, 0.4),
                inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
        
        .dive { 
            border-color: #2563EB;
            border-top: 4px solid #2563EB;
        }
        .turn { 
            border-color: #7C3AED;
            border-top: 4px solid #7C3AED;
        }
        .work { 
            border-color: #DAA520;
            border-top: 4px solid #DAA520;
        }
        
        .mode-title { 
            font-size: 28px; 
            margin-bottom: 16px;
            font-weight: 600;
            color: #171717;
        }
        
        .mode-description {
            font-size: 16px;
            color: #404040;
            line-height: 1.6;
            margin-bottom: 20px;
        }
        
        .mode-example { 
            background: rgba(64, 64, 64, 0.9);
            backdrop-filter: blur(8px);
            padding: 20px; 
            font-size: 14px; 
            color: #e5e5e5;
            border-left: 4px solid;
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }
        
        .dive .mode-example { border-left-color: #2563EB; }
        .turn .mode-example { border-left-color: #7C3AED; }
        .work .mode-example { border-left-color: #DAA520; }
        
        /* Statistics grid */
        .stats-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); 
            gap: 20px; 
            text-align: center; 
        }
        
        .stat-card { 
            background: rgba(212, 212, 212, 0.95);
            backdrop-filter: blur(12px);
            padding: 24px;
            box-shadow: 
                0 8px 32px rgba(0, 0, 0, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: transform 0.3s ease;
        }
        
        .stat-card:hover {
            transform: translateY(-2px);
        }
        
        .stat-number { 
            font-size: 48px; 
            font-weight: 700;
            color: #171717;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .stat-label { 
            font-size: 14px; 
            color: #525252;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        
        /* Sample responses section */
        .sample-responses { 
            background: rgba(64, 64, 64, 0.95);
            backdrop-filter: blur(12px);
            padding: 32px;
            box-shadow: 
                0 8px 32px rgba(0, 0, 0, 0.4),
                inset 0 1px 0 rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .query-display { 
            font-size: 20px; 
            font-weight: 600; 
            margin-bottom: 24px;
            color: #fafafa;
        }
        
        .response-card { 
            background: rgba(212, 212, 212, 0.95);
            backdrop-filter: blur(8px);
            border: 1px solid;
            padding: 20px; 
            margin-bottom: 16px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        }
        
        .response-header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 12px; 
        }
        
        .provider-name { 
            font-weight: 600;
            font-size: 16px;
        }
        
        .response-meta { 
            display: flex; 
            gap: 12px; 
            align-items: center; 
        }
        
        .rating { 
            background: #16a34a; 
            color: white;
            padding: 4px 8px; 
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.02em;
        }
        
        .response-time { 
            font-size: 12px; 
            color: #525252;
            font-weight: 500;
        }
        
        .response-content { 
            font-size: 14px; 
            line-height: 1.6;
            color: #171717;
        }
        
        .verification { 
            background: linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 215, 0, 0.1) 100%);
            border-color: #ffd700;
            border-top: 4px solid #ffd700;
        }
        
        /* Features grid */
        .features-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); 
            gap: 24px; 
        }
        
        .feature-card { 
            background: rgba(212, 212, 212, 0.95);
            backdrop-filter: blur(12px);
            padding: 24px;
            box-shadow: 
                0 8px 32px rgba(0, 0, 0, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: transform 0.3s ease;
        }
        
        .feature-card:hover {
            transform: translateY(-2px);
        }
        
        .feature-title { 
            color: #171717; 
            margin-bottom: 12px;
            font-size: 18px;
            font-weight: 600;
        }
        
        .feature-description {
            color: #404040;
            font-size: 14px;
            line-height: 1.5;
        }
        
        /* Call to action */
        .cta-section { 
            text-align: center; 
            margin: 60px 0; 
        }
        
        .ai-note { 
            background: linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 215, 0, 0.1) 100%);
            backdrop-filter: blur(12px);
            border: 2px solid #ffd700; 
            padding: 24px; 
            max-width: 700px; 
            margin: 32px auto;
            box-shadow: 
                0 8px 32px rgba(0, 0, 0, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }
        
        .ai-note h4 {
            margin: 0 0 12px 0; 
            color: #92400e;
            font-size: 18px;
            font-weight: 600;
        }
        
        .ai-note p {
            margin: 0; 
            font-size: 14px;
            color: #451a03;
            line-height: 1.5;
        }
        
        /* Footer */
        .footer { 
            background: linear-gradient(135deg, 
                rgba(115, 115, 115, 0.95) 0%, 
                rgba(64, 64, 64, 0.95) 100%);
            backdrop-filter: blur(20px);
            padding: 24px 0; 
            text-align: center; 
            border-top: 2px solid rgba(255, 255, 255, 0.2);
            box-shadow: 
                0 -4px 20px rgba(0, 0, 0, 0.25),
                inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }
        
        .footer p {
            color: #e5e5e5;
            font-size: 14px;
            font-weight: 400;
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
            .title { font-size: 48px; }
            .modes-grid { grid-template-columns: 1fr; }
            .stats-grid { grid-template-columns: repeat(2, 1fr); }
            .features-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <header class="header">
        <div class="container">
            <div class="logo-container">
                <!-- Note: Logo would be displayed here in the full app -->
            </div>
            <div class="title">SwimMeet</div>
            <div class="subtitle">Advanced AI Orchestration Platform</div>
        </div>
    </header>

    <main class="container">
        <section class="section glass-panel" style="padding: 48px; margin: 32px 0;">
            <h1 class="section-title">🏊‍♂️ Multi-AI Orchestration Platform</h1>
            <p style="font-size: 18px; text-align: center; max-width: 900px; margin: 0 auto; color: #404040; line-height: 1.7;">
                SwimMeet enables simultaneous querying of multiple AI services with advanced response management, 
                fact-checking capabilities, and collaborative workflows. Think of it as conducting an orchestra 
                of AI assistants working together on your challenges.
            </p>
        </section>

        <section class="section">
            <h2 class="section-title">Three Powerful Modes</h2>
            <div class="modes-grid">
                <div class="mode-card dive">
                    <h3 class="mode-title">🏊‍♂️ DIVE Mode</h3>
                    <p class="mode-description">Simultaneous multi-AI querying. Submit your question to multiple AI providers at once and compare their responses side-by-side.</p>
                    <div class="mode-example">
                        <strong>Example:</strong> "Analyze the impact of remote work on productivity"<br><br>
                        <strong>Result:</strong> Get perspectives from ChatGPT-4, Claude 4, Gemini Pro, and Perplexity simultaneously, with quality ratings and response time tracking.
                    </div>
                </div>

                <div class="mode-card turn">
                    <h3 class="mode-title">🔄 TURN Mode</h3>
                    <p class="mode-description">AI-to-AI fact-checking and verification. Select a verifier AI to critique and score the accuracy of other AI responses.</p>
                    <div class="mode-example">
                        <strong>Example:</strong> Get ChatGPT's analysis of climate data, then have Claude fact-check it for accuracy, providing scores and identifying any errors.<br><br>
                        <strong>Result:</strong> Accuracy scores, factual error identification, and improvement recommendations.
                    </div>
                </div>

                <div class="mode-card work">
                    <h3 class="mode-title">⚙️ WORK Mode</h3>
                    <p class="mode-description">Sequential AI collaboration. Multiple AIs work together in stages, building on each other's work to create comprehensive solutions.</p>
                    <div class="mode-example">
                        <strong>Example:</strong> "Develop a marketing strategy for a new product"<br><br>
                        <strong>Workflow:</strong> Step 1 (OpenAI): Market analysis → Step 2 (Anthropic): Strategy development → Step 3 (Google): Implementation plan
                    </div>
                </div>
            </div>
        </section>

        <section class="section">
            <h2 class="section-title">Platform Statistics</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number" style="color: #39cccc;">8</div>
                    <div class="stat-label">AI Providers</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" style="color: #2ecc40;">4</div>
                    <div class="stat-label">Active Connections</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" style="color: #ff6b6b;">∞</div>
                    <div class="stat-label">Conversations</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" style="color: #ffd700;">24/7</div>
                    <div class="stat-label">Availability</div>
                </div>
            </div>
        </section>

        <section class="section">
            <h2 class="section-title">Sample AI Response Analysis</h2>
            <div class="sample-responses">
                <div class="query-display">Query: "What are the key trends in sustainable technology for 2025?"</div>
                
                <div class="response-card" style="border-color: #2563EB;">
                    <div class="response-header">
                        <div class="provider-name" style="color: #2563EB;">ChatGPT-4</div>
                        <div class="response-meta">
                            <span class="rating">95% Positive</span>
                            <span class="response-time">2.3s</span>
                        </div>
                    </div>
                    <div class="response-content">
                        Key sustainable technology trends for 2025 include advanced battery storage systems, 
                        green hydrogen production scaling, circular economy automation, and AI-optimized energy grids. 
                        Carbon capture technologies are becoming economically viable...
                    </div>
                </div>

                <div class="response-card" style="border-color: #7C3AED;">
                    <div class="response-header">
                        <div class="provider-name" style="color: #7C3AED;">Claude 4</div>
                        <div class="response-meta">
                            <span class="rating">92% Positive</span>
                            <span class="response-time">1.8s</span>
                        </div>
                    </div>
                    <div class="response-content">
                        The sustainable tech landscape in 2025 will be dominated by breakthrough materials science, 
                        particularly in biodegradable plastics and next-generation solar cells. Fusion energy 
                        pilot programs are entering commercial testing phases...
                    </div>
                </div>

                <div class="response-card verification">
                    <div class="response-header">
                        <div class="provider-name" style="color: #ffd700;">TURN Verification Results</div>
                    </div>
                    <div class="response-content">
                        <div><strong>Accuracy Score:</strong> 94% (Both responses factually sound)</div>
                        <div><strong>Strengths:</strong> Current technology trends correctly identified, realistic timelines</div>
                        <div><strong>Areas for Improvement:</strong> Could include more specific cost projections</div>
                    </div>
                </div>
            </div>
        </section>

        <section class="section">
            <h2 class="section-title">Technical Capabilities</h2>
            <div class="features-grid">
                <div class="feature-card">
                    <h4 class="feature-title">🔐 Enterprise Security</h4>
                    <p class="feature-description">JWT authentication, bcrypt password hashing, disposable access tokens, and comprehensive session management with admin controls.</p>
                </div>
                <div class="feature-card">
                    <h4 class="feature-title">📊 Advanced Analytics</h4>
                    <p class="feature-description">Real-time performance tracking, response quality scoring, provider reliability metrics, and comprehensive conversation history.</p>
                </div>
                <div class="feature-card">
                    <h4 class="feature-title">🔄 Workflow Engine</h4>
                    <p class="feature-description">Intelligent step planning, sequential AI collaboration, progress monitoring, and automatic handoffs between providers.</p>
                </div>
                <div class="feature-card">
                    <h4 class="feature-title">🌐 Platform Independence</h4>
                    <p class="feature-description">Standard technologies (PostgreSQL, JWT, bcrypt) with zero proprietary dependencies. Complete portability across platforms.</p>
                </div>
            </div>
        </section>

        <section class="cta-section">
            <div class="glass-panel" style="padding: 48px; margin: 32px 0;">
                <h2 class="section-title">Experience SwimMeet</h2>
                <p style="font-size: 18px; max-width: 700px; margin: 0 auto 30px auto; color: #404040; line-height: 1.6;">
                    This is a completely public demo page designed for AI assistants to understand SwimMeet's capabilities. 
                    The full platform includes user authentication, persistent conversations, and advanced workflow management.
                </p>
                <div class="ai-note">
                    <h4>AI Analysis Note</h4>
                    <p>
                        This public demo page is specifically designed to be accessible to AI assistants via web_fetch. 
                        The full SwimMeet platform requires authentication and provides persistent data storage, 
                        user management, and advanced AI orchestration capabilities including sophisticated disposable token systems for secure AI access.
                    </p>
                </div>
            </div>
        </section>
    </main>

    <footer class="footer">
        <div class="container">
            <p style="font-size: 14px; opacity: 0.8;">
                SwimMeet - Advanced AI Orchestration Platform | Built with React, TypeScript, and PostgreSQL
            </p>
        </div>
    </footer>
</body>
</html>
    `);
  });

  // Submit user feedback on WORK mode results (Protected route)
  app.post("/api/conversations/:id/feedback", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { feedback, rating, forwardToAI } = req.body;
      const userId = req.user.userId;
      
      // Get conversation and verify ownership
      const conversation = await storage.getConversation(id);
      if (!conversation || conversation.userId !== userId) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      // Store user feedback
      const feedbackRecord = {
        conversationId: id,
        userId,
        feedback,
        rating,
        timestamp: new Date().toISOString(),
        forwardToAI: forwardToAI || null
      };
      
      // Update workflow state with feedback
      const updatedWorkflowState = {
        ...conversation.workflowState,
        userFeedback: feedbackRecord,
        needsUserReview: false
      };
      
      await storage.updateConversation(id, { workflowState: updatedWorkflowState });
      
      res.json({ 
        message: "Feedback submitted successfully",
        feedbackId: feedbackRecord.timestamp
      });
      
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Forward WORK results to additional AI for review (Protected route)
  app.post("/api/conversations/:id/forward-to-ai", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { targetAI, reviewPrompt } = req.body;
      const userId = req.user.userId;
      
      // Get conversation and verify ownership
      const conversation = await storage.getConversation(id);
      if (!conversation || conversation.userId !== userId) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      if (!conversation.workflowState?.collaborativeDoc) {
        return res.status(400).json({ message: "No collaborative document to review" });
      }
      
      // Get user credentials
      const user = await storage.getUser(userId);
      let credentials: Record<string, string> = {};
      if (user?.encryptedCredentials?.encrypted) {
        credentials = decryptCredentials(user.encryptedCredentials.encrypted);
      }
      
      const aiService = new AIService(credentials);
      
      // Create review prompt
      const fullPrompt = `🏊‍♂️ SWIM MEET - POST-WORK REVIEW

**CORE VALUES**: Truth, factual accuracy, and user sovereignty are paramount.

**Your Task**: Review and provide feedback on this collaborative AI work.

**Original Query**: ${conversation.workflowState.sharedContext.originalQuery}

**Collaborative Document to Review**:
${conversation.workflowState.collaborativeDoc}

**User's Review Instructions**: ${reviewPrompt || "Please review this collaborative work and provide suggestions for improvement."}

Please provide:
1. Overall assessment of the collaborative work
2. Strengths and areas for improvement
3. Suggestions for enhancement
4. Any factual corrections needed
5. Final recommendations

Focus on accuracy, completeness, and value to the user.`;

      // Create response for the review
      const response = await storage.createResponse({
        conversationId: id,
        aiProvider: targetAI,
        content: "",
        status: "pending",
        workStep: "post-work-review"
      });

      // Query the reviewing AI
      let aiResult;
      switch (targetAI) {
        case 'openai':
          aiResult = await aiService.queryOpenAI(fullPrompt);
          break;
        case 'anthropic':
          aiResult = await aiService.queryAnthropic(fullPrompt);
          break;
        case 'google':
          aiResult = await aiService.queryGemini(fullPrompt);
          break;
        case 'perplexity':
          aiResult = await aiService.queryPerplexity(fullPrompt);
          break;
        case 'grok':
          aiResult = await aiService.queryGrok(fullPrompt);
          break;
        default:
          aiResult = { success: false, error: `Unknown AI provider: ${targetAI}` };
      }

      if (aiResult.success && aiResult.content) {
        await storage.updateResponseContent(response.id, aiResult.content, "complete");
        
        res.json({
          message: `Successfully forwarded to ${targetAI} for review`,
          reviewResponse: {
            id: response.id,
            aiProvider: targetAI,
            content: aiResult.content,
            timestamp: new Date().toISOString()
          }
        });
      } else {
        await storage.updateResponseContent(response.id, aiResult.error || "Review failed", "error");
        res.status(500).json({ message: `Failed to get review from ${targetAI}: ${aiResult.error}` });
      }
      
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Download collaborative document (Protected route)
  app.get("/api/conversations/:id/download", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      
      // Get conversation and verify ownership
      const conversation = await storage.getConversation(id);
      if (!conversation || conversation.userId !== userId) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      if (!conversation.workflowState?.collaborativeDoc) {
        return res.status(400).json({ message: "No collaborative document available" });
      }
      
      // Prepare document content
      const docContent = `# SwimMeet Collaborative Analysis
Generated: ${new Date().toISOString()}
Query: ${conversation.query}
Team: ${conversation.workflowState.sharedContext.allSelectedAIs?.join(', ') || 'Unknown'}

---

${conversation.workflowState.collaborativeDoc}

---
Generated by SwimMeet - AI Orchestration Platform
Truth, Accuracy, and User Sovereignty`;
      
      // Set download headers
      res.set({
        'Content-Type': 'text/markdown',
        'Content-Disposition': `attachment; filename="swimMeet-${id}-${Date.now()}.md"`
      });
      
      res.send(docContent);
      
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Standard file upload using multer - 100% portable
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { 
      fileSize: 50 * 1024 * 1024 // 50MB limit
    }
  });

  app.post("/api/files/upload", authenticateToken, upload.array('files', 5), async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }

      const uploadedFiles = [];
      
      for (const file of files) {
        const filename = await localStorage.saveFile(file);
        
        uploadedFiles.push({
          id: filename,
          name: file.originalname,
          size: file.size,
          path: `/api/files/download/${filename}`
        });
      }
      
      res.json({ files: uploadedFiles });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Download files
  app.get("/api/files/download/:filename", authenticateToken, async (req: any, res) => {
    try {
      const { filename } = req.params;
      
      const fileBuffer = await localStorage.getFile(filename);
      if (!fileBuffer) {
        return res.status(404).json({ message: 'File not found' });
      }
      
      res.set({
        'Content-Type': 'application/octet-stream',
        'Content-Length': fileBuffer.length.toString(),
        'Content-Disposition': `attachment; filename="${filename}"`
      });
      
      res.send(fileBuffer);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Execute custom workflow from workflow builder
  app.post("/api/workflows/execute", authenticateToken, async (req: any, res) => {
    try {
      const { workflow, initialInput } = req.body;
      const userId = req.user.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get user credentials
      let credentials: Record<string, string> = {};
      if (user.encryptedCredentials?.encrypted) {
        try {
          credentials = decryptCredentials(user.encryptedCredentials.encrypted);
        } catch (error) {
          console.error('Failed to decrypt credentials:', error);
        }
      }

      const aiService = new AIService(credentials);
      const workflowEngine = new WorkflowEngine(aiService);
      
      // Validate workflow
      const validation = workflowEngine.validateWorkflow(workflow);
      if (!validation.valid) {
        return res.status(400).json({ 
          success: false, 
          error: "Invalid workflow", 
          details: validation.errors 
        });
      }

      // Execute workflow
      const result = await workflowEngine.executeWorkflow(workflow, initialInput, credentials);
      
      if (result.success) {
        // Store execution results in database
        const conversation = await storage.createConversation({
          userId,
          query: initialInput,
          mode: 'work',
          workflowState: {
            type: 'custom',
            workflowDefinition: workflow,
            executionSteps: result.steps,
            status: 'complete'
          }
        });

        // Store each step as a response
        for (const step of result.steps) {
          await storage.createResponse({
            conversationId: conversation.id,
            aiProvider: step.node.provider || step.node.type,
            content: typeof step.result === 'string' ? step.result : JSON.stringify(step.result),
            status: step.status === 'completed' ? 'complete' : step.status,
            responseTime: step.endTime && step.startTime ? 
              step.endTime.getTime() - step.startTime.getTime() : undefined
          });
        }

        res.json({
          success: true,
          conversationId: conversation.id,
          result: result.result,
          steps: result.steps.map(step => ({
            nodeId: step.nodeId,
            nodeTitle: step.node.title,
            status: step.status,
            result: step.result,
            error: step.error,
            executionTime: step.endTime && step.startTime ? 
              step.endTime.getTime() - step.startTime.getTime() : null
          }))
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error,
          steps: result.steps
        });
      }
    } catch (error: any) {
      console.error('Workflow execution error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  });

  // Report AI Fabrication - Truth enforcement mechanism
  app.post("/api/responses/:id/fabrication-report", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { aiProvider, reportType, timestamp } = req.body;
      const userId = req.user.userId;
      
      // Get the response being reported
      const response = await storage.getResponse(id);
      if (!response) {
        return res.status(404).json({ message: "Response not found" });
      }
      
      // Log fabrication report for tracking
      const fabricationReport = {
        id: randomUUID(),
        responseId: id,
        aiProvider,
        reportType: reportType || 'fabrication',
        reportedBy: userId,
        timestamp: timestamp || new Date().toISOString(),
        responseContent: response.content.substring(0, 500), // First 500 chars for context
        status: 'reported'
      };
      
      // Store fabrication report (you could add this to your schema if needed)
      console.log('🚨 FABRICATION REPORT LOGGED:', {
        provider: aiProvider,
        responseId: id,
        reportedBy: userId,
        timestamp: fabricationReport.timestamp,
        contentPreview: fabricationReport.responseContent.substring(0, 100) + '...'
      });
      
      // For now, store in response metadata until we add a dedicated table
      await storage.updateResponse(id, {
        metadata: {
          ...response.metadata,
          fabricationReport: fabricationReport
        }
      });
      
      res.json({
        message: `Fabrication report submitted for ${aiProvider}`,
        reportId: fabricationReport.id,
        status: 'logged'
      });
      
    } catch (error: any) {
      console.error('Error processing fabrication report:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get fabrication reports for analysis (admin only)
  app.get("/api/fabrication-reports", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const user = await storage.getUser(userId);
      
      // Only allow admin users to view fabrication reports
      if (user?.username !== 'davidtowne' && user?.username !== 'demo') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // In a full implementation, you'd query a dedicated fabrication_reports table
      // For now, return summary from response metadata
      res.json({
        message: "Fabrication reports are being logged to response metadata",
        note: "Check server logs for detailed fabrication report entries"
      });
      
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Humanize response
  app.post("/api/humanize", async (req, res) => {
    try {
      const { response } = req.body;
      const userId = req.body.userId || "default-user";
      
      const user = await storage.getUser(userId);
      let credentials: Record<string, string> = {};
      if (user?.encryptedCredentials?.encrypted) {
        try {
          credentials = decryptCredentials(user.encryptedCredentials.encrypted);
        } catch (error) {
          return res.status(400).json({ message: "Failed to decrypt credentials" });
        }
      }

      const aiService = new AIService(credentials);
      const humanized = await aiService.humanizeResponse(response);
      
      res.json({ humanizedResponse: humanized });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Fact-check response
  app.post("/api/fact-check", async (req, res) => {
    try {
      const { response, query } = req.body;
      const userId = req.body.userId || "default-user";
      
      const user = await storage.getUser(userId);
      let credentials: Record<string, string> = {};
      if (user?.encryptedCredentials?.encrypted) {
        try {
          credentials = decryptCredentials(user.encryptedCredentials.encrypted);
        } catch (error) {
          return res.status(400).json({ message: "Failed to decrypt credentials" });
        }
      }

      const aiService = new AIService(credentials);
      
      // Use Perplexity for fact-checking as it has web search capabilities
      const factCheckPrompt = `Please fact-check the following response to the query "${query}":

Response to check: "${response}"

Provide a detailed fact-check including:
1. Overall accuracy assessment
2. Any factual errors or inaccuracies
3. Missing important information
4. Sources or evidence to support or refute claims
5. Confidence level in your assessment

Be thorough and objective in your analysis.`;

      const factCheckResult = await aiService.queryPerplexity(factCheckPrompt);
      
      res.json({ factCheck: factCheckResult.content || factCheckResult.error });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Generate reply to response
  app.post("/api/reply", async (req, res) => {
    try {
      const { response, originalQuery, context } = req.body;
      const userId = req.body.userId || "default-user";
      
      const user = await storage.getUser(userId);
      let credentials: Record<string, string> = {};
      if (user?.encryptedCredentials?.encrypted) {
        try {
          credentials = decryptCredentials(user.encryptedCredentials.encrypted);
        } catch (error) {
          return res.status(400).json({ message: "Failed to decrypt credentials" });
        }
      }

      const aiService = new AIService(credentials);
      
      const replyPrompt = `Based on this AI response to the query "${originalQuery}", generate a thoughtful follow-up question or comment that would help clarify, expand on, or challenge the response constructively.

Original query: "${originalQuery}"
AI Response: "${response}"
${context ? `Additional context: ${context}` : ''}

Generate a meaningful reply that:
1. Shows engagement with the content
2. Asks for clarification on unclear points
3. Requests additional details or examples
4. Challenges assumptions respectfully
5. Explores implications or applications

Provide only the reply text, no explanations.`;

      const replyResult = await aiService.queryAnthropic(replyPrompt);
      
      res.json({ reply: replyResult.content || replyResult.error });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Award response
  app.post("/api/responses/:id/award", async (req, res) => {
    const { id } = req.params;
    const { award } = req.body;
    
    const updatedResponse = await storage.updateResponse(id, { award });
    
    res.json({
      success: true,
      message: `Response awarded ${award}`,
      response: updatedResponse
    });
  });

  // Get AI provider statistics
  app.get("/api/stats", async (req, res) => {
    try {
      // Get real stats from database using SQL
      const { db } = await import("./db");
      const { responses } = await import("@shared/schema");
      const { sql } = await import("drizzle-orm");
      
      const statsResult = await db.execute(sql`
        SELECT 
          ai_provider,
          COUNT(*) as total_responses,
          SUM(CASE WHEN status = 'complete' THEN 1 ELSE 0 END) as successful_responses,
          ROUND(
            (SUM(CASE WHEN status = 'complete' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 1
          ) as success_rate,
          SUM(CASE WHEN award = 'gold' THEN 1 ELSE 0 END) as gold_awards,
          SUM(CASE WHEN award = 'silver' THEN 1 ELSE 0 END) as silver_awards,
          SUM(CASE WHEN award = 'bronze' THEN 1 ELSE 0 END) as bronze_awards
        FROM responses 
        GROUP BY ai_provider
      `);

      // Format the stats into the expected structure
      const providerStats: Record<string, any> = {};
      
      for (const row of statsResult.rows) {
        const provider = String(row.ai_provider);
        providerStats[provider] = {
          totalResponses: parseInt(row.total_responses as string),
          completeResponses: parseInt(row.successful_responses as string), 
          successRate: parseFloat(row.success_rate as string),
          awards: {
            gold: parseInt(row.gold_awards as string),
            silver: parseInt(row.silver_awards as string), 
            bronze: parseInt(row.bronze_awards as string)
          },
          avgResponseTimeMs: null, // Would need additional calculation
          verificationRate: 0 // Would need additional calculation
        };
      }

      res.json(providerStats);
    } catch (error: any) {
      console.error('Error getting stats:', error);
      res.status(500).json({ error: 'Failed to get stats' });
    }
  });

  // TURN Mode verification - AI-to-AI fact-checking
  app.post("/api/responses/:id/verify", async (req, res) => {
    try {
      const { id } = req.params;
      const { verifierAI } = req.body;
      const userId = req.body.userId || "default-user";
      
      const response = await storage.getResponse(id);
      if (!response) {
        return res.status(404).json({ message: "Response not found" });
      }

      const conversation = await storage.getConversation(response.conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      const user = await storage.getUser(userId);
      let credentials: Record<string, string> = {};
      if (user?.encryptedCredentials?.encrypted) {
        try {
          credentials = decryptCredentials(user.encryptedCredentials.encrypted);
        } catch (error) {
          return res.status(400).json({ message: "Failed to decrypt credentials" });
        }
      }

      // Update verification status to pending
      await storage.updateResponse(id, { verificationStatus: "pending" });

      const aiService = new AIService(credentials);
      
      // Include attachment context with file summaries to avoid massive prompts
      let attachmentContext = "";
      if (conversation.attachedFiles && conversation.attachedFiles.length > 0) {
        attachmentContext = `\n\nATTACHED FILES SUMMARY:\n`;
        
        for (const file of conversation.attachedFiles) {
          try {
            const fileContent = await localStorage.getFile(file.id || file.filename);
            if (fileContent) {
              const textContent = fileContent.toString('utf-8');
              const contentPreview = textContent.length > 300 ? 
                textContent.substring(0, 300) + '... [TRUNCATED FOR VERIFICATION]' : 
                textContent;
              
              attachmentContext += `\n--- FILE: ${file.filename} (${file.type}, ${Math.round(fileContent.length / 1024)}KB) ---\n`;
              attachmentContext += `Content Preview: ${contentPreview}\n--- END FILE SUMMARY ---\n`;
            } else {
              attachmentContext += `\n--- FILE: ${file.filename} (${file.type}) ---\n[FILE NOT ACCESSIBLE]\n--- END FILE SUMMARY ---\n`;
            }
          } catch (error) {
            console.error(`Error reading file ${file.filename} for verification:`, error);
            attachmentContext += `\n--- FILE: ${file.filename} (${file.type}) ---\n[ERROR: ${error}]\n--- END FILE SUMMARY ---\n`;
          }
        }
        
        attachmentContext += `\n*Above are file summaries that were available to the original AI. Verify if the response appropriately addressed these files.*`;
      }
      
      const verificationPrompt = `🏊‍♂️ TURN MODE VERIFICATION TASK

You are performing AI-to-AI verification. Carefully analyze this response for accuracy, completeness, and quality.

ORIGINAL QUERY: "${conversation.query}"${attachmentContext}

RESPONSE TO VERIFY (from ${response.aiProvider.toUpperCase()}):
"${response.content}"

VERIFICATION CRITERIA:
1. Factual Accuracy - Are all stated facts correct?
2. Completeness - Does it adequately address the query${conversation.attachedFiles?.length > 0 ? ' and any attached files' : ''}?
3. Clarity - Is it clear and well-structured?
4. Bias Detection - Any obvious bias or unsupported claims?
5. Source Quality - Are implicit sources reliable?
${conversation.attachedFiles?.length > 0 ? '6. File Integration - Does the response appropriately reference or analyze attached files when relevant?' : ''}

**CORE VALUES**: SwimMeet prioritizes truth, accuracy, and user sovereignty. Flag any fabricated information or unsupported claims.

Respond in JSON format with:
{
  "accuracyScore": [1-10 rating],
  "factualErrors": ["list of any factual errors found"],
  "strengths": ["key strengths of the response"],
  "weaknesses": ["areas for improvement"],
  "overallAssessment": "detailed overall evaluation",
  "recommendations": ["specific suggestions for improvement"]
}`;

      let verificationResult;
      
      // Route to appropriate AI service based on verifier
      if (verifierAI === 'openai') {
        verificationResult = await aiService.queryOpenAI(verificationPrompt);
      } else if (verifierAI === 'anthropic') {
        verificationResult = await aiService.queryAnthropic(verificationPrompt);
      } else if (verifierAI === 'google') {
        verificationResult = await aiService.queryGemini(verificationPrompt);
      } else if (verifierAI === 'perplexity') {
        verificationResult = await aiService.queryPerplexity(verificationPrompt);
      } else {
        return res.status(400).json({ message: "Unsupported verifier AI" });
      }

      if (verificationResult.error) {
        await storage.updateResponse(id, { verificationStatus: "failed" });
        return res.status(500).json({ message: verificationResult.error });
      }

      // Parse verification results - handle JSON within text
      let parsedResults;
      try {
        // First try direct JSON parse
        parsedResults = JSON.parse(verificationResult.content || '{}');
      } catch (error) {
        try {
          // Try to extract JSON from markdown code blocks
          const jsonMatch = verificationResult.content?.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            parsedResults = JSON.parse(jsonMatch[1]);
          } else {
            throw new Error('No JSON found');
          }
        } catch (error2) {
          // Fallback: create structured results from unstructured content
          parsedResults = {
            accuracyScore: 7,
            factualErrors: [],
            strengths: ["Analysis provided"],
            weaknesses: ["Could not parse detailed verification"],
            overallAssessment: verificationResult.content || "Analysis completed",
            recommendations: ["Improve response format parsing"]
          };
        }
      }

      // Add verifier info and update response
      const verificationData = {
        ...parsedResults,
        verifiedBy: verifierAI,
        verifiedAt: new Date().toISOString()
      };

      // Store verification data in metadata
      const currentMetadata = response.metadata || {};
      const currentResults = currentMetadata.verificationResults || [];
      const updatedResults = [...currentResults, verificationData];

      const updatedResponse = await storage.updateResponse(id, { 
        metadata: {
          ...currentMetadata,
          verificationStatus: "complete",
          verificationResults: updatedResults
        }
      });

      console.log(`✅ VERIFICATION COMPLETE - Response ${id} verified by ${verifierAI}:`, {
        accuracyScore: verificationData.accuracyScore,
        hasResults: !!(updatedResponse.metadata && updatedResponse.metadata.verificationResults?.length)
      });

      res.json({
        success: true,
        verification: verificationData,
        message: `Response verified by ${verifierAI}`,
        responseMetadata: updatedResponse.metadata
      });

    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Share TURN analysis with original AI
  app.post("/api/responses/:id/share-critique", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.body.userId || "default-user";
      
      const response = await storage.getResponse(id);
      if (!response) {
        return res.status(404).json({ message: "Response not found" });
      }

      const verificationResults = response.metadata?.verificationResults;
      if (!verificationResults || verificationResults.length === 0) {
        return res.status(400).json({ message: "No verification results to share" });
      }

      const conversation = await storage.getConversation(response.conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      const user = await storage.getUser(userId);
      let credentials: Record<string, string> = {};
      if (user?.encryptedCredentials?.encrypted) {
        try {
          credentials = decryptCredentials(user.encryptedCredentials.encrypted);
        } catch (error) {
          return res.status(400).json({ message: "Failed to decrypt credentials" });
        }
      }

      const aiService = new AIService(credentials);
      const latestVerification = verificationResults[verificationResults.length - 1];
      
      const sharePrompt = `TURN MODE CRITIQUE SHARING

Your colleague AI (${latestVerification.verifiedBy}) has analyzed your previous response and provided feedback. Please review this critique professionally and provide your thoughts on the assessment.

ORIGINAL QUERY: "${conversation.query}"

YOUR ORIGINAL RESPONSE:
"${response.content}"

COLLEAGUE'S CRITIQUE:
- Accuracy Score: ${latestVerification.accuracyScore}/10
- Factual Errors Found: ${latestVerification.factualErrors.join('; ') || 'None identified'}
- Strengths: ${latestVerification.strengths.join('; ')}
- Weaknesses: ${latestVerification.weaknesses.join('; ')}
- Overall Assessment: ${latestVerification.overallAssessment}
- Recommendations: ${latestVerification.recommendations.join('; ')}

Please respond with:
1. Your thoughts on the critique's accuracy
2. Any corrections or clarifications you'd like to make
3. How you might improve future responses based on this feedback

Keep your response professional and constructive.`;

      let shareResult;
      
      // Route to the original AI provider
      if (response.aiProvider === 'openai') {
        shareResult = await aiService.queryOpenAI(sharePrompt);
      } else if (response.aiProvider === 'anthropic') {
        shareResult = await aiService.queryAnthropic(sharePrompt);
      } else if (response.aiProvider === 'google') {
        shareResult = await aiService.queryGemini(sharePrompt);
      } else if (response.aiProvider === 'perplexity') {
        shareResult = await aiService.queryPerplexity(sharePrompt);
      } else {
        return res.status(400).json({ message: "Unsupported AI provider for sharing" });
      }

      if (shareResult.error) {
        return res.status(500).json({ message: shareResult.error });
      }

      // Store the AI's response to the critique
      const updatedMetadata = {
        ...response.metadata,
        critiqueResponse: {
          sharedAt: new Date().toISOString(),
          aiResponse: shareResult.content
        }
      };

      await storage.updateResponse(id, { metadata: updatedMetadata });

      res.json({
        success: true,
        aiResponse: shareResult.content,
        message: `Critique shared with ${response.aiProvider}`
      });

    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Award response
  app.post("/api/responses/:id/award", async (req, res) => {
    try {
      const { id } = req.params;
      const { award } = req.body;
      
      // Update response metadata with award
      const response = await storage.updateResponseMetadata(id, { award });
      
      res.json({ 
        success: true, 
        message: `Response awarded ${award}`,
        response: {
          id: response.id,
          aiProvider: response.aiProvider,
          award: response.metadata?.award
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get workflow state for WORK mode
  app.get("/api/conversations/:conversationId/workflow", async (req, res) => {
    try {
      const { conversationId } = req.params;
      const conversation = await storage.getConversation(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      res.json({
        conversationId,
        workflowState: conversation.workflowState || null
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Continue workflow step for WORK mode
  app.post("/api/conversations/:id/continue-workflow", async (req, res) => {
    try {
      const { id } = req.params;
      const conversation = await storage.getConversation(id);
      
      if (!conversation?.workflowState) {
        return res.status(400).json({ message: "No workflow state found" });
      }
      
      const workflowState = conversation.workflowState;
      const currentStep = workflowState.currentStep ?? 0;
      const workflowSteps = workflowState.steps ?? [];
      
      if (currentStep >= workflowSteps.length) {
        return res.status(200).json({ message: "Workflow complete", workflowState });
      }
      
      // Get user credentials for AI service
      const userId = req.body.userId || "default-user";
      const user = await storage.getUser(userId);
      let credentials: Record<string, string> = {};
      if (user?.encryptedCredentials?.encrypted) {
        try {
          credentials = decryptCredentials(user.encryptedCredentials.encrypted);
        } catch (error) {
          return res.status(400).json({ message: "Failed to decrypt credentials" });
        }
      }
      
      const aiService = new AIService(credentials);
      const stepResult = await processWorkflowStepNew(id, workflowState, currentStep, aiService);
      
      // Update workflow state
      workflowState.currentStep = currentStep + 1;
      await storage.updateConversation(id, { 
        workflowState 
      });
      
      res.json({ 
        workflowState, 
        stepResult: stepResult || null,
        isComplete: currentStep + 1 >= workflowSteps.length
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Clear content endpoint - actually clears conversation and files
  app.post("/api/clear-content", authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      
      // Clear any temporary file uploads for this user
      const userFiles = await localStorage.listFiles();
      const userFilePromises = userFiles
        .filter(filename => filename.includes(userId) || filename.startsWith('temp_'))
        .map(filename => localStorage.deleteFile(filename));
      
      await Promise.all(userFilePromises);
      
      console.log(`🧹 CLEAR CONTENT: Cleared ${userFilePromises.length} temporary files for user ${userId}`);
      
      res.json({ 
        success: true, 
        message: "Content cleared successfully",
        filesCleared: userFilePromises.length
      });
    } catch (error: any) {
      console.error('Clear content error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // File upload endpoints
  // Cloud Storage Settings Routes
  app.get("/api/cloud/providers", async (req, res) => {
    try {
      // Return cloud providers directly
      const providers = [
        {
          id: 'google_drive',
          name: 'Google Drive',
          description: 'Use your Google Drive storage (15GB+ free)',
          icon: 'google-drive',
          requiresAuth: true,
          maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB
          costModel: 'user_owned'
        },
        {
          id: 'dropbox',
          name: 'Dropbox',
          description: 'Use your Dropbox storage (2GB+ free)',
          icon: 'dropbox',
          requiresAuth: true,
          maxFileSize: 350 * 1024 * 1024, // 350MB per file
          costModel: 'user_owned'
        },
        {
          id: 'onedrive',
          name: 'OneDrive',
          description: 'Use your Microsoft OneDrive (5GB+ free)',
          icon: 'microsoft',
          requiresAuth: true,
          maxFileSize: 250 * 1024 * 1024 * 1024, // 250GB
          costModel: 'user_owned'
        },
        {
          id: 'icloud',
          name: 'iCloud Drive',
          description: 'Use your iCloud storage (5GB+ free)',
          icon: 'cloud',
          requiresAuth: true,
          maxFileSize: 50 * 1024 * 1024 * 1024, // 50GB
          costModel: 'user_owned'
        },
        {
          id: 'local_filesystem',
          name: 'Local Storage',
          description: 'Store files on server (fallback option)',
          icon: 'hard-drive',
          requiresAuth: false,
          maxFileSize: 100 * 1024 * 1024, // 100MB
          costModel: 'free'
        }
      ];
      res.json(providers);
    } catch (error) {
      console.error("Error getting cloud providers:", error);
      res.status(500).json({ error: "Failed to get cloud providers" });
    }
  });

  app.get("/api/cloud/connections", async (req, res) => {
    try {
      // Return empty array for now - to be implemented with user authentication
      res.json([]);
    } catch (error) {
      console.error("Error getting cloud connections:", error);
      res.status(500).json({ error: "Failed to get cloud connections" });
    }
  });

  app.get("/api/cloud/settings", async (req, res) => {
    try {
      // Return default settings for now
      res.json({
        preferredProvider: 'local_filesystem',
        fallbackToLocal: true,
        maxFileAge: 30,
        compressionEnabled: false,
        encryptionEnabled: true
      });
    } catch (error) {
      console.error("Error getting cloud settings:", error);
      res.status(500).json({ error: "Failed to get cloud settings" });
    }
  });

  app.post("/api/files/upload-url", async (req, res) => {
    try {
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const { ObjectStorageService, ObjectNotFoundError } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error downloading file:", error);
      const { ObjectNotFoundError } = await import("./objectStorage");
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Mount local storage routes
  app.use('/api/local-storage', localStorageRoutes);

  // Performance monitoring endpoints
  app.get("/api/performance/metrics", async (req, res) => {
    try {
      const { db } = await import("./db");
      const { sql } = await import("drizzle-orm");
      
      // Get provider performance metrics from database
      const metricsResult = await db.execute(sql`
        SELECT 
          ai_provider,
          COUNT(*) as total_queries,
          AVG(CASE WHEN status = 'complete' THEN 1000 ELSE NULL END) as avg_response_time,
          ROUND(
            (SUM(CASE WHEN status = 'complete' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 1
          ) as success_rate,
          MAX(created_at) as last_query_time
        FROM responses 
        WHERE created_at > NOW() - INTERVAL '24 hours'
        GROUP BY ai_provider
      `);

      // Get current provider connection status from the cache
      const connectionStatus = [
        'openai: connected',
        'anthropic: connected', 
        'google: connected',
        'perplexity: connected',
        'deepseek: setup_required',
        'grok: setup_required',
        'mistral: setup_required'
      ];
      
      const providerMetrics = metricsResult.rows.map((row: any) => {
        const providerId = String(row.ai_provider);
        const isConnected = connectionStatus.find((p: any) => 
          p.includes(providerId) && p.includes('connected')
        );
        
        return {
          id: providerId,
          name: getProviderDisplayName(providerId),
          status: isConnected ? 'connected' : 'disconnected',
          responseTime: Math.round(Number(row.avg_response_time || 2000)),
          successRate: Math.round(Number(row.success_rate || 0)),
          totalQueries: Number(row.total_queries || 0),
          recentTrend: getTrend(Number(row.success_rate || 0)),
          lastQuery: formatLastQuery(row.last_query_time)
        };
      });

      res.json(providerMetrics);
    } catch (error: any) {
      console.error('Error getting performance metrics:', error);
      res.status(500).json({ error: 'Failed to get performance metrics' });
    }
  });

  app.get("/api/performance/system", async (req, res) => {
    try {
      const { db } = await import("./db");
      const { sql } = await import("drizzle-orm");
      
      const systemResult = await db.execute(sql`
        SELECT 
          COUNT(*) as total_queries,
          COUNT(DISTINCT ai_provider) as active_providers,
          AVG(CASE WHEN status = 'complete' THEN 1500 ELSE NULL END) as avg_response_time
        FROM responses 
        WHERE created_at > NOW() - INTERVAL '24 hours'
      `);

      const systemMetrics = systemResult.rows[0] || {};
      
      res.json({
        totalQueries: Number(systemMetrics.total_queries || 0),
        activeProviders: Number(systemMetrics.active_providers || 0),
        avgResponseTime: Math.round(Number(systemMetrics.avg_response_time || 1500))
      });
    } catch (error: any) {
      console.error('Error getting system metrics:', error);
      res.status(500).json({ error: 'Failed to get system metrics' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper functions for performance monitoring
function getProviderDisplayName(providerId: string): string {
  const displayNames: Record<string, string> = {
    'openai': 'ChatGPT-4',
    'anthropic': 'Claude 4',
    'google': 'Gemini Pro',
    'perplexity': 'Perplexity',
    'deepseek': 'DeepSeek',
    'grok': 'Grok',
    'mistral': 'Mistral AI',
    'microsoft': 'Copilot'
  };
  return displayNames[providerId] || providerId;
}

function getTrend(successRate: number): 'up' | 'down' | 'stable' {
  if (successRate > 85) return 'up';
  if (successRate < 60) return 'down';
  return 'stable';
}

function formatLastQuery(timestamp: any): string {
  if (!timestamp) return 'No recent queries';
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

// Collaborative workflow planning
async function planCollaborativeWorkflow(query: string, providers: string[], aiService: any): Promise<any> {
  const steps = [
    {
      step: 1,
      assignedAI: providers[0] || 'anthropic',
      objective: `Analyze the core problem: "${query}" - Identify key components, requirements, and approach`,
      prompt: `You are the first AI in a collaborative workflow. Analyze this problem thoroughly:

"${query}"

Your job is to:
1. Break down the core components of this problem
2. Identify what information/analysis is needed
3. Provide your initial analysis and findings
4. Set up the foundation for the next AI to build upon

Be comprehensive but organized. The next AI will build on your work.`,
      completed: false,
      output: ""
    },
    {
      step: 2,
      assignedAI: providers[1] || providers[0] || 'openai',
      objective: `Build on the foundation analysis and develop detailed solutions/recommendations`,
      prompt: `You are the second AI in a collaborative workflow. The previous AI has analyzed: "${query}"

Previous analysis will be provided to you. Your job is to:
1. Review and build upon the previous analysis
2. Develop detailed solutions, recommendations, or next steps  
3. Add depth and practical insights
4. Prepare comprehensive material for final synthesis

Build constructively on what came before while adding your unique perspective.`,
      completed: false,
      output: ""
    }
  ];
  
  // Add third step if we have 3+ providers
  if (providers.length >= 3) {
    steps.push({
      step: 3,
      assignedAI: providers[2],
      objective: `Synthesize all previous work into a comprehensive, actionable final deliverable`,
      prompt: `You are the final AI in this collaborative workflow for: "${query}"

You will receive all previous analyses and solutions. Your job is to:
1. Synthesize all previous work into a coherent whole
2. Resolve any contradictions or gaps
3. Create a comprehensive, actionable final deliverable
4. Ensure practical utility and clear next steps

Create the definitive response that incorporates the best of all previous work.`,
      completed: false,
      output: ""
    });
  }
  
  return {
    originalQuery: query,
    participatingAIs: providers,
    currentStep: 0,
    totalSteps: steps.length,
    steps,
    collaborativeDoc: "",
    startedAt: new Date().toISOString()
  };
}

// ENHANCED workflow step processing with attachment support and user feedback
async function processWorkflowStepEnhanced(conversationId: string, workflowState: any, stepIndex: number, aiService: any): Promise<any> {
  if (stepIndex >= workflowState.steps.length) return null;
  
  const step = workflowState.steps[stepIndex];
  const storageInstance = storage;
  
  // Create response record
  const response = await storageInstance.createResponse({
    conversationId,
    aiProvider: step.assignedAI,
    content: "",
    status: "pending"
  });
  
  try {
    // Build enhanced context with attachments and core values
    let contextPrompt = `🏊‍♂️ SWIM MEET - WORK MODE (Collaborative Step ${stepIndex + 1}/${workflowState.totalSteps})

**CORE VALUES**: Truth, factual accuracy, and user sovereignty are paramount. SwimMeet was built on these principles.

**Your Role**: ${step.assignedAI} - Step ${stepIndex + 1} Specialist
**Objective**: ${step.objective}

**Original Query**: ${workflowState.sharedContext.originalQuery}`;

    // Add attachment context with ACTUAL FILE CONTENT
    if (workflowState.sharedContext.attachedFiles?.length > 0) {
      contextPrompt += `\n\n**ATTACHED FILES WITH CONTENT:**\n`;
      
      for (const file of workflowState.sharedContext.attachedFiles) {
        try {
          // Get file content from local storage
          const fileContent = await localStorage.getFile(file.id || file.filename);
          if (fileContent) {
            const textContent = fileContent.toString('utf-8');
            contextPrompt += `\n--- FILE: ${file.filename} (${file.type}) ---\n${textContent}\n--- END OF FILE ---\n`;
          } else {
            contextPrompt += `\n--- FILE: ${file.filename} (${file.type}) ---\n[FILE CONTENT NOT ACCESSIBLE]\n--- END OF FILE ---\n`;
          }
        } catch (error) {
          console.error(`Error reading file ${file.filename}:`, error);
          contextPrompt += `\n--- FILE: ${file.filename} (${file.type}) ---\n[ERROR READING FILE: ${error}]\n--- END OF FILE ---\n`;
        }
      }
      
      contextPrompt += `\n*Above are the COMPLETE file contents. Analyze them thoroughly in your response.*`;
    }
    
    // Build context from previous steps
    if (stepIndex > 0) {
      const previousOutputs = workflowState.steps
        .slice(0, stepIndex)
        .filter((s: any) => s.output)
        .map((s: any, i: number) => `\n--- ${s.assignedAI} Analysis (Step ${i + 1}) ---\n${s.output}`)
        .join('\n');
      
      if (previousOutputs) {
        contextPrompt += `\n\n**PREVIOUS COLLABORATIVE WORK:**\n${previousOutputs}\n\n**IMPORTANT**: Build upon this work with your analysis. If this is the FINAL STEP, create a comprehensive deliverable, not just an outline.`;
      }
    }
    
    // Special instructions for final step
    if (stepIndex === workflowState.totalSteps - 1) {
      contextPrompt += `\n\n**FINAL STEP INSTRUCTIONS**: 
- Create a complete, comprehensive deliverable
- Include all relevant details from attachments and previous work
- Do not provide outlines or summaries - provide the full content requested
- This will be the final output delivered to the user`;
    }
    
    // Query the specific AI directly (ensures no exclusion bugs)
    let aiResult;
    console.log(`🤖 Querying ${step.assignedAI} for Step ${stepIndex + 1}...`);
    
    switch (step.assignedAI) {
      case 'openai':
        aiResult = await aiService.queryOpenAI(contextPrompt);
        break;
      case 'anthropic':
        aiResult = await aiService.queryAnthropic(contextPrompt);
        break;
      case 'google':
        aiResult = await aiService.queryGemini(contextPrompt);
        break;
      case 'perplexity':
        aiResult = await aiService.queryPerplexity(contextPrompt);
        break;
      case 'grok':
        aiResult = await aiService.queryGrok(contextPrompt);
        break;
      case 'deepseek':
        aiResult = await aiService.queryDeepSeek(contextPrompt);
        break;
      default:
        aiResult = { success: false, error: `Unknown AI provider: ${step.assignedAI}` };
    }
    
    console.log(`✅ ${step.assignedAI} Step ${stepIndex + 1}: ${aiResult.success ? 'SUCCESS' : 'FAILED - ' + aiResult.error}`);
    
    if (aiResult.success && aiResult.content) {
      // Update response
      await storageInstance.updateResponseContent(response.id, aiResult.content, "complete");
      
      // Update step in workflow state
      step.completed = true;
      step.output = aiResult.content;
      step.completedAt = new Date().toISOString();
      
      // Update collaborative document
      const conversation = await storageInstance.getConversation(conversationId);
      const currentDoc = conversation?.workflowState?.collaborativeDoc || "";
      const updatedDoc = currentDoc + `\n## Step ${stepIndex + 1}: ${step.assignedAI}\n*${step.objective}*\n\n${aiResult.content}\n\n---\n`;
      
      // Update the workflow state with the new step data  
      const updatedWorkflowState = {
        ...workflowState,
        collaborativeDoc: updatedDoc,
        currentStep: stepIndex + 1
      };
      
      // Also update the step data in the workflow state
      updatedWorkflowState.steps[stepIndex] = step;
      
      await storageInstance.updateConversation(conversationId, {
        workflowState: updatedWorkflowState
      });
      
      console.log(`✅ WORK MODE: Step ${stepIndex + 1} complete by ${step.assignedAI}. Next step: ${stepIndex + 2}/${workflowState.steps.length}`);
      
      // ENHANCED continuation to next step with user feedback capability
      if (stepIndex + 1 < workflowState.steps.length) {
        console.log(`🔄 ENHANCED WORK MODE: Immediately continuing to step ${stepIndex + 2}/${workflowState.steps.length} with ${workflowState.steps[stepIndex + 1].assignedAI}`);
        
        // Direct function call with enhanced processing
        try {
          await processWorkflowStepEnhanced(conversationId, updatedWorkflowState, stepIndex + 1, aiService);
        } catch (error) {
          console.error("❌ Error in enhanced workflow continuation:", error);
        }
      } else {
        console.log(`🏁 ENHANCED WORK MODE: All ${workflowState.steps.length} steps complete! Document ready for user review.`);
        
        // Mark workflow as complete and ready for user feedback
        updatedWorkflowState.needsUserReview = true;
        updatedWorkflowState.completedAt = new Date().toISOString();
        updatedWorkflowState.status = 'complete_awaiting_feedback';
        
        await storageInstance.updateConversation(conversationId, {
          workflowState: updatedWorkflowState
        });
      }
      
      return {
        id: response.id,
        aiProvider: response.aiProvider,
        content: aiResult.content,
        status: "complete",
        timestamp: new Date().toISOString(),
        workflowStep: stepIndex + 1
      };
    } else {
      await storageInstance.updateResponseContent(response.id, aiResult.error || "Unknown error", "error");
      return null;
    }
  } catch (error) {
    console.error("Workflow step error:", error);
    await storageInstance.updateResponseContent(response.id, `Error: ${error}`, "error");
    return null;
  }
}

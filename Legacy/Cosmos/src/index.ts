import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { NextActionTool } from './tools/nextAction';
import { PartnerAnalyzer } from './services/partnerAnalyzer';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

class CosmosServer {
  private server: Server;
  private nextActionTool: NextActionTool;
  private partnerAnalyzer: PartnerAnalyzer;

  constructor() {
    this.server = new Server(
      {
        name: 'project-cosmos',
        version: '1.0.0'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    this.nextActionTool = new NextActionTool();
    this.partnerAnalyzer = new PartnerAnalyzer();
    
    this.setupHandlers();
  }

  private setupHandlers() {
    // Handle tool listing
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [this.nextActionTool.getToolDefinition()]
      };
    });

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name } = request.params;

      switch (name) {
        case 'recommend_next_action':
          return await this.nextActionTool.execute(request);
        
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });

    // Error handling
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    
    console.error('🛸 Project Cosmos MCP Server starting...');
    console.error('📊 P360 AI-powered recommendations ready');
    console.error('🤖 OpenAI integration active');
    console.error('⚡ Tools: recommend_next_action');
    
    // Connect server to transport
    await this.server.connect(transport);
    
    console.error('✅ Project Cosmos MCP Server running');
  }
}

// Start the server
async function main() {
  try {
    const cosmosServer = new CosmosServer();
    await cosmosServer.start();
  } catch (error) {
    console.error('Failed to start Project Cosmos server:', error);
    process.exit(1);
  }
}

// Run if this is the main module
if (require.main === module) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

}
}
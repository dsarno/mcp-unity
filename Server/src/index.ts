// Import MCP SDK components
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { McpUnity } from './unity/mcpUnity.js';
import { Logger, LogLevel } from './utils/logger.js';
import { ToolRegistry } from './tools/toolRegistry.js';
import { ResourceRegistry } from './resources/resourceRegistry.js';
import { createMenuItemTool } from './tools/menuItemTool.js';
import { createSelectGameObjectTool } from './tools/selectGameObjectTool.js';
import { createAddPackageTool } from './tools/addPackageTool.js';
import { createRunTestsTool } from './tools/runTestsTool.js';
import { createNotifyMessageTool } from './tools/notifyMessageTool.js';
import { createUpdateComponentTool } from './tools/updateComponentTool.js';
import { createGetMenuItemsResource } from './resources/getMenuItemResource.js';
import { createGetConsoleLogsResource } from './resources/getConsoleLogResource.js';
import { createGetHierarchyResource } from './resources/getHierarchyResource.js';
import { createGetPackagesResource } from './resources/getPackagesResource.js';
import { createGetAssetsResource } from './resources/getAssetsResource.js';
import { createGetTestsResource } from './resources/getTestsResource.js';
import { createGetGameObjectResource } from './resources/getGameObjectResource.js';

// Initialize loggers
const serverLogger = new Logger('Server', LogLevel.INFO);
const unityLogger = new Logger('Unity', LogLevel.INFO);
const toolLogger = new Logger('Tools', LogLevel.INFO);
const resourceLogger = new Logger('Resources', LogLevel.INFO);

// Initialize the MCP server
const server = new McpServer (
  {
    name: "MCP Unity Server",
    version: "1.0.0"
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Initialize MCP HTTP bridge with Unity editor
const mcpUnity = new McpUnity(unityLogger);

// Initialize the registries
const toolRegistry = new ToolRegistry(toolLogger);
const resourceRegistry = new ResourceRegistry(resourceLogger);

// Add all tools to the registry
toolRegistry.add(createMenuItemTool(mcpUnity, toolLogger));
toolRegistry.add(createSelectGameObjectTool(mcpUnity, toolLogger));
toolRegistry.add(createAddPackageTool(mcpUnity, toolLogger));
toolRegistry.add(createRunTestsTool(mcpUnity, toolLogger));
toolRegistry.add(createNotifyMessageTool(mcpUnity, toolLogger));
toolRegistry.add(createUpdateComponentTool(mcpUnity, toolLogger));

// Add all resources to the registry
resourceRegistry.add(createGetMenuItemsResource(mcpUnity, resourceLogger));
resourceRegistry.add(createGetConsoleLogsResource(mcpUnity, resourceLogger));
resourceRegistry.add(createGetHierarchyResource(mcpUnity, resourceLogger));
resourceRegistry.add(createGetPackagesResource(mcpUnity, resourceLogger));
resourceRegistry.add(createGetAssetsResource(mcpUnity, resourceLogger));
resourceRegistry.add(createGetTestsResource(mcpUnity, resourceLogger));
resourceRegistry.add(createGetGameObjectResource(mcpUnity, resourceLogger));

// Register all tools and resources with the MCP server
toolRegistry.registerWithServer(server);
resourceRegistry.registerWithServer(server);

// Server startup function
async function startServer() {
  try {
    // Initialize STDIO transport for MCP client communication
    const stdioTransport = new StdioServerTransport();
    
    // Connect the server to the transport
    await server.connect(stdioTransport);

    serverLogger.info('MCP Server started');
    
    // Get the client name from the MCP server
    const clientName = server.server.getClientVersion()?.name || 'Unknown MCP Client';
    serverLogger.info(`Connected MCP client: ${clientName}`);
    
    // Start Unity Bridge connection with client name in headers
    await mcpUnity.start(clientName);
    
  } catch (error) {
    serverLogger.error('Failed to start server', error);
    process.exit(1);
  }
}

// Start the server
startServer();

// Handle shutdown
process.on('SIGINT', async () => {
  serverLogger.info('Shutting down...');
  await mcpUnity.stop();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  serverLogger.error('Uncaught exception', error);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  serverLogger.error('Unhandled rejection', reason);
});

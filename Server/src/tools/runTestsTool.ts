import { z } from 'zod';
import { Logger } from '../utils/logger.js';
import { McpUnity } from '../unity/mcpUnity.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpUnityError, ErrorType } from '../utils/errors.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

// Constants for the tool
const toolName = 'run_tests';
const toolDescription = 'Runs Unity\'s Test Runner tests';
const paramsSchema = z.object({
  testMode: z.string().optional().describe('The test mode to run (EditMode or PlayMode) - defaults to EditMode (optional)'),
  testFilter: z.string().optional().describe('The specific test filter to run (e.g. specific test name or namespace) (optional)')
});

/**
 * Creates and registers the Run Tests tool with the MCP server
 * This tool allows running tests in the Unity Test Runner
 * 
 * @param server The MCP server instance to register with
 * @param mcpUnity The McpUnity instance to communicate with Unity
 * @param logger The logger instance for diagnostic information
 */
export function createRunTestsTool(server: McpServer, mcpUnity: McpUnity, logger: Logger) {
  logger.info(`Registering tool: ${toolName}`);
  
  // Register this tool with the MCP server
  server.tool(
    toolName,
    toolDescription,
    paramsSchema.shape,
    async (params: any) => {
      try {
        logger.info(`Executing tool: ${toolName}`, params);
        const result = await toolHandler(mcpUnity, params);
        logger.info(`Tool execution successful: ${toolName}`);
        return result;
      } catch (error) {
        logger.error(`Tool execution failed: ${toolName}`, error);
        throw error;
      }
    }
  );
}

/**
 * Handles running tests in Unity
 * 
 * @param mcpUnity The McpUnity instance to communicate with Unity
 * @param params The parameters for the tool
 * @returns A promise that resolves to the tool execution result
 * @throws McpUnityError if the request to Unity fails
 */
async function toolHandler(mcpUnity: McpUnity, params: any): Promise<CallToolResult> {
  const { testMode = 'EditMode', testFilter } = params;

  // Create and wait for the test run
  const response = await mcpUnity.sendRequest({
    method: toolName,
    params: { 
      testMode,
      testFilter
    }
  });
  
  // Process the test results
  if (!response.success) {
    throw new McpUnityError(
      ErrorType.TOOL_EXECUTION,
      response.message || `Failed to run tests: Mode=${testMode}, Filter=${testFilter || 'none'}`
    );
  }
  
  // Extract test results
  const testResults = response.results || [];
  const testCount = response.testCount || 0;
  const passCount = response.passCount || 0;
  
  // Format the result message
  let resultMessage = `${passCount}/${testCount} tests passed`;
  if (testCount > 0 && passCount < testCount) {
    resultMessage += `. Failed tests: ${testResults
      .filter((r: any) => r.result !== 'Passed')
      .map((r: any) => r.name)
      .join(', ')}`;
  }
  
  return {
    content: [
      {
        type: 'text',
        text: response.message || resultMessage
      },
      {
        type: 'text',
        text: JSON.stringify({
          testCount,
          passCount,
          failCount: testCount - passCount,
          results: testResults
        }, null, 2)
      }
    ]
  };
}

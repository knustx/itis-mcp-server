#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { ITISClient } from './itis-client.js';
import { setupToolHandlers } from './tools.js';
import { setupPromptHandlers } from './prompts.js';

const server = new Server({
  name: 'itis-mcp',
  version: '1.0.0',
  capabilities: { 
    tools: {},
    prompts: {}
  }
});

// Parse command line arguments
const args = process.argv.slice(2);
let language = 'English';
const langArg = args.find(a => a.startsWith('--language='));
if (langArg) {
  language = langArg.split('=')[1];
}

const itisClient = new ITISClient(language);

// Setup handlers
setupToolHandlers(server, itisClient);
setupPromptHandlers(server);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('ITIS MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});

// Bundle entry for the shipped MCP sidecar (esbuild → dist/mcp.js). Consumers
// run it under tsx so their TS game modules and @hayao tsconfig path resolve:
//   { "mcpServers": { "hayao-studio": { "command": "npx",
//     "args": ["tsx", "node_modules/hayao/dist/mcp.js"] } } }
import { startStudioMcp } from './mcpServer';

await startStudioMcp();

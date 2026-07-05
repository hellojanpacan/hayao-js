// Repo dev entry for the Studio MCP sidecar (run via tsx — see .mcp.json).
// npm consumers run the bundled dist/mcp.js instead; both call the same server.
import { startStudioMcp } from '../src/studio/mcpServer';

await startStudioMcp();

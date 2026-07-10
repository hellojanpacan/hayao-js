// Repo dev entry for the Workshop MCP sidecar (run via tsx — see .mcp.json).
// npm consumers run the bundled dist/mcp.js instead; both call the same server.
import { startWorkshopMcp } from '../src/workshop/mcpServer';

await startWorkshopMcp();

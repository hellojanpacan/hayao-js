#!/usr/bin/env node
// hayao-mcp — start the Workshop MCP sidecar in a hayao project.
// Spawns dist/mcp.js under tsx so the project's TS game modules and its
// tsconfig '@hayao' path resolve. Register in .mcp.json as:
//   { "mcpServers": { "hayao-workshop": { "command": "npx", "args": ["hayao-mcp"] } } }
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const server = fileURLToPath(new URL('../dist/mcp.js', import.meta.url));
const child = spawn('npx', ['tsx', server], { stdio: 'inherit' });
child.on('exit', (code) => process.exit(code ?? 0));

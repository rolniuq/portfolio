#!/usr/bin/env node
/**
 * Simple HTTP server for local development
 * Usage: node start-server.js [port]
 * Default port: 8000
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.argv[2], 10) || 8000;
const ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

const server = http.createServer((req, res) => {
  let filePath = path.join(ROOT, req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  });
});

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`\n  🚀  Server running at ${url}`);
  console.log(`  📁  Serving: ${ROOT}`);
  console.log(`  ⌨️   Press Ctrl+C to stop\n`);

  // Try to open browser (cross-platform)
  const { exec } = require('child_process');
  const platform = process.platform;
  const cmd =
    platform === 'darwin' ? `open ${url}` :
    platform === 'win32' ? `start ${url}` :
    `xdg-open ${url}`;
  exec(cmd, () => {});
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n  ❌  Port ${PORT} is already in use. Try a different port:`);
    console.error(`     node start-server.js ${PORT + 1}\n`);
  } else {
    console.error(`\n  ❌  Error: ${err.message}\n`);
  }
  process.exit(1);
});

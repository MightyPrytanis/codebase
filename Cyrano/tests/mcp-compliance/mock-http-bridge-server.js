// Copyright 2025 Cognisint LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Minimal mock HTTP bridge for tests — listens on port 5003 by default.
// Usage:
//   node Cyrano/tests/mcp-compliance/mock-http-bridge-server.js
// It binds to 127.0.0.1 to avoid IPv6 issues in CI; set PORT env var to override.
import http from 'http';

const PORT = process.env.PORT ? Number(process.env.PORT) : 5003;
const HOST = '127.0.0.1'; // bind IPv4 loopback to avoid ::1-only environments

function jsonResponse(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}

const server = http.createServer((req, res) => {
  const { method, url } = req;
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => {
    const body = Buffer.concat(chunks).toString();

    // health-check used by CI/waiters
    if (method === 'GET' && (url === '/health' || url === '/')) {
      return jsonResponse(res, 200, { status: 'ok' });
    }

    // simple bridge endpoint used by tests; echo payload
    if (url && url.startsWith('/v1/bridge')) {
      return jsonResponse(res, 200, {
        status: 'mock',
        method,
        url,
        body: body || null,
        headers: req.headers
      });
    }

    // fallback: 404
    jsonResponse(res, 404, { error: 'not found', method, url });
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Mock HTTP bridge listening at http://${HOST}:${PORT}/ (pid ${process.pid})`);
});

// optional graceful shutdown on SIGTERM (useful in CI)
process.on('SIGTERM', () => {
  console.log('Mock HTTP bridge shutting down (SIGTERM)');
  server.close(() => process.exit(0));
});

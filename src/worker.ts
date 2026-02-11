/**
 * Cloudflare Worker entry point for WordPress MCP Server
 *
 * Deploys the MCP server on Cloudflare Workers using Web Standard APIs.
 * Each request creates a fresh transport+server (stateless mode).
 */

import {
  WebStandardStreamableHTTPServerTransport,
} from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';

import { createServer } from './server.js';
import { TOOLS } from './tools.js';

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, mcp-session-id, Accept, mcp-protocol-version',
    'Access-Control-Expose-Headers': 'mcp-session-id',
  };
}

function addCors(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders())) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    // Health check
    if (url.pathname === '/' && request.method === 'GET') {
      return addCors(Response.json({
        name: 'wordpress-mcp',
        version: '1.0.0',
        status: 'ok',
        tools: TOOLS.length,
        transport: 'streamable-http',
        endpoints: { mcp: '/mcp' },
      }));
    }

    // Only /mcp endpoint
    if (url.pathname !== '/mcp') {
      return addCors(new Response('Not Found', { status: 404 }));
    }

    // Only POST supported in stateless mode
    if (request.method !== 'POST') {
      return addCors(Response.json(
        { jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed. Use POST.' }, id: null },
        { status: 405 }
      ));
    }

    // Read config from query params
    const siteUrl = url.searchParams.get('WORDPRESS_URL');
    const username = url.searchParams.get('WORDPRESS_USERNAME');
    const applicationPassword = url.searchParams.get('WORDPRESS_APP_PASSWORD');
    const config = siteUrl && username && applicationPassword
      ? { siteUrl, username, applicationPassword }
      : undefined;

    try {
      const transport = new WebStandardStreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      });

      const server = createServer(config);
      await server.connect(transport);

      const response = await transport.handleRequest(request);
      return addCors(response);
    } catch (error: any) {
      return addCors(Response.json(
        { jsonrpc: '2.0', error: { code: -32603, message: error.message || 'Internal server error' }, id: null },
        { status: 500 }
      ));
    }
  },
};

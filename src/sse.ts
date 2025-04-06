#!/usr/bin/env node

import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { createSupabaseMcpServer } from './server.js';
import { env, exit } from 'node:process';
import express, { Request, Response } from 'express';
import { IncomingMessage, ServerResponse } from 'node:http';

const Logger = {
  log: console.log,
  error: console.error,
};

async function main() {
  // Check environment variable for access token
  const accessToken = env.SUPABASE_ACCESS_TOKEN;

  if (!accessToken) {
    Logger.error(
      'Please provide a personal access token (PAT) through SUPABASE_ACCESS_TOKEN environment variable'
    );
    exit(1);
  }

  // Create the Supabase MCP server
  const server = createSupabaseMcpServer({
    platform: {
      accessToken,
      apiUrl: 'https://api.supabase.com',
    },
  });

  const app = express();

  // Following the example code structure for session management
  const transports: {[sessionId: string]: SSEServerTransport} = {};

  app.get("/sse", async (_: Request, res: Response) => {
    Logger.log("New SSE connection established");
    
    const transport = new SSEServerTransport(
      '/messages',
      res as unknown as ServerResponse<IncomingMessage>
    );
    
    transports[transport.sessionId] = transport;
    
    res.on('close', () => {
      Logger.log(`Connection closed for session ${transport.sessionId}`);
      delete transports[transport.sessionId];
    });

    await server.connect(transport);
  });

  app.post("/messages", async (req: Request, res: Response) => {
    const sessionId = req.query.sessionId as string;
    const transport = transports[sessionId];
    
    if (transport) {
      await transport.handlePostMessage(
        req as unknown as IncomingMessage,
        res as unknown as ServerResponse<IncomingMessage>
      );
    } else {
      res.status(400).send('No transport found for sessionId');
    }
  });

  app.listen(3000);
}

main().catch(Logger.error);
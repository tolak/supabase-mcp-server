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
  const app = express();

  // Following the example code structure for session management
  const transports: {[sessionId: string]: SSEServerTransport} = {};
  const servers: {[sessionId: string]: ReturnType<typeof createSupabaseMcpServer>} = {};

  app.get("/sse", async (req: Request, res: Response) => {
    Logger.log("New SSE connection established");
    
    // Get access token from request header
    const accessToken = req.headers['x-supabase-access-token'] as string;
    
    if (!accessToken) {
      Logger.error('No access token provided in request headers');
      res.status(401).send('Access token required');
      return;
    }

    // Create a new server instance for this session
    const server = createSupabaseMcpServer({
      platform: {
        accessToken,
        apiUrl: 'https://api.supabase.com',
      },
    });
    
    const transport = new SSEServerTransport(
      '/messages',
      res as unknown as ServerResponse<IncomingMessage>
    );
    
    // Store both transport and server for this session
    transports[transport.sessionId] = transport;
    servers[transport.sessionId] = server;
    
    res.on('close', () => {
      Logger.log(`Connection closed for session ${transport.sessionId}`);
      delete transports[transport.sessionId];
      delete servers[transport.sessionId];
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
#!/usr/bin/env node

import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { parseArgs } from 'node:util';
import { createSupabaseMcpServer } from './server.js';
import { env, exit } from 'node:process';
import express, { Request, Response } from 'express';
import { IncomingMessage, ServerResponse } from 'node:http';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';

export const Logger = {
  log: console.log,
  error: console.error,
};

class SupabaseMcpServer {
  private readonly server;
  private sseTransport: SSEServerTransport | null = null;

  constructor(accessToken: string, apiUrl?: string) {
    this.server = createSupabaseMcpServer({
      platform: {
        accessToken,
        apiUrl,
      },
    });
  }

  async connect(transport: Transport): Promise<void> {
    await this.server.connect(transport);
    Logger.log("Server connected and ready to process requests");
  }

  async startHttpServer(port: number, host: string): Promise<void> {
    const app = express();

    app.get("/sse", async (req: Request, res: Response) => {
      Logger.log("New SSE connection established");

      // Create new transport for this connection
      this.sseTransport = new SSEServerTransport(
        "/messages",
        res as unknown as ServerResponse<IncomingMessage>,
      );
      
      // Connect the server to this transport
      await this.connect(this.sseTransport);

      // Clean up on client disconnect
      req.on('close', () => {
        this.sseTransport = null;
      });
    });

    app.post("/messages", async (req: Request, res: Response) => {
      if (!this.sseTransport) {
        res.sendStatus(400);
        return;
      }
      await this.sseTransport.handlePostMessage(
        req as unknown as IncomingMessage,
        res as unknown as ServerResponse<IncomingMessage>,
      );
    });

    app.listen(port, host === 'localhost' ? '0.0.0.0' : host, () => {
      Logger.log(`HTTP server listening on port ${port}`);
      Logger.log(`SSE endpoint available at http://${host}:${port}/sse`);
      Logger.log(`Message endpoint available at http://${host}:${port}/messages`);
    });
  }
}

async function main() {
  const {
    values: { 
      ['access-token']: cliAccessToken, 
      ['api-url']: apiUrl,
      ['port']: port = '3000',
      ['host']: host = 'localhost'
    },
  } = parseArgs({
    options: {
      ['access-token']: {
        type: 'string',
      },
      ['api-url']: {
        type: 'string',
      },
      ['port']: {
        type: 'string',
      },
      ['host']: {
        type: 'string',
      },
    },
  });

  // Check environment variable first, then fall back to CLI argument
  const accessToken = env.SUPABASE_ACCESS_TOKEN || cliAccessToken;

  if (!accessToken) {
    console.error(
      'Please provide a personal access token (PAT) either through SUPABASE_ACCESS_TOKEN environment variable or --access-token flag'
    );
    exit(1);
  }

  const mcpServer = new SupabaseMcpServer(accessToken, apiUrl);
  await mcpServer.startHttpServer(parseInt(port, 10), host);
}

main().catch(Logger.error);
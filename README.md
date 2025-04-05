# Supabase MCP Server on Phala Cloud

The Supabase MCP Server hosting in TEE on Phala Cloud.

Note the implementation code is fork from [supabase](https://github.com/supabase-community/supabase-mcp/tree/main/packages/mcp-server-supabase), we add docker support make it can be deployed on Phala Cloud. And add transport `sse` support in [./src/sse.ts](./src/sse.ts) to make the server can be hosted remotely.

## Deploy on Phala Cloud

To deploy on Phala Cloud, only thing you need to do is copy the [./docker-compose.yml](./docker-compose.yml) to Phala Cloud deployment dashboard and set environment when deploy it. Head to [Phala Cloud doc](https://docs.phala.network/phala-cloud/getting-started) for more details.

## Build locally

- Build the docker image

```bash
docker build --platform linux/amd64 -t <your image name> .
```

- Run with docker compose

set environment variable ```SUPABASE_ACCESS_TOKEN=your_token_here```. Then issue command to launch it.

```bash
docker compose up
```

- Verify your server

Run `npx @modelcontextprotocol/inspector` (a MCP debug tool) and open its URL in browser. Then connect your server with `sse` URL "http://localhost:3000/sse".

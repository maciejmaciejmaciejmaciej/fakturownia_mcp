import { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import axios from "axios";

const MAIN_SERVER_URL = "https://creative-stardust-4cb99d.netlify.app/.netlify/functions/fakturownia-server";

export const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod === "GET") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        name: "Fakturownia MCP Server - Clients Only",
        version: "1.0.0",
        status: "running",
        focus: "Client management only",
        tools: 5
      }),
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const request = JSON.parse(event.body || "{}");

    const allowedMethods = [
      "fakt_get_clients",
      "fakt_get_client", 
      "fakt_create_client",
      "fakt_update_client",
      "fakt_delete_client"
    ];

    if (request.method === "tools/list") {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: request.id,
          result: {
            tools: [
              {
                name: "fakt_get_clients",
                description: "Get list of clients from Fakturownia",
                inputSchema: {
                  type: "object",
                  properties: {
                    page: { type: "number" },
                    perPage: { type: "number" },
                    name: { type: "string" },
                    email: { type: "string" },
                    taxNo: { type: "string" },
                    domain: { type: "string" },
                    apiToken: { type: "string" }
                  }
                }
              },
              {
                name: "fakt_get_client",
                description: "Get single client by ID",
                inputSchema: {
                  type: "object",
                  properties: {
                    clientId: { type: "number" },
                    domain: { type: "string" },
                    apiToken: { type: "string" }
                  },
                  required: ["clientId"]
                }
              },
              {
                name: "fakt_create_client",
                description: "Create new client in Fakturownia",
                inputSchema: {
                  type: "object",
                  properties: {
                    clientData: { type: "object" },
                    domain: { type: "string" },
                    apiToken: { type: "string" }
                  },
                  required: ["clientData"]
                }
              },
              {
                name: "fakt_update_client",
                description: "Update existing client in Fakturownia",
                inputSchema: {
                  type: "object",
                  properties: {
                    clientId: { type: "number" },
                    clientData: { type: "object" },
                    domain: { type: "string" },
                    apiToken: { type: "string" }
                  },
                  required: ["clientId", "clientData"]
                }
              },
              {
                name: "fakt_delete_client",
                description: "Delete client from Fakturownia",
                inputSchema: {
                  type: "object",
                  properties: {
                    clientId: { type: "number" },
                    domain: { type: "string" },
                    apiToken: { type: "string" }
                  },
                  required: ["clientId"]
                }
              }
            ]
          }
        })
      };
    }

    if (request.method === "tools/call") {
      const toolName = request.params?.name;
      
      if (!allowedMethods.includes(toolName)) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: request.id,
            error: {
              code: -32000,
              message: `Method ${toolName} not allowed in clients-only endpoint`,
            },
          }),
        };
      }
    }

    // Forward to main server
    const response = await axios.post(MAIN_SERVER_URL, request, {
      headers: { "Content-Type": "application/json" },
      timeout: 30000
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response.data),
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32000,
          message: error instanceof Error ? error.message : String(error),
        },
      }),
    };
  }
};

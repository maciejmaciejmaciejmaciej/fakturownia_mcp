import { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import axios from "axios";

// Forward all requests to main server
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
        name: "Fakturownia MCP Server - Essential Tools",
        version: "1.0.0",
        status: "running",
        tools: 8,
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

    // Return simplified tools list for Make.com compatibility
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
                name: "fakt_get_invoices",
                description: "Get list of invoices from Fakturownia",
                inputSchema: {
                  type: "object",
                  properties: {
                    page: { type: "number" },
                    perPage: { type: "number" },
                    period: { type: "string" },
                    domain: { type: "string" },
                    apiToken: { type: "string" }
                  }
                }
              },
              {
                name: "fakt_create_invoice",
                description: "Create new invoice in Fakturownia",
                inputSchema: {
                  type: "object",
                  properties: {
                    invoiceData: { type: "object" },
                    domain: { type: "string" },
                    apiToken: { type: "string" }
                  },
                  required: ["invoiceData"]
                }
              },
              {
                name: "fakt_get_clients",
                description: "Get list of clients from Fakturownia",
                inputSchema: {
                  type: "object",
                  properties: {
                    page: { type: "number" },
                    perPage: { type: "number" },
                    name: { type: "string" },
                    domain: { type: "string" },
                    apiToken: { type: "string" }
                  }
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
                name: "fakt_get_products",
                description: "Get list of products from Fakturownia",
                inputSchema: {
                  type: "object",
                  properties: {
                    page: { type: "number" },
                    perPage: { type: "number" },
                    domain: { type: "string" },
                    apiToken: { type: "string" }
                  }
                }
              },
              {
                name: "fakt_send_invoice_by_email",
                description: "Send invoice by email to client",
                inputSchema: {
                  type: "object",
                  properties: {
                    invoiceId: { type: "number" },
                    emailTo: { type: "string" },
                    domain: { type: "string" },
                    apiToken: { type: "string" }
                  },
                  required: ["invoiceId"]
                }
              },
              {
                name: "fakt_change_invoice_status",
                description: "Update invoice status",
                inputSchema: {
                  type: "object",
                  properties: {
                    invoiceId: { type: "number" },
                    status: { type: "string" },
                    domain: { type: "string" },
                    apiToken: { type: "string" }
                  },
                  required: ["invoiceId", "status"]
                }
              },
              {
                name: "fakt_get_invoice",
                description: "Get single invoice by ID",
                inputSchema: {
                  type: "object",
                  properties: {
                    invoiceId: { type: "number" },
                    domain: { type: "string" },
                    apiToken: { type: "string" }
                  },
                  required: ["invoiceId"]
                }
              }
            ]
          }
        })
      };
    }

    // Forward all other requests to main server
    const response = await axios.post(MAIN_SERVER_URL, request, {
      headers: { "Content-Type": "application/json" },
      timeout: 30000
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response.data)
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
          message: error instanceof Error ? error.message : String(error)
        }
      })
    };
  }
};

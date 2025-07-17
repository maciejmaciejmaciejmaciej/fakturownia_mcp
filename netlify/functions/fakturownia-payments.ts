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
        name: "Fakturownia MCP Server - Payments Only",
        version: "1.0.0",
        status: "running",
        focus: "Payment management only",
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
      "fakt_get_payments",
      "fakt_get_payment",
      "fakt_create_payment",
      "fakt_update_payment",
      "fakt_delete_payment"
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
                name: "fakt_get_payments",
                description: "Get list of payments from Fakturownia",
                inputSchema: {
                  type: "object",
                  properties: {
                    page: { type: "number" },
                    perPage: { type: "number" },
                    invoiceId: { type: "number" },
                    clientId: { type: "number" },
                    domain: { type: "string" },
                    apiToken: { type: "string" }
                  }
                }
              },
              {
                name: "fakt_get_payment",
                description: "Get single payment by ID",
                inputSchema: {
                  type: "object",
                  properties: {
                    paymentId: { type: "number" },
                    domain: { type: "string" },
                    apiToken: { type: "string" }
                  },
                  required: ["paymentId"]
                }
              },
              {
                name: "fakt_create_payment",
                description: "Create new payment in Fakturownia",
                inputSchema: {
                  type: "object",
                  properties: {
                    paymentData: { type: "object" },
                    domain: { type: "string" },
                    apiToken: { type: "string" }
                  },
                  required: ["paymentData"]
                }
              },
              {
                name: "fakt_update_payment",
                description: "Update existing payment in Fakturownia",
                inputSchema: {
                  type: "object",
                  properties: {
                    paymentId: { type: "number" },
                    paymentData: { type: "object" },
                    domain: { type: "string" },
                    apiToken: { type: "string" }
                  },
                  required: ["paymentId", "paymentData"]
                }
              },
              {
                name: "fakt_delete_payment",
                description: "Delete payment from Fakturownia",
                inputSchema: {
                  type: "object",
                  properties: {
                    paymentId: { type: "number" },
                    domain: { type: "string" },
                    apiToken: { type: "string" }
                  },
                  required: ["paymentId"]
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
              message: `Method ${toolName} not allowed in payments-only endpoint`,
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

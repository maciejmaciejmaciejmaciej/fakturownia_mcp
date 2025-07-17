import { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import axios from "axios";

// Import głównej logiki z fakturownia-server
const MAIN_SERVER_URL = "https://creative-stardust-4cb99d.netlify.app/.netlify/functions/fakturownia-server";

export const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  // Enable CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json",
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  // Handle GET requests for health check
  if (event.httpMethod === "GET") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        name: "Fakturownia MCP Server - Invoices Only",
        version: "1.0.0",
        status: "running",
        focus: "Invoice management only",
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
    // Parse the request
    const request = JSON.parse(event.body || "{}");

    // Only allow invoice-related methods
    const allowedMethods = [
      "get_invoices",
      "get_invoice", 
      "create_invoice",
      "update_invoice",
      "delete_invoice",
      "send_invoice_by_email",
      "change_invoice_status",
      "get_invoice_pdf"
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
                name: "get_invoices",
                description: "Get list of invoices from Fakturownia",
                inputSchema: {
                  type: "object",
                  properties: {
                    page: { type: "number" },
                    perPage: { type: "number" },
                    period: { type: "string" },
                    includePositions: { type: "boolean" },
                    filters: { type: "object" },
                  },
                },
              },
              {
                name: "get_invoice",
                description: "Get single invoice by ID",
                inputSchema: {
                  type: "object",
                  properties: { invoiceId: { type: "number" } },
                  required: ["invoiceId"],
                },
              },
              {
                name: "create_invoice",
                description: "Create new invoice",
                inputSchema: {
                  type: "object",
                  properties: { invoiceData: { type: "object" } },
                  required: ["invoiceData"],
                },
              },
              {
                name: "send_invoice_by_email",
                description: "Send invoice by email to client",
                inputSchema: {
                  type: "object",
                  properties: {
                    invoiceId: { type: "number" },
                    emailTo: { type: "string" },
                  },
                  required: ["invoiceId"],
                },
              }
            ],
          },
        }),
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
              message: `Method ${toolName} not allowed in invoices-only endpoint`,
            },
          }),
        };
      }
    }

    // Forward to main server
    const response = await axios.post(MAIN_SERVER_URL, request, {
      headers: {
        "Content-Type": "application/json",
      },
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

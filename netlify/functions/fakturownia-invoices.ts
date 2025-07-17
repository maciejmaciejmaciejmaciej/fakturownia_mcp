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
        name: "Fakturownia MCP Server - Invoices Only",
        version: "1.0.0",
        status: "running",
        focus: "Invoice management only",
        tools: 8
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
      "fakt_inv_get_invoices",
      "fakt_inv_get_invoice",
      "fakt_inv_create_invoice",
      "fakt_inv_update_invoice",
      "fakt_inv_delete_invoice",
      "fakt_inv_send_invoice_by_email",
      "fakt_inv_change_invoice_status",
      "fakt_inv_get_invoice_pdf"
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
                name: "fakt_inv_get_invoices",
                description: "Get list of invoices from Fakturownia",
                inputSchema: {
                  type: "object",
                  properties: {
                    page: { type: "number" },
                    perPage: { type: "number" },
                    period: { type: "string" },
                    includePositions: { type: "boolean" },
                    filters: { type: "object" },
                    domain: { type: "string" },
                    apiToken: { type: "string" }
                  }
                }
              },
              {
                name: "fakt_inv_get_invoice",
                description: "Get single invoice by ID from Fakturownia",
                inputSchema: {
                  type: "object",
                  properties: {
                    invoiceId: { type: "number" },
                    domain: { type: "string" },
                    apiToken: { type: "string" }
                  },
                  required: ["invoiceId"]
                }
              },
              {
                name: "fakt_inv_create_invoice",
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
                name: "fakt_inv_update_invoice",
                description: "Update existing invoice in Fakturownia",
                inputSchema: {
                  type: "object",
                  properties: {
                    invoiceId: { type: "number" },
                    invoiceData: { type: "object" },
                    domain: { type: "string" },
                    apiToken: { type: "string" }
                  },
                  required: ["invoiceId", "invoiceData"]
                }
              },
              {
                name: "fakt_inv_delete_invoice",
                description: "Delete invoice from Fakturownia",
                inputSchema: {
                  type: "object",
                  properties: {
                    invoiceId: { type: "number" },
                    domain: { type: "string" },
                    apiToken: { type: "string" }
                  },
                  required: ["invoiceId"]
                }
              },
              {
                name: "fakt_inv_send_invoice_by_email",
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
                name: "fakt_inv_change_invoice_status",
                description: "Change invoice status in Fakturownia",
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
                name: "fakt_inv_get_invoice_pdf",
                description: "Get invoice PDF from Fakturownia",
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

      // Map new names back to original names for main server
      const nameMapping = {
        "fakt_inv_get_invoices": "fakt_get_invoices",
        "fakt_inv_get_invoice": "fakt_get_invoice",
        "fakt_inv_create_invoice": "fakt_create_invoice",
        "fakt_inv_update_invoice": "fakt_update_invoice",
        "fakt_inv_delete_invoice": "fakt_delete_invoice",
        "fakt_inv_send_invoice_by_email": "fakt_send_invoice_by_email",
        "fakt_inv_change_invoice_status": "fakt_change_invoice_status",
        "fakt_inv_get_invoice_pdf": "fakt_get_invoice_pdf"
      };

      // Replace the tool name with mapped name before forwarding
      const mappedRequest = {
        ...request,
        params: {
          ...request.params,
          name: nameMapping[toolName] || toolName
        }
      };

      // Forward modified request to main server
      const response = await axios.post(MAIN_SERVER_URL, mappedRequest, {
        headers: { "Content-Type": "application/json" },
        timeout: 30000
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(response.data),
      };
    }

    // Forward to main server (only for non-tools/call requests)
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

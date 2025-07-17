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
        name: "Fakturownia MCP Server - Products Only",
        version: "1.0.0",
        status: "running",
        focus: "Product management only",
        tools: 4
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
      "fakt_get_products",
      "fakt_get_product", 
      "fakt_create_product",
      "fakt_update_product"
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
                name: "fakt_get_products",
                description: "Get list of products from Fakturownia",
                inputSchema: {
                  type: "object",
                  properties: {
                    page: { type: "number" },
                    perPage: { type: "number" },
                    warehouseId: { type: "number" },
                    domain: { type: "string" },
                    apiToken: { type: "string" }
                  }
                }
              },
              {
                name: "fakt_get_product",
                description: "Get single product by ID",
                inputSchema: {
                  type: "object",
                  properties: {
                    productId: { type: "number" },
                    warehouseId: { type: "number" },
                    domain: { type: "string" },
                    apiToken: { type: "string" }
                  },
                  required: ["productId"]
                }
              },
              {
                name: "fakt_create_product",
                description: "Create new product in Fakturownia",
                inputSchema: {
                  type: "object",
                  properties: {
                    productData: { type: "object" },
                    domain: { type: "string" },
                    apiToken: { type: "string" }
                  },
                  required: ["productData"]
                }
              },
              {
                name: "fakt_update_product",
                description: "Update existing product in Fakturownia",
                inputSchema: {
                  type: "object",
                  properties: {
                    productId: { type: "number" },
                    productData: { type: "object" },
                    domain: { type: "string" },
                    apiToken: { type: "string" }
                  },
                  required: ["productId", "productData"]
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
              message: `Method ${toolName} not allowed in products-only endpoint`,
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

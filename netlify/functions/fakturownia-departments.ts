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
        name: "Fakturownia MCP Server - Departments & Categories",
        version: "1.0.0",
        status: "running",
        tools: 12,
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

    // Return departments & categories tools list for Make.com compatibility
    if (request.method === "tools/list") {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: request.id,
          result: {
            tools: [
              // DEPARTMENTS
              {
                name: "fakt_dept_get_departments",
                description: "Get list of departments from Fakturownia",
                inputSchema: {
                  type: "object",
                  properties: {
                    domain: { type: "string" },
                    apiToken: { type: "string" }
                  }
                }
              },
              {
                name: "fakt_dept_get_department",
                description: "Get single department by ID",
                inputSchema: {
                  type: "object",
                  properties: {
                    departmentId: { type: "number" },
                    domain: { type: "string" },
                    apiToken: { type: "string" }
                  },
                  required: ["departmentId"]
                }
              },
              {
                name: "fakt_dept_create_department",
                description: "Create new department in Fakturownia",
                inputSchema: {
                  type: "object",
                  properties: {
                    departmentData: { type: "object" },
                    domain: { type: "string" },
                    apiToken: { type: "string" }
                  },
                  required: ["departmentData"]
                }
              },
              {
                name: "fakt_dept_update_department",
                description: "Update existing department in Fakturownia",
                inputSchema: {
                  type: "object",
                  properties: {
                    departmentId: { type: "number" },
                    departmentData: { type: "object" },
                    domain: { type: "string" },
                    apiToken: { type: "string" }
                  },
                  required: ["departmentId", "departmentData"]
                }
              },
              {
                name: "fakt_dept_delete_department",
                description: "Delete department in Fakturownia",
                inputSchema: {
                  type: "object",
                  properties: {
                    departmentId: { type: "number" },
                    domain: { type: "string" },
                    apiToken: { type: "string" }
                  },
                  required: ["departmentId"]
                }
              },
              // CATEGORIES
              {
                name: "fakt_dept_get_categories",
                description: "Get list of categories from Fakturownia",
                inputSchema: {
                  type: "object",
                  properties: {
                    domain: { type: "string" },
                    apiToken: { type: "string" }
                  }
                }
              },
              {
                name: "fakt_dept_get_category",
                description: "Get single category by ID",
                inputSchema: {
                  type: "object",
                  properties: {
                    categoryId: { type: "number" },
                    domain: { type: "string" },
                    apiToken: { type: "string" }
                  },
                  required: ["categoryId"]
                }
              },
              {
                name: "fakt_create_category",
                description: "Create new category in Fakturownia",
                inputSchema: {
                  type: "object",
                  properties: {
                    categoryData: { type: "object" },
                    domain: { type: "string" },
                    apiToken: { type: "string" }
                  },
                  required: ["categoryData"]
                }
              },
              {
                name: "fakt_update_category",
                description: "Update existing category in Fakturownia",
                inputSchema: {
                  type: "object",
                  properties: {
                    categoryId: { type: "number" },
                    categoryData: { type: "object" },
                    domain: { type: "string" },
                    apiToken: { type: "string" }
                  },
                  required: ["categoryId", "categoryData"]
                }
              },
              {
                name: "fakt_delete_category",
                description: "Delete category in Fakturownia",
                inputSchema: {
                  type: "object",
                  properties: {
                    categoryId: { type: "number" },
                    domain: { type: "string" },
                    apiToken: { type: "string" }
                  },
                  required: ["categoryId"]
                }
              },
              // INVOICE ASSIGNMENT
              {
                name: "fakt_get_invoice",
                description: "Get single invoice by ID (with category/department)",
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
                name: "fakt_update_invoice",
                description: "Assign category or department to invoice",
                inputSchema: {
                  type: "object",
                  properties: {
                    invoiceId: { type: "number" },
                    invoiceData: { type: "object" }, // e.g. { category_id: 123, department_id: 456 }
                    domain: { type: "string" },
                    apiToken: { type: "string" }
                  },
                  required: ["invoiceId", "invoiceData"]
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

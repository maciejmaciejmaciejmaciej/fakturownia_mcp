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
        name: "Fakturownia MCP Server - Categories & Departments",
        version: "1.0.0",
        status: "running",
        focus: "Category and department management + invoice assignment",
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

    // Only allow category, department and invoice assignment methods
    const allowedMethods = [
      "fakt_cat_get_categories",
      "fakt_cat_get_category", 
      "fakt_cat_create_category",
      "fakt_cat_update_category",
      "fakt_cat_delete_category",
      "fakt_cat_get_departments",
      "fakt_cat_get_department",
      "fakt_cat_create_department", 
      "fakt_cat_update_department",
      "fakt_cat_delete_department",
      "fakt_cat_get_invoice",
      "fakt_cat_update_invoice"
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
              // CATEGORIES
              {
                name: "fakt_cat_get_categories",
                description: "Get list of categories from Fakturownia",
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
                name: "fakt_cat_get_category",
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
                name: "fakt_cat_create_category",
                description: "Create new category in Fakturownia",
                inputSchema: {
                  type: "object",
                  properties: {
                    categoryData: { 
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        description: { type: "string" }
                      },
                      required: ["name"]
                    },
                    domain: { type: "string" },
                    apiToken: { type: "string" }
                  },
                  required: ["categoryData"]
                }
              },
              {
                name: "fakt_cat_update_category",
                description: "Update existing category",
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
                name: "fakt_cat_delete_category",
                description: "Delete category",
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

              // DEPARTMENTS  
              {
                name: "fakt_cat_get_departments",
                description: "Get list of departments from Fakturownia",
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
                name: "fakt_cat_get_department",
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
                name: "fakt_cat_create_department",
                description: "Create new department in Fakturownia",
                inputSchema: {
                  type: "object",
                  properties: {
                    departmentData: { 
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        shortcut: { type: "string" },
                        description: { type: "string" }
                      },
                      required: ["name"]
                    },
                    domain: { type: "string" },
                    apiToken: { type: "string" }
                  },
                  required: ["departmentData"]
                }
              },
              {
                name: "fakt_cat_update_department",
                description: "Update existing department",
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
                name: "fakt_cat_delete_department",
                description: "Delete department",
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

              // INVOICE ASSIGNMENT
              {
                name: "fakt_cat_get_invoice",
                description: "Get invoice details to check current category",
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
                name: "fakt_cat_update_invoice",
                description: "Update invoice to assign category or department",
                inputSchema: {
                  type: "object",
                  properties: {
                    invoiceId: { type: "number" },
                    invoiceData: { 
                      type: "object",
                      properties: {
                        category_id: { type: "number" },
                        department_id: { type: "number" }
                      }
                    },
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
              message: `Method ${toolName} not allowed in categories-departments endpoint. Available: ${allowedMethods.join(', ')}`,
            },
          }),
        };
      }
    }

    // Forward all allowed requests to main server
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

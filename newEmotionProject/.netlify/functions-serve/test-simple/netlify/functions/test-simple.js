// netlify/functions/test-simple.js
exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }
  if (event.httpMethod === "POST") {
    try {
      const body = JSON.parse(event.body || "{}");
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: "Function working",
          received: body,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        })
      };
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: error.message,
          stack: error.stack
        })
      };
    }
  }
  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: "Method Not Allowed" })
  };
};
//# sourceMappingURL=test-simple.js.map

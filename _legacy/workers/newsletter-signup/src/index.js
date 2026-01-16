/**
 * Newsletter Signup Worker
 * Handles newsletter signups and forwards them to Google Apps Script
 * which writes to Google Sheets
 *
 * This approach avoids the complexity of Workload Identity Federation
 * and service account keys by using Google Apps Script as an intermediary.
 */

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return handleCORS(request, env);
    }

    // Only accept POST
    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405, request, env);
    }

    try {
      const { email } = await request.json();

      // Validate email
      if (!email || !isValidEmail(email)) {
        return jsonResponse(
          { error: "Please enter a valid email address" },
          400,
          request,
          env,
        );
      }

      // Normalize email
      const normalizedEmail = email.toLowerCase().trim();

      // Check if Apps Script URL is configured
      if (!env.GOOGLE_APPS_SCRIPT_URL) {
        console.error("GOOGLE_APPS_SCRIPT_URL secret not configured");
        return jsonResponse(
          { error: "Service not configured. Please try again later." },
          500,
          request,
          env,
        );
      }

      // Forward to Google Apps Script
      const result = await forwardToAppsScript(env, normalizedEmail);

      if (result.success) {
        return jsonResponse(
          {
            success: true,
            message:
              "Thanks for signing up! We'll let you know when we launch.",
          },
          200,
          request,
          env,
        );
      } else {
        console.error("Apps Script error:", result.error);
        return jsonResponse(
          { error: "Something went wrong. Please try again." },
          500,
          request,
          env,
        );
      }
    } catch (error) {
      console.error("Error:", error.message, error.stack);
      return jsonResponse(
        { error: "Something went wrong. Please try again." },
        500,
        request,
        env,
      );
    }
  },
};

/**
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Get allowed origin for CORS
 */
function getAllowedOrigin(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowedOrigins = (env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim());

  if (allowedOrigins.includes(origin)) {
    return origin;
  }
  // Return first allowed origin as fallback (won't match but is safe)
  return allowedOrigins[0] || "";
}

/**
 * Handle CORS preflight requests
 */
function handleCORS(request, env) {
  const origin = getAllowedOrigin(request, env);
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}

/**
 * Create JSON response with CORS headers
 */
function jsonResponse(data, status, request, env) {
  const origin = getAllowedOrigin(request, env);
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin,
    },
  });
}

/**
 * Forward email signup to Google Apps Script
 */
async function forwardToAppsScript(env, email) {
  try {
    const response = await fetch(env.GOOGLE_APPS_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        timestamp: new Date().toISOString(),
        source: "coming-soon-page",
      }),
    });

    // Apps Script returns a redirect on success, or JSON
    // Handle both cases
    if (response.ok || response.status === 302) {
      // Try to parse response if it's JSON
      try {
        const data = await response.json();
        return { success: data.success !== false, error: data.error };
      } catch {
        // If not JSON, assume success (Apps Script often returns HTML on success)
        return { success: true };
      }
    }

    return { success: false, error: `HTTP ${response.status}` };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

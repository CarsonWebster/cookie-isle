/**
 * Newsletter Signup Worker
 * Handles newsletter signups and forwards them to Google Apps Script
 * which writes to Google Sheets
 *
 * Also handles unsubscribe requests with HMAC token verification
 *
 * Environment variables required:
 * - GOOGLE_APPS_SCRIPT_URL: The deployed Apps Script web app URL
 * - ALLOWED_ORIGINS: Comma-separated list of allowed origins for CORS
 * - UNSUBSCRIBE_SECRET: Secret key for HMAC token generation/verification
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return handleCORS(request, env);
    }

    // Route: GET /unsubscribe - Handle unsubscribe requests
    if (request.method === "GET" && url.pathname === "/unsubscribe") {
      return handleUnsubscribe(request, env);
    }

    // Route: POST / - Handle newsletter signups
    if (request.method === "POST") {
      return handleSignup(request, env);
    }

    // Method not allowed for other routes
    return jsonResponse({ error: "Method not allowed" }, 405, request, env);
  },
};

// ============================================================================
// SIGNUP HANDLER
// ============================================================================

/**
 * Handle newsletter signup POST requests
 */
async function handleSignup(request, env) {
  try {
    const { email, first_name } = await request.json();

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

    // Normalize first name (trim whitespace, title case optional)
    const normalizedFirstName = first_name ? first_name.trim() : "";

    // Forward to Google Apps Script
    const result = await forwardToAppsScript(env, normalizedEmail, "signup", {
      first_name: normalizedFirstName,
    });

    if (result.success) {
      // Check if this was a duplicate (already subscribed)
      if (result.duplicate) {
        return jsonResponse(
          {
            success: true,
            message: "This email is already signed up!",
            duplicate: true,
          },
          200,
          request,
          env,
        );
      }

      // Check if this was a resubscribe (previously unsubscribed)
      if (result.resubscribed) {
        return jsonResponse(
          {
            success: true,
            message:
              "Welcome back! You've been resubscribed to our newsletter.",
            resubscribed: true,
          },
          200,
          request,
          env,
        );
      }

      // New signup
      return jsonResponse(
        {
          success: true,
          message: "Thanks for signing up! We'll let you know when we launch.",
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
}

// ============================================================================
// UNSUBSCRIBE HANDLER
// ============================================================================

/**
 * Handle unsubscribe GET requests
 * URL format: /unsubscribe?email=xxx&token=xxx
 */
async function handleUnsubscribe(request, env) {
  const url = new URL(request.url);
  const email = url.searchParams.get("email");
  const token = url.searchParams.get("token");

  // Validate required parameters
  if (!email || !token) {
    return htmlResponse(
      generateUnsubscribePage({
        success: false,
        title: "Invalid Link",
        message: "This unsubscribe link is invalid or incomplete.",
      }),
      400,
    );
  }

  // Decode email (it's URL encoded)
  const decodedEmail = decodeURIComponent(email).toLowerCase().trim();

  // Check if secret is configured
  if (!env.UNSUBSCRIBE_SECRET) {
    console.error("UNSUBSCRIBE_SECRET not configured");
    return htmlResponse(
      generateUnsubscribePage({
        success: false,
        title: "Service Error",
        message: "Unsubscribe service is not properly configured.",
      }),
      500,
    );
  }

  // Verify the token
  const isValid = await verifyUnsubscribeToken(
    decodedEmail,
    token,
    env.UNSUBSCRIBE_SECRET,
  );

  if (!isValid) {
    return htmlResponse(
      generateUnsubscribePage({
        success: false,
        title: "Invalid Link",
        message:
          "This unsubscribe link is invalid or has expired. Please use the link from your most recent email.",
      }),
      400,
    );
  }

  // Check if Apps Script URL is configured
  if (!env.GOOGLE_APPS_SCRIPT_URL) {
    console.error("GOOGLE_APPS_SCRIPT_URL not configured");
    return htmlResponse(
      generateUnsubscribePage({
        success: false,
        title: "Service Error",
        message: "Service is not properly configured.",
      }),
      500,
    );
  }

  // Forward unsubscribe request to Apps Script
  const result = await forwardToAppsScript(env, decodedEmail, "unsubscribe");

  if (result.success) {
    return htmlResponse(
      generateUnsubscribePage({
        success: true,
        title: "Unsubscribed Successfully",
        message: `You have been unsubscribed from our newsletter. You will no longer receive emails at ${decodedEmail}.`,
        email: decodedEmail,
      }),
      200,
    );
  } else {
    console.error("Apps Script unsubscribe error:", result.error);

    // Check if email wasn't found
    if (result.error === "Email not found") {
      return htmlResponse(
        generateUnsubscribePage({
          success: false,
          title: "Email Not Found",
          message: `The email address ${decodedEmail} was not found in our subscriber list.`,
        }),
        404,
      );
    }

    return htmlResponse(
      generateUnsubscribePage({
        success: false,
        title: "Something Went Wrong",
        message:
          "We couldn't process your unsubscribe request. Please try again later.",
      }),
      500,
    );
  }
}

// ============================================================================
// TOKEN FUNCTIONS
// ============================================================================

/**
 * Generate HMAC-SHA256 token for unsubscribe link
 * @param {string} email - The subscriber's email
 * @param {string} secret - The secret key
 * @returns {Promise<string>} - Base64url encoded token
 */
async function generateUnsubscribeToken(email, secret) {
  const encoder = new TextEncoder();
  const data = encoder.encode(email.toLowerCase().trim());
  const keyData = encoder.encode(secret);

  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", key, data);
  const hashArray = Array.from(new Uint8Array(signature));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Return first 32 characters for a shorter URL
  return hashHex.substring(0, 32);
}

/**
 * Verify HMAC token for unsubscribe request
 * @param {string} email - The subscriber's email
 * @param {string} token - The token from the URL
 * @param {string} secret - The secret key
 * @returns {Promise<boolean>} - Whether the token is valid
 */
async function verifyUnsubscribeToken(email, token, secret) {
  const expectedToken = await generateUnsubscribeToken(email, secret);
  return token === expectedToken;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

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
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
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
 * Create HTML response
 */
function htmlResponse(html, status) {
  return new Response(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

/**
 * Forward email signup or unsubscribe to Google Apps Script
 */
async function forwardToAppsScript(
  env,
  email,
  action = "signup",
  extraData = {},
) {
  try {
    const payload = {
      email: email,
      timestamp: new Date().toISOString(),
      action: action,
    };

    if (action === "signup") {
      payload.source = "coming-soon-page";
      // Include first_name if provided
      if (extraData.first_name) {
        payload.first_name = extraData.first_name;
      }
    }

    const response = await fetch(env.GOOGLE_APPS_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // Apps Script returns a redirect on success, or JSON
    // Handle both cases
    if (response.ok || response.status === 302) {
      // Try to parse response if it's JSON
      try {
        const data = await response.json();
        return {
          success: data.success !== false,
          error: data.error,
          message: data.message,
          duplicate: data.duplicate || false,
          resubscribed: data.resubscribed || false,
        };
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

/**
 * Generate the unsubscribe confirmation HTML page
 */
function generateUnsubscribePage({ success, title, message, email }) {
  const colors = {
    primary: "#2A9D8F",
    secondary: "#5C4033",
    tertiary: "#FBF8F3",
    tertiaryMedium: "#E8E4DC",
    accent: "#E9B44C",
    textLight: "#5D6B6A",
    success: "#2A9D8F",
    error: "#DC3545",
  };

  const iconSvg = success
    ? `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="${colors.success}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
       </svg>`
    : `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="${colors.error}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
       </svg>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - The Cookie Isle</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, ${colors.tertiary} 0%, ${colors.tertiaryMedium} 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.1);
      max-width: 480px;
      width: 100%;
      padding: 48px 32px;
      text-align: center;
    }
    .icon {
      margin-bottom: 24px;
    }
    h1 {
      color: ${colors.secondary};
      font-size: 24px;
      margin-bottom: 16px;
    }
    p {
      color: ${colors.textLight};
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .email {
      color: ${colors.primary};
      font-weight: 600;
    }
    .button {
      display: inline-block;
      background: ${colors.accent};
      color: ${colors.secondary};
      text-decoration: none;
      font-weight: bold;
      padding: 14px 32px;
      border-radius: 30px;
      font-size: 16px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .footer {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid ${colors.tertiaryMedium};
      color: ${colors.textLight};
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">
      ${iconSvg}
    </div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="https://thecookieisle.com" class="button">Visit Our Website</a>
    <div class="footer">
      <p>The Cookie Isle &bull; Fresh Baked Happiness</p>
    </div>
  </div>
</body>
</html>`;
}

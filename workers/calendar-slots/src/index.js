/**
 * Calendar Slots Worker
 * Fetches and parses Google Calendar iCal feed for fulfillment time slots
 *
 * Returns available "Drop Window" events as JSON for the checkout page
 * to display pickup/delivery time slot options.
 */

export default {
    async fetch(request, env, ctx) {
        // Handle CORS preflight
        if (request.method === "OPTIONS") {
            return handleCORS(request, env);
        }

        // Only accept GET
        if (request.method !== "GET") {
            return jsonResponse({ error: "Method not allowed" }, 405, request, env);
        }

        try {
            // Check if iCal URL is configured
            if (!env.CALENDAR_ICAL_URL) {
                console.error("CALENDAR_ICAL_URL not configured");
                return jsonResponse(
                    { error: "Calendar not configured", slots: [] },
                    500,
                    request,
                    env
                );
            }

            // Fetch and parse the calendar
            const slots = await fetchAndParseCalendar(env);

            return jsonResponse(
                {
                    success: true,
                    slots: slots,
                    fetchedAt: new Date().toISOString(),
                },
                200,
                request,
                env
            );
        } catch (error) {
            console.error("Error:", error.message, error.stack);
            return jsonResponse(
                { error: "Failed to fetch calendar", slots: [] },
                500,
                request,
                env
            );
        }
    },
};

/**
 * Fetch iCal feed and parse into slot objects
 */
async function fetchAndParseCalendar(env) {
    const response = await fetch(env.CALENDAR_ICAL_URL);

    if (!response.ok) {
        throw new Error(`Failed to fetch iCal: ${response.status}`);
    }

    const icalData = await response.text();
    const events = parseICalEvents(icalData, env.EVENT_PREFIX || "Drop Window");

    // Filter to future events only and sort by date
    const now = new Date();
    const futureEvents = events
        .filter((event) => event.startDate > now)
        .sort((a, b) => a.startDate - b.startDate);

    // Convert to slot format
    return futureEvents.map((event) => formatSlot(event));
}

/**
 * Parse iCal data into event objects
 * Simple parser for Google Calendar iCal format
 */
function parseICalEvents(icalData, eventPrefix) {
    const events = [];
    const lines = icalData.replace(/\r\n /g, "").split(/\r?\n/);

    let currentEvent = null;

    for (const line of lines) {
        if (line === "BEGIN:VEVENT") {
            currentEvent = {};
        } else if (line === "END:VEVENT") {
            if (currentEvent && currentEvent.summary) {
                // Check if this is a Drop Window event
                if (currentEvent.summary.startsWith(eventPrefix)) {
                    events.push(currentEvent);
                }
            }
            currentEvent = null;
        } else if (currentEvent) {
            // Parse event properties
            const colonIndex = line.indexOf(":");
            if (colonIndex > 0) {
                const key = line.substring(0, colonIndex).split(";")[0]; // Handle params like DTSTART;TZID=...
                const value = line.substring(colonIndex + 1);

                switch (key) {
                    case "SUMMARY":
                        currentEvent.summary = unescapeICalText(value);
                        break;
                    case "DTSTART":
                        currentEvent.startDate = parseICalDate(value, line);
                        break;
                    case "DTEND":
                        currentEvent.endDate = parseICalDate(value, line);
                        break;
                    case "DESCRIPTION":
                        currentEvent.description = unescapeICalText(value);
                        break;
                    case "UID":
                        currentEvent.uid = value;
                        break;
                }
            }
        }
    }

    return events;
}

/**
 * Parse iCal date format
 * Handles both DATE and DATETIME formats
 */
function parseICalDate(value, fullLine) {
    // Extract timezone if present (DTSTART;TZID=America/Los_Angeles:20241221T100000)
    let dateStr = value;

    // Handle all-day events (DATE format: 20241221)
    if (dateStr.length === 8) {
        const year = parseInt(dateStr.substring(0, 4));
        const month = parseInt(dateStr.substring(4, 6)) - 1;
        const day = parseInt(dateStr.substring(6, 8));
        return new Date(year, month, day);
    }

    // Handle datetime format (20241221T100000 or 20241221T100000Z)
    if (dateStr.includes("T")) {
        const isUTC = dateStr.endsWith("Z");
        dateStr = dateStr.replace("Z", "");

        const year = parseInt(dateStr.substring(0, 4));
        const month = parseInt(dateStr.substring(4, 6)) - 1;
        const day = parseInt(dateStr.substring(6, 8));
        const hour = parseInt(dateStr.substring(9, 11));
        const minute = parseInt(dateStr.substring(11, 13));
        const second = parseInt(dateStr.substring(13, 15)) || 0;

        if (isUTC) {
            return new Date(Date.UTC(year, month, day, hour, minute, second));
        } else {
            // For non-UTC times, we create a date string and let the browser handle timezone
            // This is approximate but works for display purposes
            return new Date(year, month, day, hour, minute, second);
        }
    }

    // Fallback
    return new Date(value);
}

/**
 * Unescape iCal text (handles \n, \,, etc.)
 */
function unescapeICalText(text) {
    return text
        .replace(/\\n/g, "\n")
        .replace(/\\,/g, ",")
        .replace(/\\\\/g, "\\");
}

/**
 * Format an event into a slot object for the frontend
 */
function formatSlot(event) {
    const startDate = event.startDate;
    const endDate = event.endDate || new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // Default 2 hour window

    // Determine slot type from title (e.g., "Drop Window - Pickup" -> "pickup")
    let type = "both";
    const summary = event.summary.toLowerCase();
    if (summary.includes("pickup") && !summary.includes("delivery")) {
        type = "pickup";
    } else if (summary.includes("delivery") && !summary.includes("pickup")) {
        type = "delivery";
    }

    // Format date for display
    const dateOptions = { weekday: "long", month: "long", day: "numeric" };
    const timeOptions = { hour: "numeric", minute: "2-digit" };

    return {
        id: event.uid || `${startDate.toISOString()}-${type}`,
        date: startDate.toISOString().split("T")[0], // YYYY-MM-DD
        dateFormatted: startDate.toLocaleDateString("en-US", dateOptions),
        startTime: startDate.toLocaleTimeString("en-US", timeOptions),
        endTime: endDate.toLocaleTimeString("en-US", timeOptions),
        startTimestamp: startDate.toISOString(),
        endTimestamp: endDate.toISOString(),
        type: type,
        title: event.summary,
        description: event.description || "",
    };
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

    // Allow subdomains/aliases for preview environments
    // This allows any subdomain of cookieisle.com, thecookieisle.com, and cookie-isle.pages.dev
    try {
        const url = new URL(origin);
        const hostname = url.hostname;
        if (hostname.endsWith("cookieisle.com") || 
            hostname.endsWith("thecookieisle.com") || 
            hostname.endsWith("cookie-isle.pages.dev") || 
            hostname === "localhost" || 
            hostname === "127.0.0.1") {
            return origin;
        }
    } catch (e) {
        // Invalid origin URL, ignore
    }

    // Return first allowed origin as fallback
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
            "Access-Control-Allow-Methods": "GET, OPTIONS",
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
            "Cache-Control": `public, max-age=${env.CACHE_TTL || 300}`,
        },
    });
}

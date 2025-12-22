import Stripe from "stripe";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Stripe-Signature",
};

export default {
    async fetch(request, env, ctx) {
        if (request.method === "OPTIONS") {
            return handleOptions(request, env);
        }

        const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
            apiVersion: "2023-10-16",
        });

        const url = new URL(request.url);

        if (request.method === "POST" && url.pathname === "/session") {
            return handleCreateSession(request, env, stripe);
        }

        if (request.method === "POST" && url.pathname === "/webhook") {
            return handleWebhook(request, env, stripe);
        }

        return new Response("Not Found", { status: 404 });
    },
};

// ... CORS Helper ...
function handleOptions(request, env) {
    const origin = request.headers.get("Origin");
    const allowedOrigins = (env.ALLOWED_ORIGINS || "").split(",");

    if (allowedOrigins.includes(origin) || env.ALLOWED_ORIGINS === "*") {
        return new Response(null, {
            headers: {
                ...corsHeaders,
                "Access-Control-Allow-Origin": origin,
            }
        });
    }
    return new Response(null, { headers: corsHeaders });
}

// ... Session Creation ...
async function handleCreateSession(request, env, stripe) {
    try {
        const origin = request.headers.get("Origin");
        const allowedOrigins = (env.ALLOWED_ORIGINS || "").split(",");

        if (!allowedOrigins.includes(origin) && env.ALLOWED_ORIGINS !== "*") {
            return new Response("Forbidden", { status: 403 });
        }

        const { order: items, fulfillment, customer } = await request.json();

        if (!items || items.length === 0) {
            return new Response(JSON.stringify({ error: "Empty cart" }), {
                status: 400,
                headers: { ...corsHeaders, "Access-Control-Allow-Origin": origin },
            });
        }

        const lineItems = items.map((item) => {
            if (!item.price_id) {
                throw new Error(`Missing price_id for ${item.product}`);
            }
            return {
                price: item.price_id,
                quantity: item.qty,
            };
        });

        const metadata = {
            fulfillment_type: fulfillment.type,
            customer_email: customer.email,
            customer_name: `${customer.first_name} ${customer.last_name}`,
            customer_phone: customer.phone,
            pickup_time: fulfillment.slot ? `${fulfillment.slot.date} ${fulfillment.slot.startTime}` : "N/A",
            delivery_address: fulfillment.type === 'delivery' ?
                `${fulfillment.address.street}, ${fulfillment.address.city}, ${fulfillment.address.zip}` :
                "N/A",
            // Flatten items for sheet logging (simplified)
            items_summary: items.map(i => `${i.qty}x ${i.product}`).join(", ")
        };

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: lineItems,
            mode: "payment",
            success_url: `${env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${env.FRONTEND_URL}/checkout/cancel`,
            metadata: metadata,
            customer_email: customer.email,
        });

        return new Response(JSON.stringify({ url: session.url }), {
            headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": origin
            },
        });

    } catch (err) {
        console.error("Stripe Error:", err);
        let status = 500;
        let errorResponse = { error: "Internal Server Error", message: err.message };

        if (err.type === 'StripeInvalidRequestError' || err.code === 'resource_missing') {
            status = 400;
            errorResponse = { error: "INVALID_CART", message: "Invalid items in cart." };
            if (err.message) errorResponse.message = err.message;
        }

        if (err.raw && err.raw.message && err.raw.message.includes("inventory")) {
            status = 409;
            errorResponse = { error: "SOLD_OUT", message: err.raw.message };
        }

        return new Response(JSON.stringify(errorResponse), {
            status: status,
            headers: { ...corsHeaders, "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
    }
}

/**
 * Handle Stripe Webhook
 */
async function handleWebhook(request, env, stripe) {
    const signature = request.headers.get("stripe-signature");
    const body = await request.text();

    let event;

    try {
        event = await stripe.webhooks.constructEventAsync(
            body,
            signature,
            env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error("Webhook Verification Failed:", err.message);
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        await forwardOrderToAppsScript(env, session);
    }

    return new Response("Received", { status: 200 });
}

/**
 * Forward Order to Google Apps Script
 */
async function forwardOrderToAppsScript(env, session) {
    if (!env.ORDER_SHEET_SCRIPT_URL) {
        console.error("ORDER_SHEET_SCRIPT_URL not configured");
        return;
    }

    try {
        const payload = {
            id: session.id,
            amount_total: session.amount_total / 100, // Convert to dollars
            customer_email: session.customer_details.email, // Use verfied email from payment
            metadata: session.metadata,
            status: session.payment_status,
            created: new Date(session.created * 1000).toISOString()
        };

        const response = await fetch(env.ORDER_SHEET_SCRIPT_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.error("Apps Script Error:", response.status);
        }
    } catch (e) {
        console.error("Failed to forward order:", e);
    }
}

/**
 * Email Service Module
 *
 * Handles sending transactional emails using Resend.
 * Used for newsletter welcome emails with unsubscribe links.
 */

import { Resend } from 'resend';
import { config } from '$lib/config';

// ============================================================================
// Types
// ============================================================================

export interface SendEmailOptions {
	to: string;
	subject: string;
	html: string;
	text?: string;
}

export interface SendEmailResult {
	success: boolean;
	id?: string;
	error?: string;
}

// ============================================================================
// Email Templates
// ============================================================================

/**
 * Generate the welcome email HTML for new newsletter subscribers.
 */
export function generateWelcomeEmailHtml(unsubscribeUrl: string): string {
	const c = config.colors;
	const cfg = config;

	return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${cfg.title}!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: ${c.tertiary};">
  <div style="max-width: 600px; margin: 0 auto; background: ${c.tertiary};">

    <!-- Header -->
    <div style="text-align: center; padding: 40px 20px 32px 20px; background: linear-gradient(135deg, ${c.tertiary} 0%, ${c.tertiaryMedium} 100%);">
      <div style="font-size: 48px; margin-bottom: 16px;">&#x1F36A;</div>
      <h1 style="color: ${c.secondary}; margin: 0; font-size: 28px;">${cfg.title}</h1>
      <p style="color: ${c.primary}; margin: 8px 0 0 0; font-size: 16px; font-style: italic;">${cfg.tagline}</p>
    </div>

    <!-- Main Content -->
    <div style="background: white; padding: 36px; margin: 0 16px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">

      <h2 style="color: ${c.primary}; margin: 0 0 24px 0; text-align: center; font-size: 24px;">
        Thanks for signing up! &#x1F389;
      </h2>

      <p style="font-size: 16px; line-height: 1.7; color: ${c.textLight}; margin: 0 0 20px 0;">
        We're so excited to have you join our community! You'll be among the first to know
        when we officially launch and start taking orders for our fresh-baked cookies and treats.
      </p>

      <p style="font-size: 16px; line-height: 1.7; color: ${c.textLight}; margin: 0 0 16px 0;">
        Keep an eye on your inbox for:
      </p>

      <div style="background: ${c.tertiary}; border-radius: 12px; padding: 20px 24px; margin: 0 0 24px 0;">
        <ul style="font-size: 16px; line-height: 2; color: ${c.secondary}; margin: 0; padding-left: 8px; list-style: none;">
          <li>&#x1F4C5; Our official launch date announcement</li>
          <li>&#x1F36A; Sneak peeks of our delicious menu</li>
          <li>&#x1F381; Special offers for early supporters like you</li>
        </ul>
      </div>

      ${
				config.social.instagramEnabled
					? `
      <!-- Social Links -->
      <div style="text-align: center; margin: 28px 0;">
        <p style="color: ${c.secondary}; margin: 0 0 16px 0; font-weight: 500;">Follow along for sneak peeks and updates:</p>
        <a href="${config.social.instagram}" style="display: inline-block; color: white; background: ${c.primary}; text-decoration: none; font-weight: 500; padding: 10px 20px; border-radius: 20px; margin: 4px;">Instagram</a>
      </div>
      `
					: ''
			}

      <!-- Visit Website Button -->
      <div style="text-align: center; margin: 28px 0;">
        <a href="${cfg.baseUrl}"
           style="display: inline-block; background: ${c.accent}; color: ${c.secondaryDark}; text-decoration: none; font-weight: bold; padding: 14px 32px; border-radius: 30px; font-size: 16px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
          Visit Our Website
        </a>
      </div>

      <div style="border-top: 2px solid ${c.tertiaryMedium}; padding-top: 24px; margin-top: 28px;">
        <p style="font-size: 16px; color: ${c.textLight}; margin: 0;">
          Sweet regards,<br>
          <strong style="color: ${c.secondary};">${cfg.title}</strong>
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 24px 20px; color: ${c.textLight}; font-size: 12px;">
      <p style="margin: 0 0 12px 0;">
        You received this email because you signed up at
        <a href="${cfg.baseUrl}" style="color: ${c.primary};">${cfg.baseUrl}</a>
      </p>
      <p style="margin: 0;">
        <a href="${unsubscribeUrl}" style="color: ${c.textLight}; text-decoration: underline;">Unsubscribe</a>
      </p>
    </div>

  </div>
</body>
</html>
`;
}

/**
 * Generate plain text version of the welcome email.
 */
export function generateWelcomeEmailText(unsubscribeUrl: string): string {
	const cfg = config;

	return `
Welcome to ${cfg.title}!

Thanks for signing up! We're so excited to have you join our community.

You'll be among the first to know when we officially launch and start taking orders for our fresh-baked cookies and treats.

Keep an eye on your inbox for:
- Our official launch date announcement
- Sneak peeks of our delicious menu
- Special offers for early supporters like you

${config.social.instagramEnabled ? `Follow us on Instagram: ${config.social.instagram}\n` : ''}
Visit our website: ${cfg.baseUrl}

Sweet regards,
${cfg.title}

---
You received this email because you signed up at ${cfg.baseUrl}
To unsubscribe, visit: ${unsubscribeUrl}
`.trim();
}

// ============================================================================
// Email Sending
// ============================================================================

export interface SendEmailContext {
	apiKey: string;
	productionMode: boolean;
}

/**
 * Check if emails can be sent based on environment configuration.
 *
 * Emails are ONLY sent when:
 * 1. RESEND_API_KEY is configured
 * 2. EMAIL_PRODUCTION_MODE is set to 'true'
 *
 * This prevents accidental emails during development/testing.
 */
export function canSendEmails(context: SendEmailContext): boolean {
	return Boolean(context.apiKey && context.productionMode);
}

/**
 * Send an email using Resend.
 *
 * IMPORTANT: Emails are ONLY sent when EMAIL_PRODUCTION_MODE=true.
 * This prevents accidental emails to real users during development.
 *
 * @param context - Email context with apiKey and productionMode flag
 * @param options - Email options (to, subject, html, text)
 * @returns Result with success status and optional error
 */
export async function sendEmail(
	context: SendEmailContext,
	options: SendEmailOptions
): Promise<SendEmailResult> {
	if (!context.apiKey) {
		console.log('[Email] Resend API key not configured - skipping email');
		return { success: true }; // Return success to not block operations
	}

	if (!context.productionMode) {
		console.log(
			`[Email] EMAIL_PRODUCTION_MODE is not enabled - skipping email to: ${options.to}, subject: "${options.subject}"`
		);
		return { success: true }; // Return success to not block operations
	}

	const resend = new Resend(context.apiKey);

	try {
		const { data, error } = await resend.emails.send({
			from: `${config.newsletter.email.fromName} <${config.newsletter.email.fromAddress}>`,
			to: options.to,
			subject: options.subject,
			html: options.html,
			text: options.text
		});

		if (error) {
			console.error('[Email] Resend error:', error);
			return { success: false, error: error.message };
		}

		console.log('[Email] Sent successfully, id:', data?.id);
		return { success: true, id: data?.id };
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error';
		console.error('[Email] Failed to send:', message);
		return { success: false, error: message };
	}
}

/**
 * Send welcome email to a new newsletter subscriber.
 *
 * IMPORTANT: Emails are ONLY sent when EMAIL_PRODUCTION_MODE=true.
 * This prevents accidental emails to real users during development.
 *
 * @param context - Email context with apiKey and productionMode flag
 * @param email - The subscriber's email address
 * @param unsubscribeToken - The unique token for unsubscribe link
 * @returns Result with success status
 */
export async function sendWelcomeEmail(
	context: SendEmailContext,
	email: string,
	unsubscribeToken: string
): Promise<SendEmailResult> {
	// Check if welcome emails are enabled in config
	if (!config.newsletter.email.enabled) {
		console.log('[Email] Welcome emails are disabled in config');
		return { success: true };
	}

	const unsubscribeUrl = `${config.baseUrl}/newsletter/unsubscribe?token=${unsubscribeToken}`;

	return sendEmail(context, {
		to: email,
		subject: config.newsletter.email.welcomeSubject,
		html: generateWelcomeEmailHtml(unsubscribeUrl),
		text: generateWelcomeEmailText(unsubscribeUrl)
	});
}

/**
 * Google Apps Script for Newsletter Signups
 * With email notifications to owner and welcome email to subscriber
 *
 * SETUP INSTRUCTIONS:
 * 1. Create a Google Sheet with headers in Row 1: Email | Timestamp | Source
 * 2. Go to Extensions → Apps Script
 * 3. Replace the default code with this entire file
 * 4. UPDATE THE CONFIGURATION SECTION BELOW with your details
 * 5. Click Deploy → Manage deployments → Edit → New version → Deploy
 * 6. IMPORTANT: Run testSendEmail() once to authorize Gmail access
 *
 * NOTE: This script uses GmailApp (not MailApp) for proper alias/send-as support.
 * Make sure your senderEmail is configured in Gmail Settings → Accounts → "Send mail as"
 * with "Treat as an alias" turned ON.
 */

// ============================================================================
// CONFIGURATION - Update these values!
// ============================================================================

const CONFIG = {
  // Your email address to receive notifications
  ownerEmail: "alyssa@thecookieisle.com",

  // Sender settings (for outgoing emails to subscribers)
  // The senderEmail MUST be verified in Gmail: Settings → Accounts → "Send mail as"
  // AND have "Treat as an alias" turned ON
  senderEmail: "contact@thecookieisle.com",
  senderName: "The Cookie Isle",

  // Your business name
  businessName: "The Cookie Isle",

  // Your website URL
  websiteUrl: "https://thecookieisle.com",

  // Logo URL (hosted on your website or CDN)
  // Leave empty string '' to hide logo
  logoUrl: "https://thecookieisle.com/CookieIsleLogo.png",
  logoWidth: 150, // Width in pixels

  // Social media links (set to empty string '' to hide)
  instagramUrl: "https://instagram.com/thecookieisle",
  facebookUrl: "",

  // Email settings
  sendOwnerNotification: true, // Set to false to disable owner notifications
  sendWelcomeEmail: true, // Set to false to disable welcome emails

  // Template mode: "html" or "draft"
  // - "html": Uses the built-in HTML template below
  // - "draft": Uses a Gmail draft as the template (set draftSubjectSearch below)
  welcomeEmailMode: "html",

  // If using draft mode, the script searches for a draft containing this text in the subject
  // Example: Create a draft with subject "[TEMPLATE] Welcome Email" and set this to "[TEMPLATE] Welcome Email"
  // Use {{EMAIL}} in the draft body where you want the subscriber's email inserted
  draftSubjectSearch: "[TEMPLATE] Welcome Email",

  // Site colors (matching your Hugo site's SoCal coastal theme)
  colors: {
    primary: "#2A9D8F", // Ocean teal - buttons, links
    primaryHover: "#238B7E", // Darker teal
    secondary: "#5C4033", // Warm brown - headings
    secondaryDark: "#3D2B1F", // Dark brown
    tertiary: "#FBF8F3", // Sandy background
    tertiaryMedium: "#E8E4DC", // Darker sand
    accent: "#E9B44C", // Golden sun/cookie
    textLight: "#5D6B6A", // Muted text
  },
};

// ============================================================================
// MAIN HANDLER - Receives POST requests from Cloudflare Worker
// ============================================================================

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (!data.email) {
      return createJsonResponse({ success: false, error: "Email is required" });
    }

    const email = data.email.toLowerCase().trim();
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Check for duplicate emails
    const emailColumn = sheet.getRange("A:A").getValues().flat();
    if (emailColumn.includes(email)) {
      return createJsonResponse({
        success: true,
        message: "Already subscribed",
        duplicate: true,
      });
    }

    // Append the new row to the sheet
    const timestamp = data.timestamp || new Date().toISOString();
    sheet.appendRow([email, timestamp, data.source || "unknown"]);

    // Get total subscriber count (subtract 1 for header row)
    const totalSubscribers = sheet.getLastRow() - 1;

    // Send notification email to owner
    if (CONFIG.sendOwnerNotification) {
      try {
        sendOwnerNotification(email, totalSubscribers);
        console.log("✅ Owner notification sent for:", email);
      } catch (ownerEmailError) {
        console.error(
          "❌ Failed to send owner notification:",
          ownerEmailError.message,
        );
      }
    }

    // Send welcome email to new subscriber
    if (CONFIG.sendWelcomeEmail) {
      console.log("Attempting to send welcome email to:", email);
      console.log("Welcome email mode:", CONFIG.welcomeEmailMode);
      console.log("Sender email:", CONFIG.senderEmail);
      try {
        if (CONFIG.welcomeEmailMode === "draft") {
          console.log("Using draft template mode...");
          sendWelcomeEmailFromDraft(email);
        } else {
          console.log("Using HTML template mode...");
          sendWelcomeEmailHtml(email);
        }
        console.log("✅ Welcome email sent successfully to:", email);
      } catch (welcomeEmailError) {
        console.error(
          "❌ Failed to send welcome email to",
          email,
          ":",
          welcomeEmailError.message,
        );
        console.error("Error name:", welcomeEmailError.name);
        console.error("Stack:", welcomeEmailError.stack);
      }
    } else {
      console.log(
        "Welcome emails are disabled (CONFIG.sendWelcomeEmail = false)",
      );
    }

    console.log("New signup:", email, "| Total subscribers:", totalSubscribers);

    return createJsonResponse({ success: true });
  } catch (error) {
    console.error("Error processing signup:", error.message);
    console.error("Stack:", error.stack);
    return createJsonResponse({ success: false, error: error.message });
  }
}

/**
 * Handle GET requests (for testing the endpoint is live)
 */
function doGet(e) {
  return createJsonResponse({
    status: "Newsletter signup endpoint is running",
    timestamp: new Date().toISOString(),
  });
}

// ==========================================================================i==
// EMAIL FUNCTIONS - Using GmailApp for proper alias support
// ============================================================================

/**
 * Send notification email to the business owner
 */
function sendOwnerNotification(subscriberEmail, totalSubscribers) {
  const subject = `New Newsletter Signup - ${CONFIG.businessName}`;
  const c = CONFIG.colors;

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, ${c.tertiary} 0%, ${c.tertiaryMedium} 100%); border-radius: 12px; padding: 24px; text-align: center; border: 1px solid ${c.tertiaryMedium};">
        <h2 style="color: ${c.secondary}; margin: 0 0 16px 0;">&#x1F36A; New Newsletter Signup!</h2>

        <p style="color: ${c.textLight}; margin: 0 0 16px 0;">Someone just signed up for your newsletter:</p>

        <div style="background: white; padding: 16px; border-radius: 8px; margin: 0 0 16px 0; border: 2px solid ${c.primary};">
          <p style="font-size: 18px; font-weight: bold; color: ${c.primary}; margin: 0;">
            ${subscriberEmail}
          </p>
        </div>

        <p style="color: ${c.textLight}; margin: 0;">
          You now have <strong style="font-size: 20px; color: ${c.accent};">${totalSubscribers}</strong> total subscriber${totalSubscribers === 1 ? "" : "s"}! &#x1F389;
        </p>
      </div>

      <p style="text-align: center; margin-top: 20px;">
        <a href="${SpreadsheetApp.getActiveSpreadsheet().getUrl()}"
           style="color: ${c.primary}; text-decoration: none; font-size: 14px;">
          View all signups →
        </a>
      </p>
    </div>
  `;

  // Use GmailApp for proper alias support
  GmailApp.sendEmail(CONFIG.ownerEmail, subject, "", {
    htmlBody: htmlBody,
    from: CONFIG.senderEmail,
    name: CONFIG.senderName,
  });
}

/**
 * Send welcome email using the built-in HTML template
 */
function sendWelcomeEmailHtml(subscriberEmail) {
  const subject = `Welcome to ${CONFIG.businessName}!`;
  const c = CONFIG.colors;

  // Build logo HTML if configured
  let logoHtml = "";
  if (CONFIG.logoUrl) {
    logoHtml = `
      <img src="${CONFIG.logoUrl}"
           alt="${CONFIG.businessName}"
           width="${CONFIG.logoWidth}"
           style="max-width: 100%; height: auto; margin-bottom: 16px;">
    `;
  }

  // Build social links HTML
  let socialLinksHtml = "";
  if (CONFIG.instagramUrl || CONFIG.facebookUrl) {
    let links = [];
    if (CONFIG.instagramUrl) {
      links.push(
        `<a href="${CONFIG.instagramUrl}" style="display: inline-block; color: white; background: ${c.primary}; text-decoration: none; font-weight: 500; padding: 10px 20px; border-radius: 20px; margin: 4px;">Instagram</a>`,
      );
    }
    if (CONFIG.facebookUrl) {
      links.push(
        `<a href="${CONFIG.facebookUrl}" style="display: inline-block; color: white; background: ${c.primary}; text-decoration: none; font-weight: 500; padding: 10px 20px; border-radius: 20px; margin: 4px;">Facebook</a>`,
      );
    }
    socialLinksHtml = `
      <div style="text-align: center; margin: 28px 0;">
        <p style="color: ${c.secondary}; margin: 0 0 16px 0; font-weight: 500;">Follow along for sneak peeks and updates:</p>
        <div>${links.join("")}</div>
      </div>
    `;
  }

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: ${c.tertiary};">

      <!-- Header -->
      <div style="text-align: center; padding: 40px 20px 32px 20px; background: linear-gradient(135deg, ${c.tertiary} 0%, ${c.tertiaryMedium} 100%);">
        ${logoHtml}
        <h1 style="color: ${c.secondary}; margin: 0; font-size: 28px;">${CONFIG.businessName}</h1>
        <p style="color: ${c.primary}; margin: 8px 0 0 0; font-size: 16px; font-style: italic;">Fresh Baked Happiness</p>
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

        ${socialLinksHtml}

        <!-- Visit Website Button -->
        <div style="text-align: center; margin: 28px 0;">
          <a href="${CONFIG.websiteUrl}"
             style="display: inline-block; background: ${c.accent}; color: ${c.secondaryDark}; text-decoration: none; font-weight: bold; padding: 14px 32px; border-radius: 30px; font-size: 16px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
            Visit Our Website
          </a>
        </div>

        <div style="border-top: 2px solid ${c.tertiaryMedium}; padding-top: 24px; margin-top: 28px;">
          <p style="font-size: 16px; color: ${c.textLight}; margin: 0;">
            Sweet regards,<br>
            <strong style="color: ${c.secondary};">${CONFIG.businessName}</strong>
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div style="text-align: center; padding: 24px 20px; color: ${c.textLight}; font-size: 12px;">
        <p style="margin: 0;">
          You received this email because you signed up at
          <a href="${CONFIG.websiteUrl}" style="color: ${c.primary};">${CONFIG.websiteUrl}</a>
        </p>
      </div>

    </div>
  `;

  // Use GmailApp for proper alias support
  GmailApp.sendEmail(subscriberEmail, subject, "", {
    htmlBody: htmlBody,
    from: CONFIG.senderEmail,
    name: CONFIG.senderName,
    replyTo: CONFIG.senderEmail,
  });
}

/**
 * Send welcome email using a Gmail draft as the template
 * Create a draft in Gmail with your desired design, use {{EMAIL}} as placeholder
 */
function sendWelcomeEmailFromDraft(subscriberEmail) {
  // Find the template draft
  const drafts = GmailApp.getDrafts();
  const templateDraft = drafts.find((draft) =>
    draft.getMessage().getSubject().includes(CONFIG.draftSubjectSearch),
  );

  if (!templateDraft) {
    console.error(
      'Template draft not found! Looking for subject containing: "' +
        CONFIG.draftSubjectSearch +
        '"',
    );
    console.log("Falling back to HTML template...");
    sendWelcomeEmailHtml(subscriberEmail);
    return;
  }

  // Get the draft content
  const template = templateDraft.getMessage();
  let htmlBody = template.getBody();
  const subject = `Welcome to ${CONFIG.businessName}!`;

  // Replace placeholders in the template
  htmlBody = htmlBody.replace(/\{\{EMAIL\}\}/g, subscriberEmail);
  htmlBody = htmlBody.replace(/\{\{DATE\}\}/g, new Date().toLocaleDateString());
  htmlBody = htmlBody.replace(/\{\{BUSINESS_NAME\}\}/g, CONFIG.businessName);
  htmlBody = htmlBody.replace(/\{\{WEBSITE_URL\}\}/g, CONFIG.websiteUrl);

  // Send the email using GmailApp for proper alias support
  GmailApp.sendEmail(subscriberEmail, subject, "", {
    htmlBody: htmlBody,
    from: CONFIG.senderEmail,
    name: CONFIG.senderName,
    replyTo: CONFIG.senderEmail,
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a JSON response
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

// ============================================================================
// TEST FUNCTIONS - Run these manually from the Apps Script editor
// ============================================================================

/**
 * TEST: Send a test email to verify alias works
 * Run this FIRST after setting up the script!
 *
 * How to run:
 * 1. Select 'testSendEmail' from the function dropdown (top toolbar)
 * 2. Click the Run button (play icon)
 * 3. Authorize when prompted (grant Gmail permissions)
 * 4. Check your email for the test message
 * 5. Verify the FROM address is correct
 */
function testSendEmail() {
  if (CONFIG.ownerEmail === "your-email@example.com") {
    console.error(
      "ERROR: Please update CONFIG.ownerEmail with your actual email address first!",
    );
    return;
  }

  const c = CONFIG.colors;

  // List available aliases
  console.log("=== Checking Gmail Aliases ===");
  const aliases = GmailApp.getAliases();
  console.log(
    "Available aliases:",
    aliases.length > 0 ? aliases.join(", ") : "None found",
  );
  console.log("Configured sender:", CONFIG.senderEmail);

  if (aliases.length > 0 && !aliases.includes(CONFIG.senderEmail)) {
    console.warn("⚠️ WARNING: CONFIG.senderEmail is not in your aliases list!");
    console.warn("Available aliases are:", aliases.join(", "));
  }

  try {
    GmailApp.sendEmail(
      CONFIG.ownerEmail,
      `Test Email - ${CONFIG.businessName} Newsletter`,
      "",
      {
        htmlBody: `
        <div style="font-family: sans-serif; padding: 20px; max-width: 500px; margin: 0 auto;">
          <div style="background: ${c.tertiary}; border-radius: 12px; padding: 24px; text-align: center;">
            <h2 style="color: ${c.primary};">&#x2705; Email notifications are working!</h2>
            <p style="color: ${c.textLight};">Your newsletter signup system is ready to send emails.</p>
            <p style="color: ${c.textLight};">Configured sender: <strong>${CONFIG.senderEmail}</strong></p>
            <p style="color: ${c.textLight};">Available aliases: <strong>${aliases.join(", ") || "None"}</strong></p>
            <p style="color: ${c.secondary}; margin-top: 20px;">Mode: <strong>${CONFIG.welcomeEmailMode}</strong></p>
          </div>
        </div>
      `,
        from: CONFIG.senderEmail,
        name: CONFIG.senderName,
      },
    );
    console.log("✅ Test email sent to:", CONFIG.ownerEmail);
    console.log("   Attempted to send from:", CONFIG.senderEmail);
    console.log("   Check your email to verify the FROM address is correct!");
  } catch (error) {
    console.error("❌ Failed to send test email:", error.message);
    console.error("This usually means the alias is not properly configured.");
    console.error(
      "Go to Gmail → Settings → Accounts → 'Send mail as' and verify:",
    );
    console.error("1. The address", CONFIG.senderEmail, "is listed");
    console.error("2. 'Treat as an alias' is checked/enabled");
  }
}

/**
 * TEST: Check what aliases are available
 */
function checkAliases() {
  console.log("=== Gmail Alias Check ===");
  const aliases = GmailApp.getAliases();

  console.log("Your primary email:", Session.getActiveUser().getEmail());
  console.log("Number of aliases:", aliases.length);

  if (aliases.length === 0) {
    console.log("No aliases found!");
    console.log("To add an alias:");
    console.log("1. Go to Gmail → Settings (gear icon) → See all settings");
    console.log("2. Go to 'Accounts and Import' tab");
    console.log("3. Under 'Send mail as', click 'Add another email address'");
    console.log("4. Make sure 'Treat as an alias' is CHECKED");
  } else {
    console.log("Available aliases:");
    aliases.forEach((alias, i) => {
      console.log(`  ${i + 1}. ${alias}`);
    });
  }

  console.log("");
  console.log("CONFIG.senderEmail is set to:", CONFIG.senderEmail);

  if (aliases.includes(CONFIG.senderEmail)) {
    console.log("✅ This alias is available and can be used!");
  } else {
    console.log("⚠️ This alias was NOT found in your available aliases.");
    console.log("Emails will be sent from your primary address instead.");
  }
}

/**
 * TEST: Preview the welcome email (sends to owner)
 */
function testWelcomeEmail() {
  if (CONFIG.ownerEmail === "your-email@example.com") {
    console.error("ERROR: Please update CONFIG.ownerEmail first!");
    return;
  }

  console.log("Sending welcome email preview...");
  console.log("Mode:", CONFIG.welcomeEmailMode);
  console.log("Sender:", CONFIG.senderEmail);

  try {
    if (CONFIG.welcomeEmailMode === "draft") {
      sendWelcomeEmailFromDraft(CONFIG.ownerEmail);
    } else {
      sendWelcomeEmailHtml(CONFIG.ownerEmail);
    }
    console.log("✅ Welcome email preview sent to:", CONFIG.ownerEmail);
    console.log("Check your inbox and verify the FROM address!");
  } catch (error) {
    console.error("❌ Failed to send welcome email:", error.message);
    console.error("Stack:", error.stack);
  }
}

/**
 * TEST: Preview the owner notification email
 */
function testOwnerNotification() {
  if (CONFIG.ownerEmail === "your-email@example.com") {
    console.error("ERROR: Please update CONFIG.ownerEmail first!");
    return;
  }

  try {
    sendOwnerNotification("test-subscriber@example.com", 42);
    console.log("✅ Owner notification preview sent to:", CONFIG.ownerEmail);
  } catch (error) {
    console.error("❌ Failed to send owner notification:", error.message);
  }
}

/**
 * TEST: Simulate a full signup (without actually adding to sheet)
 */
function testFullSignupFlow() {
  if (CONFIG.ownerEmail === "your-email@example.com") {
    console.error("ERROR: Please update CONFIG.ownerEmail first!");
    return;
  }

  console.log("=== Testing Full Signup Flow ===");
  console.log(
    "This will send both notification and welcome emails to:",
    CONFIG.ownerEmail,
  );

  // Test owner notification
  console.log("\n1. Sending owner notification...");
  try {
    sendOwnerNotification(CONFIG.ownerEmail, 99);
    console.log("   ✅ Owner notification sent!");
  } catch (e) {
    console.error("   ❌ Owner notification failed:", e.message);
  }

  // Test welcome email
  console.log("\n2. Sending welcome email...");
  try {
    if (CONFIG.welcomeEmailMode === "draft") {
      sendWelcomeEmailFromDraft(CONFIG.ownerEmail);
    } else {
      sendWelcomeEmailHtml(CONFIG.ownerEmail);
    }
    console.log("   ✅ Welcome email sent!");
  } catch (e) {
    console.error("   ❌ Welcome email failed:", e.message);
  }

  console.log("\n=== Test Complete ===");
  console.log("Check your inbox for both emails.");
  console.log("Verify the FROM address on each email.");
}

/**
 * TEST: List all drafts (helpful for finding your template draft)
 */
function listDrafts() {
  const drafts = GmailApp.getDrafts();
  console.log("=== Your Gmail Drafts ===");
  console.log("Total drafts:", drafts.length);
  drafts.forEach((draft, index) => {
    const subject = draft.getMessage().getSubject();
    console.log(`${index + 1}. "${subject}"`);
  });
  console.log("========================");
  console.log(
    "To use a draft as template, set CONFIG.draftSubjectSearch to match part of its subject line.",
  );
}

/**
 * TEST: Send welcome email to a specific external email address
 * Use this to test if external emails are working
 */
function testExternalEmail() {
  // CHANGE THIS to the external email you want to test with
  const testEmail = "your-external-test-email@gmail.com"; // <-- CHANGE THIS

  console.log("=== Testing External Email ===");
  console.log("Sending welcome email to:", testEmail);
  console.log("Sender:", CONFIG.senderEmail);
  console.log("Mode:", CONFIG.welcomeEmailMode);

  try {
    console.log("Calling sendWelcomeEmailHtml...");
    sendWelcomeEmailHtml(testEmail);
    console.log("✅ Function completed without error");
    console.log("Check the inbox of:", testEmail);
    console.log("Also check spam/junk folder!");
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
    console.error("Error name:", error.name);
    console.error("Stack:", error.stack);
  }

  // Also check remaining quota
  const remainingQuota = MailApp.getRemainingDailyQuota();
  console.log("Remaining daily email quota:", remainingQuota);
}

/**
 * Check email sending quota
 */
function checkEmailQuota() {
  const remainingQuota = MailApp.getRemainingDailyQuota();
  console.log("=== Email Quota ===");
  console.log("Remaining daily quota:", remainingQuota, "emails");

  if (remainingQuota === 0) {
    console.error("❌ You have NO remaining email quota for today!");
    console.error("This is why emails are not being sent.");
    console.error("Quota resets at midnight Pacific Time.");
  } else if (remainingQuota < 10) {
    console.warn("⚠️ Low email quota remaining!");
  } else {
    console.log("✅ Quota looks good");
  }
}

/**
 * View signup statistics
 */
function viewStats() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const totalRows = sheet.getLastRow();
  const totalSubscribers = totalRows - 1; // Subtract header

  console.log("=== Newsletter Signup Stats ===");
  console.log("Total subscribers:", totalSubscribers);
  console.log("Email mode:", CONFIG.welcomeEmailMode);
  console.log("Sender email:", CONFIG.senderEmail);
  console.log(
    "Owner notifications:",
    CONFIG.sendOwnerNotification ? "ON" : "OFF",
  );
  console.log("Welcome emails:", CONFIG.sendWelcomeEmail ? "ON" : "OFF");
  console.log(
    "Spreadsheet URL:",
    SpreadsheetApp.getActiveSpreadsheet().getUrl(),
  );
}

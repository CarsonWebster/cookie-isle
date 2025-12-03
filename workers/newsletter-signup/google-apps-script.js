/**
 * Google Apps Script for Newsletter Signups
 *
 * SETUP INSTRUCTIONS:
 * 1. Create a Google Sheet with headers in Row 1: Email | Timestamp | Source
 * 2. Go to Extensions → Apps Script
 * 3. Replace the default code with this entire file
 * 4. Click Deploy → New deployment
 * 5. Select type: Web app
 * 6. Set "Execute as": Me
 * 7. Set "Who has access": Anyone
 * 8. Click Deploy and copy the Web app URL
 * 9. Add the URL as a secret in your Cloudflare Worker:
 *    wrangler secret put GOOGLE_APPS_SCRIPT_URL
 */

/**
 * Handle POST requests from the Cloudflare Worker
 */
function doPost(e) {
  try {
    // Parse the incoming JSON
    const data = JSON.parse(e.postData.contents);

    // Validate email exists
    if (!data.email) {
      return createJsonResponse({ success: false, error: 'Email is required' });
    }

    // Get the active spreadsheet and sheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Check for duplicate emails (optional - prevents duplicate signups)
    const emailColumn = sheet.getRange('A:A').getValues().flat();
    if (emailColumn.includes(data.email.toLowerCase())) {
      return createJsonResponse({
        success: true,
        message: 'Already subscribed',
        duplicate: true
      });
    }

    // Append the new row
    sheet.appendRow([
      data.email.toLowerCase(),
      data.timestamp || new Date().toISOString(),
      data.source || 'unknown'
    ]);

    // Log successful signup
    console.log('New signup:', data.email);

    return createJsonResponse({ success: true });

  } catch (error) {
    console.error('Error processing signup:', error);
    return createJsonResponse({
      success: false,
      error: error.message
    });
  }
}

/**
 * Handle GET requests (for testing the endpoint)
 */
function doGet(e) {
  return createJsonResponse({
    status: 'Newsletter signup endpoint is running',
    timestamp: new Date().toISOString()
  });
}

/**
 * Helper function to create JSON responses
 */
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Optional: Function to view all signups (run manually in Apps Script)
 */
function viewAllSignups() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  console.log('Total signups:', data.length - 1); // Subtract header row
  console.log('Data:', JSON.stringify(data, null, 2));
}

/**
 * Optional: Function to export signups to email (can be set up as a trigger)
 */
function emailSignupReport() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const totalSignups = data.length - 1; // Subtract header row

  // Get your email from the script properties or hardcode it
  const recipientEmail = Session.getActiveUser().getEmail();

  const subject = `Newsletter Signup Report - ${totalSignups} subscribers`;
  const body = `You have ${totalSignups} newsletter subscribers.\n\nView the full list: ${SpreadsheetApp.getActiveSpreadsheet().getUrl()}`;

  MailApp.sendEmail(recipientEmail, subject, body);
  console.log('Report sent to:', recipientEmail);
}

# Newsletter Signup Worker

A Cloudflare Worker that handles newsletter signups from the Cookie Isle "Coming Soon" page and forwards them to Google Sheets via Google Apps Script.

Includes automatic **Unsubscribe URL generation** for use with Gmail Mail Merge campaigns.

## Architecture

```
HTML Form (Hugo site)
    ↓ (fetch POST)
Cloudflare Worker (validates email, CORS)
    ↓ (POST)
Google Apps Script (writes to sheet)
    ↓
Google Sheet (stores email + timestamp)
```

## Features

- **Newsletter Signups**: Collect emails from your website with duplicate detection
- **Welcome Emails**: Automatically send welcome emails to new subscribers
- **Unsubscribe Handling**: Secure HMAC-signed unsubscribe links
- **Pre-generated Unsubscribe URLs**: Each subscriber gets a unique unsubscribe URL stored in the sheet, ready for Mail Merge

This approach is simpler and more secure than using service account keys or Workload Identity Federation because:
- No credentials to manage or rotate
- Google Apps Script runs under your Google account
- The Apps Script URL is kept secret in Cloudflare

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (`npm install -g wrangler`)
- A Cloudflare account
- A Google account with access to Google Sheets and Apps Script

## Setup

### 1. Create the Google Sheet

1. Go to [Google Sheets](https://sheets.google.com) and create a new spreadsheet
2. Name it "Newsletter Signups" (or whatever you prefer)
3. Add headers in Row 1:
   - **A1**: `email`
   - **B1**: `firstname`
   - **C1**: `timestamp`
   - **D1**: `source`
   - **E1**: `subscribed`
   - **F1**: `unsubscribeurl`

### 2. Create the Google Apps Script

1. In your Google Sheet, go to **Extensions → Apps Script**
2. Replace the default code with the following:

```javascript
function doPost(e) {
  try {
    // Parse the incoming JSON
    const data = JSON.parse(e.postData.contents);
    
    // Get the active spreadsheet and sheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Check for duplicate emails (optional)
    const emails = sheet.getRange('A:A').getValues().flat();
    if (emails.includes(data.email)) {
      return ContentService
        .createTextOutput(JSON.stringify({ success: true, message: 'Already subscribed' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Append the new row
    sheet.appendRow([
      data.email,
      data.timestamp || new Date().toISOString(),
      data.source || 'unknown'
    ]);
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Handle GET requests (for testing)
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'Newsletter signup endpoint is running' }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

3. Click **Deploy → New deployment**
4. Select type: **Web app**
5. Configure:
   - **Description**: Newsletter Signup
   - **Execute as**: Me
   - **Who has access**: Anyone
6. Click **Deploy**
7. **Copy the Web app URL** (looks like `https://script.google.com/macros/s/AKfycb.../exec`)

### 3. Deploy the Cloudflare Worker

```bash
cd workers/newsletter-signup

# Install dependencies
npm install

# Login to Cloudflare (first time only)
wrangler login

# Add the Apps Script URL as a secret
wrangler secret put GOOGLE_APPS_SCRIPT_URL
# Paste your Apps Script URL when prompted

# Deploy
npm run deploy
```

### 4. Note Your Worker URL

After deployment, you'll see a URL like:
```
https://newsletter-signup.your-subdomain.workers.dev
```

Update this URL in your Hugo site's `hugo.toml`:
```toml
newsletter_worker_url = "https://newsletter-signup.your-subdomain.workers.dev"
```

## Configuration

### wrangler.toml (safe to commit)

| Variable | Description |
|----------|-------------|
| `ALLOWED_ORIGINS` | Comma-separated list of allowed origins for CORS |

### Secrets (via `wrangler secret put`)

| Secret | Description |
|--------|-------------|
| `GOOGLE_APPS_SCRIPT_URL` | Your Google Apps Script web app URL |

## Local Development

For local development, create a `.dev.vars` file (this is gitignored):

```
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/your-script-id/exec
```

Then run:
```bash
npm run dev
```

## Testing

### Test the Apps Script directly

```bash
curl -X POST "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","timestamp":"2024-01-01T00:00:00Z","source":"test"}'
```

### Test the Worker

```bash
curl -X POST "https://newsletter-signup.your-subdomain.workers.dev" \
  -H "Content-Type: application/json" \
  -H "Origin: https://cookieisle.com" \
  -d '{"email":"test@example.com"}'
```

## Troubleshooting

### "Service not configured"
- Ensure you've added the `GOOGLE_APPS_SCRIPT_URL` secret via `wrangler secret put`

### CORS errors
- Check that your domain is listed in `ALLOWED_ORIGINS` in `wrangler.toml`
- Make sure you're using the exact origin (including `https://`)

### Emails not appearing in sheet
1. Test the Apps Script URL directly with curl
2. Check the Apps Script execution logs: **Apps Script Editor → Executions**
3. Make sure the Apps Script is deployed as "Anyone can access"

### Apps Script permission errors
- Re-deploy the Apps Script and make sure to authorize it
- The script needs permission to access the spreadsheet

## Monitoring

View real-time Worker logs:
```bash
npm run tail
```

Or via Cloudflare Dashboard:
1. Go to **Workers & Pages**
2. Select your worker
3. Click **Logs** tab

## Sending Campaigns with Mail Merge

Instead of a custom UI, this system uses **Gmail Mail Merge** (via add-ons like "Yet Another Mail Merge" or similar) to send campaigns. Each subscriber has a pre-generated unsubscribe URL stored in column F.

### Sheet Columns

| Column | Header | Description |
|--------|--------|-------------|
| A | email | Subscriber's email address |
| B | firstname | Fill in manually for personalization |
| C | timestamp | When they signed up (Pacific Time, 24hr format) |
| D | source | Where they signed up from |
| E | subscribed | TRUE/FALSE - managed automatically |
| F | unsubscribeurl | Auto-generated at signup, unique per subscriber |

### How It Works

1. When someone signs up, the Apps Script automatically generates their unique unsubscribe URL
2. The URL is stored in column F and never changes
3. When sending campaigns via Mail Merge, use `{{Unsubscribe URL}}` as a placeholder
4. Each subscriber receives their personalized unsubscribe link

### Sending a Campaign

1. Create your email template in Gmail (as a draft or using Mail Merge add-on)
2. Use these placeholders in your template:
   - `{{firstname}}` - From column B
   - `{{email}}` - From column A  
   - `{{unsubscribeurl}}` - From column F (the pre-generated link)
3. Use your Mail Merge add-on to send to all rows where `subscribed` = TRUE

### Timestamp Format

Timestamps are automatically formatted in **Pacific Time** using 24-hour format:
- Example: `2024-01-15 14:30:45`
- This makes it easy to see when subscribers signed up in your local time

### Backfilling Existing Subscribers

If you have existing subscribers without unsubscribe URLs, run this in Apps Script:

1. Go to **Extensions → Apps Script**
2. Select `backfillUnsubscribeUrls` from the function dropdown
3. Click **Run**

This will generate URLs for all subscribers who don't have one yet.

## Security Notes

- The Apps Script URL is kept secret - only your Worker knows it
- CORS restricts which domains can submit to the Worker
- Email validation prevents malformed input
- Google Apps Script handles authentication to Sheets automatically
- No API keys or service account credentials to manage
- Unsubscribe tokens are HMAC-signed to prevent tampering
- Unsubscribe URLs are permanent per subscriber (same URL works for all their emails)
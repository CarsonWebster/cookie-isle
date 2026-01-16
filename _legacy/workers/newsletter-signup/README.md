# Newsletter Signup Worker

A Cloudflare Worker that handles newsletter signups from the Cookie Isle "Coming Soon" page and forwards them to Google Sheets via Google Apps Script.

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
   - **A1**: `Email`
   - **B1**: `Timestamp`
   - **C1**: `Source`

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

## Security Notes

- The Apps Script URL is kept secret - only your Worker knows it
- CORS restricts which domains can submit to the Worker
- Email validation prevents malformed input
- Google Apps Script handles authentication to Sheets automatically
- No API keys or service account credentials to manage
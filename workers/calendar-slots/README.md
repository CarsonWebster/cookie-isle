# Calendar Slots Worker

Cloudflare Worker that fetches and parses your Google Calendar iCal feed to provide fulfillment time slots for the Cookie Isle checkout page.

## How It Works

1. Fetches the public iCal feed from your Google Calendar
2. Parses events with titles starting with "Drop Window"
3. Returns JSON with available pickup/delivery time slots
4. Caches results for 5 minutes to reduce API calls

## Event Naming Convention

Create calendar events with these title patterns:

| Event Title | Slot Type |
|-------------|-----------|
| `Drop Window - Pickup` | Pickup only |
| `Drop Window - Delivery` | Delivery only |
| `Drop Window` | Both pickup and delivery |

The event's **start time** and **end time** define the fulfillment window.

## API Response

```json
{
  "success": true,
  "slots": [
    {
      "id": "unique-event-id",
      "date": "2024-12-21",
      "dateFormatted": "Saturday, December 21",
      "startTime": "10:00 AM",
      "endTime": "12:00 PM",
      "type": "pickup",
      "title": "Drop Window - Pickup"
    }
  ],
  "fetchedAt": "2024-12-16T22:00:00Z"
}
```

## Setup

### 1. Install dependencies

```bash
cd workers/calendar-slots
npm install
```

### 2. Test locally

```bash
npm run dev
```

Visit `http://localhost:8787` to see the JSON response.

### 3. Deploy to Cloudflare

```bash
npm run deploy
```

### 4. Update Hugo config

Add the worker URL to `hugo.toml`:

```toml
[params]
  calendar_slots_worker_url = "https://calendar-slots.YOUR-SUBDOMAIN.workers.dev"
```

## Configuration

Environment variables in `wrangler.toml`:

| Variable | Description |
|----------|-------------|
| `CALENDAR_ICAL_URL` | Your Google Calendar's public iCal URL |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed origins for CORS |
| `EVENT_PREFIX` | Event title prefix to look for (default: "Drop Window") |
| `CACHE_TTL` | Cache duration in seconds (default: 300) |

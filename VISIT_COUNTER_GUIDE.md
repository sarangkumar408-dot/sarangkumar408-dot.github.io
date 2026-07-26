# NexusForge - Visit Counter Implementation Guide

## Overview
Comprehensive website visit counter system with detailed analytics in the admin panel.

## Features

### Public Visitor Counter
- Displays total visitor count on homepage (hero stats section)
- Animated counter with smooth count-up animation
- Real-time updates as new visitors arrive

### Visit Tracking System
- Automatic tracking per website visit
- Prevents duplicate counting (30-minute window)
- Records: Timestamp, anonymized IP, browser, referrer, session ID

### Admin Analytics Dashboard (admin.html)
**Statistics Summary:**
- Total visits (all time)
- Today's visits
- This week's visits
- This month's visits
- Unique visitors count

**Visit History:**
- Detailed table with date/time, visitor ID, browser, referrer
- Pagination for navigation
- Refresh and clear capabilities

## How It Works

### Backend (server.js)
- `GET /api/visits` - Returns statistics
- `POST /api/visits` - Records new visit with deduplication
- `GET /api/visits/history` - Returns paginated history
- `DELETE /api/visits` - Clears all data

### Frontend (script.js)
- Automatically tracks visits on page load
- Falls back to localStorage if server unavailable
- Animated counter on homepage
- Admin stats with summary cards and history table

## Privacy
- IP addresses are anonymized (hashed)
- No personal data collected
- Session-based deduplication

## Customization
Adjust duplicate prevention time in `server.js`:
```javascript
const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
```

## Troubleshooting
- Counter shows "0": Server may not be running, or localStorage is empty
- Admin stats not loading: Ensure logged in and server is accessible
- Reset localStorage: `localStorage.removeItem('nexusforge_visits')`

## Support
Contact: hello@nexusforge.dev


# Google Places API Setup Guide

## The Issue
You're getting "REQUEST_DENIED" because the legacy Places API needs to be enabled.

## Quick Fix (Recommended)

1. **Go to Google Cloud Console**: https://console.cloud.google.com/

2. **Enable the Places API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Places API"
   - Click on "Places API" (NOT "Places API (New)")
   - Click "ENABLE"

3. **Also enable** (if not already):
   - "Maps JavaScript API"
   - "Geocoding API"

4. **Check Billing**:
   - Go to "Billing" in the console
   - Ensure you have a billing account attached
   - You get $200 free credit monthly

## Alternative: Use Nearby Search (Free Tier Friendly)

If you want to minimize costs, we can modify the code to use Nearby Search instead of Text Search:
- Nearby Search: $32 per 1,000 requests
- Text Search: $32 per 1,000 requests
- Basic Data: $17 per 1,000 requests

## Test Your API Key

After enabling the API, test here:
https://maps.googleapis.com/maps/api/place/textsearch/json?query=restaurants+in+San+Francisco&key=YOUR_API_KEY

Should return status: "OK" with results.
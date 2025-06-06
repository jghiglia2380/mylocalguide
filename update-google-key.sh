#!/bin/bash

# Update Google API key in Vercel
echo "Paste your Google API key from the console:"
read NEW_KEY

# Remove old key and add new one
vercel env rm GOOGLE_PLACES_API_KEY production --yes 2>/dev/null
echo "$NEW_KEY" | vercel env add GOOGLE_PLACES_API_KEY production

echo "API key updated! Redeploying..."
vercel --prod
#!/bin/bash

# Add Supabase environment variables to Vercel
echo "Adding environment variables to Vercel..."

# Add each variable
echo "https://jnqxpuvksqfpkcxinxbx.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpucXhwdXZrc3FmcGtjeGlueGJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNTk3NzQsImV4cCI6MjA2NDczNTc3NH0.kEKnR4ZH_NygfS4rhEOF2GWYZPfQuLFGtPNgl95OnXM" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpucXhwdXZrc3FmcGtjeGlueGJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTE1OTc3NCwiZXhwIjoyMDY0NzM1Nzc0fQ.kK8T9Pkl7M_sFgDeC-Hldrzv4Uj1N-wz9REayoVBlgg" | vercel env add SUPABASE_SERVICE_ROLE_KEY production

# Add Google and Yelp API keys
echo "AIzaSyDcYQR6MidDH9-l8lLs0WylsRNT8jkxalo" | vercel env add GOOGLE_PLACES_API_KEY production
echo "kmwEeEPINwloyhJWvq4N_Z1Uo4u-DG4wzi_imIPIfDwTCMVh7G2Ba3YvAV_6ka6E8-AneS3IWwvakqFXVO_1-RxZMwr58spimaNLzqkGOh5Ld2ciqwJCjma_m0w_aHYx" | vercel env add YELP_API_KEY production

echo "Environment variables added! Now redeploying..."
vercel --prod
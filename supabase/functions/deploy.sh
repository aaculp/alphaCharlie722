#!/bin/bash

# Deployment script for Supabase Edge Functions
# Usage: ./deploy.sh [local|production]

set -e

ENVIRONMENT=${1:-local}

echo "🚀 Deploying Edge Functions to $ENVIRONMENT..."

if [ "$ENVIRONMENT" = "local" ]; then
  echo "📦 Deploying to local Supabase..."
  supabase functions deploy send-flash-offer-push --no-verify-jwt
  echo "✅ Local deployment complete!"
  echo "📍 Function available at: http://localhost:54321/functions/v1/send-flash-offer-push"
elif [ "$ENVIRONMENT" = "production" ]; then
  echo "🔐 Checking secrets..."
  
  # Check if required secrets are set
  SECRETS=$(supabase secrets list 2>&1)
  
  if ! echo "$SECRETS" | grep -q "FIREBASE_SERVICE_ACCOUNT"; then
    echo "❌ Error: FIREBASE_SERVICE_ACCOUNT secret not set"
    echo "Run: supabase secrets set FIREBASE_SERVICE_ACCOUNT='<json>'"
    exit 1
  fi
  
  if ! echo "$SECRETS" | grep -q "SUPABASE_SERVICE_ROLE_KEY"; then
    echo "❌ Error: SUPABASE_SERVICE_ROLE_KEY secret not set"
    echo "Run: supabase secrets set SUPABASE_SERVICE_ROLE_KEY='<key>'"
    exit 1
  fi
  
  if ! echo "$SECRETS" | grep -q "SUPABASE_URL"; then
    echo "❌ Error: SUPABASE_URL secret not set"
    echo "Run: supabase secrets set SUPABASE_URL='<url>'"
    exit 1
  fi
  
  echo "✅ All secrets configured"
  echo "📦 Deploying to production..."
  supabase functions deploy send-flash-offer-push
  echo "✅ Production deployment complete!"
  echo "📍 Function available at your Supabase project URL"
else
  echo "❌ Invalid environment: $ENVIRONMENT"
  echo "Usage: ./deploy.sh [local|production]"
  exit 1
fi

echo ""
echo "🎉 Deployment successful!"

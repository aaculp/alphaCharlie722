#!/bin/bash

# Test script for send-flash-offer-push Edge Function
# Usage: ./test-function.sh [local|production] <jwt_token> <offer_id>

set -e

ENVIRONMENT=${1:-local}
JWT_TOKEN=$2
OFFER_ID=${3:-test-offer-id}

if [ -z "$JWT_TOKEN" ]; then
  echo "❌ Error: JWT token required"
  echo "Usage: ./test-function.sh [local|production] <jwt_token> <offer_id>"
  exit 1
fi

if [ "$ENVIRONMENT" = "local" ]; then
  URL="http://localhost:54321/functions/v1/send-flash-offer-push"
elif [ "$ENVIRONMENT" = "production" ]; then
  echo "Enter your Supabase project URL (e.g., https://xxx.supabase.co):"
  read PROJECT_URL
  URL="$PROJECT_URL/functions/v1/send-flash-offer-push"
else
  echo "❌ Invalid environment: $ENVIRONMENT"
  echo "Usage: ./test-function.sh [local|production] <jwt_token> <offer_id>"
  exit 1
fi

echo "🧪 Testing Edge Function..."
echo "📍 URL: $URL"
echo "🎫 Offer ID: $OFFER_ID"
echo ""

# Test with dry-run mode
echo "1️⃣ Testing with dry-run mode..."
RESPONSE=$(curl -s -X POST "$URL" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"offerId\": \"$OFFER_ID\", \"dryRun\": true}")

echo "Response:"
echo "$RESPONSE" | jq '.'
echo ""

# Check if response is successful
if echo "$RESPONSE" | jq -e '.success' > /dev/null; then
  echo "✅ Dry-run test passed!"
else
  echo "❌ Dry-run test failed!"
  exit 1
fi

echo ""
echo "2️⃣ Testing without dry-run mode..."
RESPONSE=$(curl -s -X POST "$URL" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"offerId\": \"$OFFER_ID\"}")

echo "Response:"
echo "$RESPONSE" | jq '.'
echo ""

# Check if response is successful
if echo "$RESPONSE" | jq -e '.success' > /dev/null; then
  echo "✅ Full test passed!"
else
  echo "❌ Full test failed!"
  exit 1
fi

echo ""
echo "🎉 All tests passed!"

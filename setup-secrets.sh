#!/bin/bash

# Asciente Hub - GitHub Actions Secrets Setup Script
# This script helps you configure all required GitHub Secrets for deployment

set -e

REPO_OWNER=""
REPO_NAME=""

echo "================================"
echo "Asciente Hub - GitHub Secrets Setup"
echo "================================"
echo ""
echo "This script will help you set GitHub Secrets for your project."
echo "Requires: GitHub CLI (gh) installed and authenticated"
echo ""

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo "Install from: https://cli.github.com"
    exit 1
fi

# Get repository info
echo "📦 Repository Information:"
read -p "Enter repository owner (username/org): " REPO_OWNER
read -p "Enter repository name: " REPO_NAME

echo ""
echo "🔑 Now enter your credentials and secrets:"
echo ""

# AWS Credentials
read -p "AWS Access Key ID: " AWS_ACCESS_KEY_ID
read -sp "AWS Secret Access Key: " AWS_SECRET_ACCESS_KEY
echo ""
read -p "AWS Region (default: us-east-1): " AWS_REGION
AWS_REGION=${AWS_REGION:-us-east-1}

echo ""
echo "📊 Database Configuration (TiDB Serverless):"
read -p "Database Host: " DB_HOST
read -p "Database User: " DB_USER
read -sp "Database Password: " DB_PASSWORD
echo ""
read -p "Database Name (default: ascientehub): " DB_NAME
DB_NAME=${DB_NAME:-ascientehub}
read -p "Database Port (default: 4000): " DB_PORT
DB_PORT=${DB_PORT:-4000}

echo ""
echo "💳 PayMongo Configuration:"
read -sp "PayMongo Secret Key: " PAYMONGO_SECRET_KEY
echo ""
read -p "PayMongo Public Key: " PAYMONGO_PUBLIC_KEY

echo ""
echo "🔐 JWT Configuration:"
read -sp "JWT Secret (or press enter to generate): " JWT_SECRET
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -hex 32)
    echo "Generated: $JWT_SECRET"
fi
echo ""

echo ""
echo "☁️  Cloudflare R2 Configuration:"
read -p "R2 Endpoint (e.g., https://xxx.r2.cloudflarestorage.com): " R2_ENDPOINT
read -p "R2 Access Key ID: " R2_ACCESS_KEY_ID
read -sp "R2 Secret Access Key: " R2_SECRET_ACCESS_KEY
echo ""
read -p "R2 Bucket Name (default: asciente-hub): " R2_BUCKET_NAME
R2_BUCKET_NAME=${R2_BUCKET_NAME:-asciente-hub}

echo ""
echo "================================"
echo "📝 Setting GitHub Secrets..."
echo "================================"
echo ""

# Function to set a secret
set_secret() {
    local secret_name=$1
    local secret_value=$2
    gh secret set "$secret_name" --body "$secret_value" -R "$REPO_OWNER/$REPO_NAME"
    echo "✅ Set $secret_name"
}

# Set all secrets
set_secret "AWS_ACCESS_KEY_ID" "$AWS_ACCESS_KEY_ID"
set_secret "AWS_SECRET_ACCESS_KEY" "$AWS_SECRET_ACCESS_KEY"
set_secret "AWS_REGION" "$AWS_REGION"
set_secret "DB_HOST" "$DB_HOST"
set_secret "DB_USER" "$DB_USER"
set_secret "DB_PASSWORD" "$DB_PASSWORD"
set_secret "DB_NAME" "$DB_NAME"
set_secret "DB_PORT" "$DB_PORT"
set_secret "PAYMONGO_SECRET_KEY" "$PAYMONGO_SECRET_KEY"
set_secret "PAYMONGO_PUBLIC_KEY" "$PAYMONGO_PUBLIC_KEY"
set_secret "JWT_SECRET" "$JWT_SECRET"
set_secret "R2_ENDPOINT" "$R2_ENDPOINT"
set_secret "R2_ACCESS_KEY_ID" "$R2_ACCESS_KEY_ID"
set_secret "R2_SECRET_ACCESS_KEY" "$R2_SECRET_ACCESS_KEY"
set_secret "R2_BUCKET_NAME" "$R2_BUCKET_NAME"

echo ""
echo "✨ All secrets configured successfully!"
echo ""
echo "Next steps:"
echo "1. Commit your changes: git add . && git commit -m 'Add Lambda deployment config'"
echo "2. Push to main: git push origin main"
echo "3. Watch the deployment: GitHub Actions → Workflows"
echo ""

# Asciente Hub - GitHub Secrets Setup Script (PowerShell)
# This script helps you configure all required GitHub Secrets for deployment

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Asciente Hub - GitHub Secrets Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script will help you set GitHub Secrets for your project." -ForegroundColor Green
Write-Host "Requires: GitHub CLI (gh) installed and authenticated" -ForegroundColor Yellow
Write-Host ""

# Check if gh is installed
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "❌ GitHub CLI (gh) is not installed." -ForegroundColor Red
    Write-Host "Install from: https://cli.github.com"
    exit 1
}

# Get repository info
Write-Host "📦 Repository Information:" -ForegroundColor Cyan
$REPO_OWNER = Read-Host "Enter repository owner (username/org)"
$REPO_NAME = Read-Host "Enter repository name"

Write-Host ""
Write-Host "🔑 Now enter your credentials and secrets:" -ForegroundColor Cyan
Write-Host ""

# AWS Credentials
$AWS_ACCESS_KEY_ID = Read-Host "AWS Access Key ID"
$AWS_SECRET_ACCESS_KEY = Read-Host "AWS Secret Access Key" -AsSecureString
$AWS_SECRET_ACCESS_KEY_PLAIN = [System.Net.NetworkCredential]::new('', $AWS_SECRET_ACCESS_KEY).Password
$AWS_REGION = Read-Host "AWS Region (default: us-east-1)"
if ([string]::IsNullOrWhiteSpace($AWS_REGION)) { $AWS_REGION = "us-east-1" }

Write-Host ""
Write-Host "📊 Database Configuration (TiDB Serverless):" -ForegroundColor Cyan
$DB_HOST = Read-Host "Database Host"
$DB_USER = Read-Host "Database User"
$DB_PASSWORD = Read-Host "Database Password" -AsSecureString
$DB_PASSWORD_PLAIN = [System.Net.NetworkCredential]::new('', $DB_PASSWORD).Password
$DB_NAME = Read-Host "Database Name (default: ascientehub)"
if ([string]::IsNullOrWhiteSpace($DB_NAME)) { $DB_NAME = "ascientehub" }
$DB_PORT = Read-Host "Database Port (default: 4000)"
if ([string]::IsNullOrWhiteSpace($DB_PORT)) { $DB_PORT = "4000" }

Write-Host ""
Write-Host "💳 PayMongo Configuration:" -ForegroundColor Cyan
$PAYMONGO_SECRET_KEY = Read-Host "PayMongo Secret Key" -AsSecureString
$PAYMONGO_SECRET_KEY_PLAIN = [System.Net.NetworkCredential]::new('', $PAYMONGO_SECRET_KEY).Password
$PAYMONGO_PUBLIC_KEY = Read-Host "PayMongo Public Key"

Write-Host ""
Write-Host "🔐 JWT Configuration:" -ForegroundColor Cyan
$JWT_SECRET = Read-Host "JWT Secret (or press enter to generate)" -AsSecureString
if ($JWT_SECRET.Length -eq 0) {
    $JWT_SECRET_PLAIN = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | % {[char]$_})
    Write-Host "Generated JWT Secret: $JWT_SECRET_PLAIN" -ForegroundColor Green
} else {
    $JWT_SECRET_PLAIN = [System.Net.NetworkCredential]::new('', $JWT_SECRET).Password
}

Write-Host ""
Write-Host "☁️  Cloudflare R2 Configuration:" -ForegroundColor Cyan
$R2_ENDPOINT = Read-Host "R2 Endpoint (e.g., https://xxx.r2.cloudflarestorage.com)"
$R2_ACCESS_KEY_ID = Read-Host "R2 Access Key ID"
$R2_SECRET_ACCESS_KEY = Read-Host "R2 Secret Access Key" -AsSecureString
$R2_SECRET_ACCESS_KEY_PLAIN = [System.Net.NetworkCredential]::new('', $R2_SECRET_ACCESS_KEY).Password
$R2_BUCKET_NAME = Read-Host "R2 Bucket Name (default: asciente-hub)"
if ([string]::IsNullOrWhiteSpace($R2_BUCKET_NAME)) { $R2_BUCKET_NAME = "asciente-hub" }

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "📝 Setting GitHub Secrets..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Function to set a secret
function Set-GitHubSecret {
    param (
        [string]$Name,
        [string]$Value
    )
    $Value | gh secret set $Name -R "$REPO_OWNER/$REPO_NAME"
    Write-Host "✅ Set $Name" -ForegroundColor Green
}

# Set all secrets
Set-GitHubSecret "AWS_ACCESS_KEY_ID" $AWS_ACCESS_KEY_ID
Set-GitHubSecret "AWS_SECRET_ACCESS_KEY" $AWS_SECRET_ACCESS_KEY_PLAIN
Set-GitHubSecret "AWS_REGION" $AWS_REGION
Set-GitHubSecret "DB_HOST" $DB_HOST
Set-GitHubSecret "DB_USER" $DB_USER
Set-GitHubSecret "DB_PASSWORD" $DB_PASSWORD_PLAIN
Set-GitHubSecret "DB_NAME" $DB_NAME
Set-GitHubSecret "DB_PORT" $DB_PORT
Set-GitHubSecret "PAYMONGO_SECRET_KEY" $PAYMONGO_SECRET_KEY_PLAIN
Set-GitHubSecret "PAYMONGO_PUBLIC_KEY" $PAYMONGO_PUBLIC_KEY
Set-GitHubSecret "JWT_SECRET" $JWT_SECRET_PLAIN
Set-GitHubSecret "R2_ENDPOINT" $R2_ENDPOINT
Set-GitHubSecret "R2_ACCESS_KEY_ID" $R2_ACCESS_KEY_ID
Set-GitHubSecret "R2_SECRET_ACCESS_KEY" $R2_SECRET_ACCESS_KEY_PLAIN
Set-GitHubSecret "R2_BUCKET_NAME" $R2_BUCKET_NAME

Write-Host ""
Write-Host "✨ All secrets configured successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Commit your changes: git add . && git commit -m 'Add Lambda deployment config'"
Write-Host "2. Push to main: git push origin main"
Write-Host "3. Watch the deployment: GitHub Actions → Workflows"
Write-Host ""

# Asciente Hub - AWS Lambda Deployment Setup

## Overview
This project deploys two separate Lambda functions:
1. **Upload Handler Lambda** - Direct file uploads to Cloudflare R2
2. **Backend API Lambda** - Express.js REST API with database and payment processing

Both are deployed automatically via GitHub Actions when you push to `main` branch.

---

## GitHub Secrets Configuration

You must configure these secrets in your GitHub repository for successful deployments.

### Step 1: Go to GitHub Repository Settings
1. Navigate to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

### Step 2: Add the Following Secrets

#### AWS Credentials
```
AWS_ACCESS_KEY_ID: <your-aws-access-key>
AWS_SECRET_ACCESS_KEY: <your-aws-secret-access-key>
AWS_REGION: us-east-1
```
⚠️ **Important**: Fix the typo - the old workflow had `AWS_SECRET_KEY` instead of `AWS_ACCESS_KEY_ID`

#### Database (TiDB Serverless)
```
DB_HOST: <tidb-serverless-endpoint>
DB_USER: <username>
DB_PASSWORD: <password>
DB_NAME: ascientehub
DB_PORT: 4000
```

#### PayMongo Payment Gateway
```
PAYMONGO_SECRET_KEY: <your-secret-key>
PAYMONGO_PUBLIC_KEY: <your-public-key>
```

#### Cloudflare R2 Storage
```
R2_ENDPOINT: https://<account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID: <r2-access-key>
R2_SECRET_ACCESS_KEY: <r2-secret-key>
R2_BUCKET_NAME: asciente-hub
```

#### JWT Authentication
```
JWT_SECRET: <a-long-random-string-for-signing-tokens>
```
Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## Deployment Workflow Overview

### Upload Handler Lambda
- **Location**: `lambda-upload/index.mjs`
- **Trigger**: Any code changes to main branch
- **What it does**:
  1. Installs dependencies
  2. Zips the lambda function with node_modules
  3. Deploys to AWS Lambda function: `asciente-upload-handler`
  4. Updates environment variables on the Lambda
- **Runtime**: Node.js 20
- **Memory**: 256 MB (default)
- **Timeout**: 60 seconds (default)

### Backend API Lambda
- **Location**: `src/lambda.ts` + `serverless.yml`
- **Trigger**: Any code changes to main branch
- **What it does**:
  1. Installs dependencies
  2. Builds TypeScript to JavaScript
  3. Deploys via Serverless Framework
  4. Creates/updates HTTP API with express wrapper
  5. Sets all environment variables
- **Runtime**: Node.js 20.x
- **Memory**: 512 MB (adjust in serverless.yml if needed)
- **Timeout**: 30 seconds (adjust in serverless.yml if needed)

---

## Manual Lambda Configuration (if needed)

### Update Upload Handler Environment Variables
```bash
aws lambda update-function-configuration \
  --function-name asciente-upload-handler \
  --environment Variables="{R2_ENDPOINT=...,R2_ACCESS_KEY_ID=...,R2_SECRET_ACCESS_KEY=...,R2_BUCKET_NAME=...}" \
  --region us-east-1
```

### Update Backend API Environment Variables
```bash
aws lambda update-function-configuration \
  --function-name ascientehub-backend-dev-api \
  --environment Variables="{DB_HOST=...,DB_USER=...,DB_PASSWORD=...,DB_NAME=...,PAYMONGO_SECRET_KEY=...,PAYMONGO_PUBLIC_KEY=...,JWT_SECRET=...}" \
  --region us-east-1
```

---

## Testing the Deployment

### 1. Verify Upload Handler
```bash
curl -X POST https://<upload-handler-url>/prod/upload \
  -H "Content-Type: application/json" \
  -d '{
    "image": "data:image/png;base64,...",
    "folder": "test"
  }'
```

### 2. Verify Backend API
```bash
# Get API endpoint from CloudFormation or AWS Lambda Console

# Test health endpoint
curl https://<backend-api-endpoint>/health

# Test authentication
curl -X POST https://<backend-api-endpoint>/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPass123!"
  }'

# Test payment endpoints
curl https://<backend-api-endpoint>/games
```

---

## Troubleshooting

### Deployment Fails
1. Check GitHub Actions logs: **Actions** tab → failed workflow → view logs
2. Verify all GitHub Secrets are set correctly
3. Ensure AWS IAM user has `lambda:UpdateFunctionCode`, `lambda:UpdateFunctionConfiguration` permissions

### Environment Variables Not Working
1. Verify secrets are exported to the calling workflow steps
2. Check Lambda function configuration in AWS Console
3. Redeploy after updating secrets

### TypeScript Build Fails
```bash
# Test locally
npm run build
npx tsc --noEmit
```

### Database Connection Issues
- Verify DB_HOST, DB_USER, DB_PASSWORD are correct
- Check TiDB Serverless console for connection status
- Ensure connection pooling is optimized:
  - Max: 5 connections
  - Idle timeout: 10 seconds
  - Acquire timeout: 30 seconds

### Cold Start Issues
- Backend API uses server caching - should improve on subsequent invocations
- Add provisioned concurrency if needed ($0.015/hour per concurrent execution)

---

## File Reference

- **Workflow**: `.github/workflows/deploy-lambda.yml`
- **Upload Handler**: `lambda-upload/index.mjs`
- **Backend API Handler**: `src/lambda.ts`
- **Serverless Config**: `serverless.yml`
- **API Server**: `src/app.ts`

---

## First Deployment

1. **Configure all GitHub Secrets** (see above)
2. **Commit and push** your code:
   ```bash
   git add .
   git commit -m "Add serverless Lambda deployment configuration"
   git push origin main
   ```
3. **Watch the workflow**:
   - Go to **Actions** tab
   - Click the running workflow
   - Monitor logs for both deployment jobs
4. **Get your Lambda URLs**:
   - Upload Handler: AWS Lambda Console → `asciente-upload-handler` → Function URL
   - Backend API: AWS CloudFormation → check outputs OR AWS Lambda Console → `ascientehub-backend-dev-api`
5. **Update your frontend**:
   - API Base URL: `https://<backend-api-endpoint>`
   - Upload URL: `https://<upload-handler-url>`

---

## Environment Variables Reference

| Variable | Use | Source |
|----------|-----|--------|
| `AWS_ACCESS_KEY_ID` | AWS CLI authentication | GitHub Secret |
| `AWS_SECRET_ACCESS_KEY` | AWS CLI authentication | GitHub Secret |
| `AWS_REGION` | AWS region for deployment | GitHub Secret |
| `DB_HOST` | TiDB Serverless endpoint | GitHub Secret |
| `DB_USER` | Database user | GitHub Secret |
| `DB_PASSWORD` | Database password | GitHub Secret |
| `DB_NAME` | Database name | GitHub Secret |
| `DB_PORT` | Database port | GitHub Secret |
| `PAYMONGO_SECRET_KEY` | PayMongo API secret | GitHub Secret |
| `PAYMONGO_PUBLIC_KEY` | PayMongo API public key | GitHub Secret |
| `JWT_SECRET` | JWT token signing secret | GitHub Secret |
| `R2_ENDPOINT` | Cloudflare R2 endpoint | GitHub Secret |
| `R2_ACCESS_KEY_ID` | R2 access key | GitHub Secret |
| `R2_SECRET_ACCESS_KEY` | R2 secret key | GitHub Secret |
| `R2_BUCKET_NAME` | R2 bucket name | GitHub Secret |
| `NODE_ENV` | Node environment | Set in serverless.yml |

---

## Additional Resources

- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [Serverless Framework Docs](https://www.serverless.com/framework/docs/)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [PayMongo API Reference](https://developers.paymongo.com/reference/create-payment-intent/)

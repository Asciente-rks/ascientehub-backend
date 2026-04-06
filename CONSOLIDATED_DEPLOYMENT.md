# Consolidated Lambda Deployment - Single Backend API

## Overview

All functionality is now consolidated into a **single backend Lambda function**:
- ✅ All REST API endpoints
- ✅ File uploads directly to Cloudflare R2
- ✅ Database operations
- ✅ Payment processing
- ✅ User management

---

## AWS Cleanup: Delete Old Upload Handler

You need to manually delete the old `asciente-upload-handler` Lambda function from AWS:

### Via AWS Console (Easy)
1. Go to **AWS Lambda Console**
2. Click **Functions** in the left sidebar
3. Find `asciente-upload-handler`
4. Click **Delete** button at the top
5. Confirm deletion

### Via AWS CLI
```bash
aws lambda delete-function \
  --function-name asciente-upload-handler \
  --region us-east-1
```

---

## GitHub Secrets Update

Add one new secret for R2 public URL:

**New Secret:**
| Secret Name | Value | Example |
|------------|-------|---------|
| `R2_PUBLIC_URL` | Public base URL for R2 bucket | `https://cdn.yourdomain.com` or `https://asciente-hub.xxx.r2.cloudflarestorage.com` |

To add via GitHub UI:
1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add `R2_PUBLIC_URL`

Or via CLI:
```bash
gh secret set R2_PUBLIC_URL --body "https://your-r2-public-url"
```

---

## Updated Deployment Flow

```
GitHub Actions Workflow (deploy-lambda.yml)
    ↓
Single Deploy Job: deploy-backend-api
    ├─ Checkout code
    ├─ Setup Node.js 20
    ├─ npm install
    ├─ npm run build (TypeScript → dist/)
    ├─ Deploy via Serverless Framework
    │   ├─ Creates/updates HTTP API
    │   ├─ Links to src/lambda.ts handler
    │   ├─ Injects all environment variables
    │   └─ Creates API Gateway endpoint
    └─ Done!

AWS Lambda (Single Function)
    └─ ascientehub-backend-dev-api
        ├─ Express server with caching
        ├─ Connection pooling to TiDB
        ├─ Direct R2 file uploads
        ├─ PayMongo payment integration
        └─ All 30+ API endpoints
```

---

## Upload Endpoints

Your backend now handles uploads directly. Update your frontend to use:

**File Upload Endpoint:**
```
POST https://<your-backend-api-url>/upload
```

**Request Format:**
```json
{
  "image": "base64-encoded-image-data",
  "folder": "game-covers"  // or "profile-pictures", "reviews", etc.
}
```

**Response:**
```json
{
  "url": "https://your-r2-public-url/game-covers/1234567-filename.png"
}
```

---

## Deployment Steps

### 1. Verify Changes
```bash
cd c:\Users\kirit\ascientehub-backend

# Check deleted folder is gone
ls lambda-upload  # Should show "not found"

# Check workflow is updated
cat .github/workflows/deploy-lambda.yml | grep "deploy-upload"  # Should show nothing
```

### 2. Add GitHub Secret
```powershell
# Via GitHub UI or CLI
gh secret set R2_PUBLIC_URL --body "https://your-r2-bucket-url"
```

### 3. Commit & Deploy
```bash
git add .
git commit -m "Consolidate into single backend Lambda deployment"
git push origin main
```

### 4. Monitor Workflow
- GitHub **Actions** tab → watch `deploy-backend-api` job
- Should complete in 5-7 minutes

### 5. Test New Endpoint
```bash
# Get the new Lambda API URL from AWS Lambda console
API_URL="https://your-backend-api-url"

# Test a regular endpoint
curl $API_URL/health

# Test upload endpoint
curl -X POST $API_URL/upload \
  -H "Content-Type: application/json" \
  -d '{
    "image": "data:image/png;base64,...",
    "folder": "test"
  }'
```

---

## Environment Variables (Updated)

Your backend Lambda now needs these environment variables (all set in GitHub Secrets):

| Variable | Used For |
|----------|----------|
| `DB_HOST` | TiDB database connection |
| `DB_USER` | Database user |
| `DB_PASSWORD` | Database password |
| `DB_NAME` | Database name |
| `DB_PORT` | Database port (4000 for TiDB) |
| `PAYMONGO_SECRET_KEY` | Payment processing |
| `PAYMONGO_PUBLIC_KEY` | Payment processing |
| `JWT_SECRET` | User authentication |
| `R2_ENDPOINT` | Cloudflare R2 endpoint |
| `R2_ACCESS_KEY_ID` | R2 authentication |
| `R2_SECRET_ACCESS_KEY` | R2 authentication |
| `R2_BUCKET_NAME` | R2 bucket name |
| `R2_PUBLIC_URL` | **NEW** - Public URL for uploaded files |
| `NODE_ENV` | Set to "production" (in serverless.yml) |

---

## API Overview

Your backend Lambda exposes all endpoints on a single API:

**Base URL:** `https://<backend-api-url>`

### File Uploads
- `POST /upload` - Upload file directly to R2

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout

### Games & Store
- `GET /games` - List all games
- `GET /games/:id` - Get game details
- `POST /games` - Create game (admin)

### Shopping Cart & Checkout
- `POST /cart/add` - Add to cart
- `GET /cart` - View cart
- `POST /cart/checkout` - Checkout
- `GET /transactions` - Purchase history

### User Library
- `GET /user/library` - User's purchased games
- `POST /games/:id/library` - Add to library

### Profile
- `GET /user/profile` - Get profile
- `PUT /user/profile` - Update profile
- `POST /user/avatar` - Upload avatar

### Payments
- `GET /payment/methods` - List saved cards
- `POST /payment/methods` - Add card
- `DELETE /payment/methods/:id` - Delete card
- `PUT /payment/methods/:id/default` - Set default card

### Reviews
- `POST /games/:id/reviews` - Create review
- `GET /games/:id/reviews` - Get reviews
- `DELETE /reviews/:id` - Delete review

### Admin
- `POST /admin/games` - Create game
- `PUT /admin/games/:id` - Edit game
- `DELETE /admin/games/:id` - Delete game
- `GET /admin/users` - List users
- `GET /admin/transactions` - View all transactions

---

## Troubleshooting

### Upload Fails with 413 Payload Too Large
- ✅ No longer an issue - uploads handled directly in Lambda now
- File size limit: 50MB (Lambda timeout may limit larger files)

### R2_PUBLIC_URL Not Set
Add `R2_PUBLIC_URL` secret and redeploy:
```bash
gh secret set R2_PUBLIC_URL --body "YOUR_R2_PUBLIC_URL"
git push  # Trigger redeploy
```

### Upload Returns Wrong URL
Check that `R2_PUBLIC_URL` in GitHub Secrets matches your R2 bucket's public URL

### Lambda Timeout on Large Uploads
Increase timeout in `serverless.yml`:
```yaml
provider:
  timeout: 60  # Increase from 30 to 60 seconds
```

---

## Before & After

| Aspect | Before | After |
|--------|--------|-------|
| **Functions** | 2 (Upload + API) | 1 (Unified API) |
| **Complexity** | 2 deployments | 1 deployment |
| **Upload Endpoint** | Separate Lambda URL | Backend API `/upload` |
| **Deployment Time** | 10-12 min | 5-7 min |
| **File Size Limit** | No Lambda payload limit | 50MB (optimal) |

---

## Files Changed

**Deleted:**
- `lambda-upload/` folder (deleted from git)

**Modified:**
- `.github/workflows/deploy-lambda.yml` - Removed upload handler job
- `serverless.yml` - Added R2_PUBLIC_URL environment variable

**No Changes Needed:**
- `src/lambda.ts` - Still works as-is
- `src/services/storage.service.ts` - Already handles R2 uploads
- `src/controllers/` - API endpoints unchanged

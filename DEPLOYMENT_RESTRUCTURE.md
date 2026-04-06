# AWS Lambda Deployment Restructure Summary

## 🔧 What Was Fixed

### 1. **GitHub Actions Workflow** (`.github/workflows/deploy-lambda.yml`)

**Before:**

- ❌ Used wrong secret name: `AWS_SECRET_KEY` instead of `AWS_ACCESS_KEY_ID`
- ❌ Environment variables not passed to Lambda after deployment
- ❌ Only deployed upload handler; backend API not in workflow
- ❌ No error handling or logging
- ❌ Manual zip didn't include node_modules properly

**After:**

- ✅ Correct AWS credential names (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
- ✅ **Upload Handler**:
  - Zips code + node_modules without duplication
  - Deploys function code
  - Updates Lambda environment variables after deployment
- ✅ **Backend API**:
  - Full TypeScript build step
  - Deploys via Serverless Framework (automatic Lambda creation)
  - All environment variables injected during deployment
- ✅ Both deployments run in parallel jobs (faster)
- ✅ Clear error messages and logging

### 2. **Serverless Configuration** (`serverless.yml`)

**Before:**

- ❌ Missing some environment variables (JWT_SECRET, R2 credentials)
- ❌ No memory or timeout configuration
- ❌ Unclear stage/region settings

**After:**

- ✅ **All environment variables included**:
  - Database (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT)
  - Payments (PAYMONGO_SECRET_KEY, PAYMONGO_PUBLIC_KEY)
  - JWT (JWT_SECRET)
  - R2 Storage (R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME)
- ✅ Memory: 512 MB (sufficient for Express + Sequelize)
- ✅ Timeout: 30 seconds (for database queries + API responses)
- ✅ Clear stage and region configuration

---

## 📋 Required GitHub Secrets

Create these secrets in GitHub **Settings → Secrets and variables → Actions**:

| Secret Name             | Value                          | Example                                         |
| ----------------------- | ------------------------------ | ----------------------------------------------- |
| `AWS_ACCESS_KEY_ID`     | AWS IAM user access key        | `AKIA2JXXXXXX`                                  |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM user secret key        | `wJal+xxxxx/xxxxx`                              |
| `AWS_REGION`            | Deployment region              | `us-east-1`                                     |
| `DB_HOST`               | TiDB Serverless endpoint       | `gateway01234.us-west-2.prod.aws.tidbcloud.com` |
| `DB_USER`               | Database username              | `root`                                          |
| `DB_PASSWORD`           | Database password              | `YourPassword123!`                              |
| `DB_NAME`               | Database name                  | `ascientehub`                                   |
| `DB_PORT`               | Database port                  | `4000`                                          |
| `PAYMONGO_SECRET_KEY`   | PayMongo secret API key        | `sk_live_xxx`                                   |
| `PAYMONGO_PUBLIC_KEY`   | PayMongo public API key        | `pk_live_xxx`                                   |
| `JWT_SECRET`            | Random secret for signing JWTs | `a1b2c3d4e5f6...` (32+ chars)                   |
| `R2_ENDPOINT`           | Cloudflare R2 endpoint         | `https://abc123.r2.cloudflarestorage.com`       |
| `R2_ACCESS_KEY_ID`      | R2 API token access key        | `xxx`                                           |
| `R2_SECRET_ACCESS_KEY`  | R2 API token secret key        | `xxx`                                           |
| `R2_BUCKET_NAME`        | R2 bucket name                 | `asciente-hub`                                  |

---

## 🚀 How to Deploy

### Option 1: Using PowerShell Script (Windows - Recommended)

```powershell
# Run the interactive setup script
.\setup-secrets.ps1
```

### Option 2: Using Bash Script (Linux/Mac)

```bash
# Make it executable
chmod +x setup-secrets.sh

# Run the interactive setup script
./setup-secrets.sh
```

### Option 3: Manual Setup via GitHub UI

1. Go to repository **Settings**
2. Click **Secrets and variables** → **Actions**
3. Click **New repository secret** for each value
4. Enter secret name and value

### Step 4: Trigger Deployment

```bash
git add .
git commit -m "Add serverless Lambda deployment configuration"
git push origin main
```

The GitHub Actions workflow will automatically:

1. Deploy upload handler lambda
2. Deploy backend API lambda
3. Configure all environment variables
4. Make both services accessible via Lambda URLs

---

## 📊 Deployment Architecture

```
GitHub Repository (main branch)
          ↓
GitHub Actions Workflow
    ├─ Job 1: Deploy Upload Handler
    │   ├─ Checkout code
    │   ├─ Install Node.js 20
    │   ├─ npm install (in lambda-upload/)
    │   ├─ Zip lambda-upload + node_modules
    │   ├─ Deploy to AWS Lambda: asciente-upload-handler
    │   └─ Update environment variables (R2 creds)
    │
    └─ Job 2: Deploy Backend API
        ├─ Checkout code
        ├─ Install Node.js 20
        ├─ npm install (root)
        ├─ npm run build (TypeScript → JavaScript)
        ├─ Deploy with Serverless Framework
        ├─ Create HTTP API endpoint
        └─ Inject environment variables

AWS Lambda Services
├─ asciente-upload-handler (Function URL)
│   └─ Handles direct R2 uploads
│
└─ ascientehub-backend-dev-api (HTTP API)
    ├─ Express.js server
    ├─ All REST endpoints
    ├─ Database connection pooling
    └─ Payment processing
```

---

## 🔍 API Endpoints After Deployment

After successful deployment, you'll have:

### Upload Handler

- Function URL: `https://<unique-id>.lambda-url.<region>.on.aws/`
- Endpoint: `POST /` with multipart form data

### Backend API

- HTTP API URL: `https://<api-id>.execute-api.<region>.amazonaws.com/`
- All routes available:
  - `POST /auth/register`
  - `POST /auth/login`
  - `GET /games`
  - `POST /games/:id/reviews`
  - `POST /cart/checkout`
  - `GET /user/library`
  - etc.

---

## 🛠️ Monitoring & Troubleshooting

### View Deployment Logs

1. GitHub Actions tab → click the workflow run
2. View logs for each job
3. Check for deployment success/failure

### View Lambda Execution Logs

```bash
# For upload handler
aws logs tail /aws/lambda/asciente-upload-handler --follow

# For backend API
aws logs tail /aws/lambda/ascientehub-backend-dev-api --follow
```

### Common Issues & Fixes

**Error: "Invalid AWS credentials"**

- ✅ Verify `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are correct
- ✅ Check IAM user has Lambda permissions

**Error: "Database connection timeout"**

- ✅ Verify `DB_HOST`, `DB_USER`, `DB_PASSWORD` are correct
- ✅ Check TiDB Serverless is running and accessible
- ✅ Verify Lambda security group allows database connections

**Error: "R2 upload failed"**

- ✅ Verify R2 credentials in upload handler Lambda environment
- ✅ Check bucket name is correct
- ✅ Verify bucket exists

**Error: "Serverless deployment failed"**

- ✅ Run `npm run build` locally to test TypeScript compilation
- ✅ Check `serverless.yml` syntax
- ✅ Verify AWS credentials have CloudFormation permissions

---

## 📖 Additional Resources

- [Deployment Setup Guide](./DEPLOYMENT_SETUP.md)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [Serverless Framework Guide](https://www.serverless.com/framework/docs/)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

## ✅ Verification Checklist

- [ ] All 15 GitHub Secrets configured
- [ ] Changes committed and pushed to main
- [ ] GitHub Actions workflow completed successfully
- [ ] Both Lambda functions appear in AWS Lambda console
- [ ] Upload handler has environment variables set
- [ ] Backend API Lambda has environment variables set
- [ ] Lambda URLs are accessible
- [ ] API endpoints return expected responses

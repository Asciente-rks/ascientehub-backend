# 🚀 Quick Start Deployment Checklist

Complete these steps in order to get your Lambda deployment running:

## Phase 1: Local Verification ✅

- [ ] **Navigate to project directory**

  ```bash
  cd c:\Users\kirit\ascientehub-backend
  ```

- [ ] **Verify TypeScript compilation**

  ```bash
  npm run build
  npx tsc --noEmit
  ```

  ✅ Should complete with no errors

- [ ] **Verify all files exist**
  ```bash
  # Check these files exist:
  ls src/lambda.ts              # Lambda handler
  ls serverless.yml             # Serverless config
  ls lambda-upload/index.mjs    # Upload handler
  ls .github/workflows/deploy-lambda.yml  # Workflow
  ```

## Phase 2: GitHub Secrets Configuration 🔐

- [ ] **Have these values ready**
  - ✏️ AWS Access Key ID
  - ✏️ AWS Secret Access Key
  - ✏️ AWS Region (us-east-1)
  - ✏️ TiDB Host, User, Password, Port
  - ✏️ PayMongo Secret Key & Public Key
  - ✏️ Cloudflare R2 credentials (3 values)
  - ✏️ JWT Secret (or generate new)

- [ ] **Choose setup method:**

  **Option A: PowerShell (Windows) - Easiest**

  ```powershell
  .\setup-secrets.ps1
  ```

  ↓ Follow the interactive prompts

  **Option B: Manual GitHub UI**
  1. Open GitHub → Your Repository → Settings
  2. Click "Secrets and variables" → "Actions"
  3. Click "New repository secret"
  4. Add each secret from the table in DEPLOYMENT_SETUP.md

  **Option C: GitHub CLI (if installed)**

  ```bash
  gh secret set AWS_ACCESS_KEY_ID --body "your-key"
  gh secret set AWS_SECRET_ACCESS_KEY --body "your-secret"
  # ... (repeat for all 15 secrets)
  ```

## Phase 3: Commit & Deploy 📤

- [ ] **Stage all changes**

  ```bash
  git add .
  ```

- [ ] **View what's about to commit**

  ```bash
  git status
  ```

  ✅ Should show:
  - `.github/workflows/deploy-lambda.yml` (modified)
  - `src/lambda.ts` (exists)
  - `serverless.yml` (exists/modified)
  - `DEPLOYMENT_SETUP.md` (new)
  - `setup-secrets.ps1` (new)
  - `setup-secrets.sh` (new)

- [ ] **Commit with descriptive message**

  ```bash
  git commit -m "Add serverless Lambda deployment with improved CI/CD pipeline"
  ```

- [ ] **Push to main branch**
  ```bash
  git push origin main
  ```

## Phase 4: Monitor Deployment 👀

- [ ] **Open GitHub Actions**
  1. Go to your GitHub repository
  2. Click "Actions" tab
  3. You should see "Deploy Lambda" workflow running

- [ ] **Watch both jobs**
  - ⏳ "deploy-upload-handler" (3-5 minutes)
  - ⏳ "deploy-backend-api" (5-7 minutes)

- [ ] **Check for success**
  - ✅ Both jobs show green checkmarks
  - ✅ No red error indicators
  - If any job fails, click it to see detailed error logs

## Phase 5: Verify Deployment ✔️

Once workflow completes successfully:

- [ ] **Get Lambda URLs from AWS Console**
  1. Go to AWS Lambda console
  2. Upload Handler: Find `asciente-upload-handler` function
     - Click "Configuration" → "Function URL"
     - Copy the URL
  3. Backend API: Find `ascientehub-backend-dev-api` function
     - Note the API endpoint

- [ ] **Test upload handler**

  ```bash
  curl -X POST https://<your-upload-handler-url> \
    -H "Content-Type: application/json" \
    -d '{"image":"data:image/png;base64,...","folder":"test"}'
  ```

  ✅ Should return success with file URL

- [ ] **Test backend API**

  ```bash
  # Test health endpoint
  curl https://<your-backend-api-url>/health

  # Test games list
  curl https://<your-backend-api-url>/games
  ```

  ✅ Should return JSON responses

## Phase 6: Update Frontend Configuration 🎨

- [ ] **Update frontend environment variables**

  ```env
  REACT_APP_API_BASE_URL=https://<your-backend-api-url>
  REACT_APP_UPLOAD_URL=https://<your-upload-handler-url>
  ```

- [ ] **Test full payment flow**
  1. Register new user
  2. Add game to cart
  3. Checkout with PayMongo test card
  4. Verify transaction saved in database

## 🎉 You're Done!

Your Lambda deployment is now live and ready to serve your application!

---

## 📚 Troubleshooting Quick Links

| Issue                     | Solution                                  |
| ------------------------- | ----------------------------------------- |
| Secrets not applying      | Re-run workflow after setting secrets     |
| Deployment fails          | Check Actions logs for detailed error     |
| Database connection fails | Verify DB credentials and TiDB is running |
| R2 upload fails           | Check R2 credentials in Lambda env vars   |
| TypeScript errors         | Run `npm run build` locally first         |
| Lambda timeout            | Increase timeout in serverless.yml        |

---

## 💾 Files Created/Modified

**New Files:**

- `src/lambda.ts` - Lambda handler
- `serverless.yml` - Serverless config
- `.github/workflows/deploy-lambda.yml` - Improved workflow
- `DEPLOYMENT_SETUP.md` - Setup guide
- `DEPLOYMENT_RESTRUCTURE.md` - Architecture docs
- `setup-secrets.ps1` - PowerShell setup script
- `setup-secrets.sh` - Bash setup script

**Modified Files:**

- `package.json` - Added Lambda dependencies
- `tsconfig.json` - Already configured for Lambda

---

## 📞 Need Help?

1. Check **DEPLOYMENT_SETUP.md** for detailed configuration guide
2. Review **GitHub Actions** logs for specific error messages
3. Check AWS Lambda console for function logs
4. Verify all 15 GitHub Secrets are configured

---

**Current Status:** ✅ Ready for deployment
**Next Action:** Run `setup-secrets.ps1` or manually add GitHub Secrets
**Estimated Time:** 10-15 minutes total

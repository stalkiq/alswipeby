# 🎯 Next Steps - AWS Deployment

## ✅ What's Been Done

I've completed the full AWS infrastructure setup with AWS CDK:

### Infrastructure Created:
- ✅ AWS CDK TypeScript project with proper configuration
- ✅ DynamoDB table (`AlswipebyBusinessData`) with:
  - Partition key: `docId`
  - Global Secondary Index on `createdAt`
  - Pay-per-request billing
  - Point-in-time recovery enabled
- ✅ Two Lambda functions (Node.js 20):
  - `alswipeby-get-business-data` (fetch all records)
  - `alswipeby-save-business-data` (save records)
- ✅ API Gateway REST API with:
  - `GET /businesses` endpoint
  - `POST /businesses/save` endpoint
  - CORS enabled
  - Throttling configured
- ✅ S3 bucket for static hosting
- ✅ CloudFront distribution for CDN

### Application Updates:
- ✅ Created `src/lib/aws-dynamodb.ts` (DynamoDB client)
- ✅ Updated `src/app/page.tsx` to use AWS backend
- ✅ Updated `src/app/actions.ts` to use AWS backend
- ✅ Fallback to mock data when API not configured

### CI/CD:
- ✅ GitHub Actions workflow (`.github/workflows/deploy.yml`)
- ✅ Automatic deployment on push to main branch

### Documentation:
- ✅ `DEPLOYMENT.md` - Complete deployment guide
- ✅ `QUICK_START.md` - 5-minute quick start
- ✅ `infrastructure/README.md` - Infrastructure documentation
- ✅ Updated main `README.md`
- ✅ `env.example` - Environment variables template

## 🚀 What You Need to Do Now

### Step 1: Get AWS Access Keys (5 minutes)

1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Click **Users** → **Create user**
3. Name: `alswipeby-deployer`
4. Enable: **Access key - Programmatic access**
5. Attach policy: `AdministratorAccess` (or create custom policy)
6. **Download and save the credentials:**
   - Access Key ID
   - Secret Access Key

### Step 2: Configure AWS CLI (2 minutes)

```bash
aws configure
```

Enter:
- Access Key ID: `<from Step 1>`
- Secret Access Key: `<from Step 1>`
- Region: `us-east-1`
- Output: `json`

Verify:
```bash
aws sts get-caller-identity
# Should show account: 016442247702
```

### Step 3: Deploy Infrastructure (10 minutes)

```bash
# Navigate to infrastructure
cd infrastructure

# Install dependencies
npm install

# Bootstrap CDK (first time only)
npx cdk bootstrap aws://016442247702/us-east-1

# Install Lambda dependencies
cd lambda/get-business-data && npm install
cd ../save-business-data && npm install
cd ../..

# Deploy everything
npm run deploy
```

**Wait for deployment (~5-10 minutes)**

### Step 4: Configure Application (2 minutes)

After deployment completes, you'll see outputs like:

```
Outputs:
AlswipebyStack.ApiGatewayUrl = https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod
```

**Copy the API Gateway URL**, then:

```bash
# Go back to project root
cd ..

# Create .env.local
cp env.example .env.local

# Edit .env.local and paste your API Gateway URL
# Use nano, vim, or your favorite editor:
nano .env.local
```

Paste:
```env
NEXT_PUBLIC_API_GATEWAY_URL=https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod
API_GATEWAY_URL=https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod
```

Save and exit.

### Step 5: Test Locally (2 minutes)

```bash
# Restart dev server (if running, Ctrl+C first)
npm run dev
```

Open http://localhost:9002

**Test the persistence:**
1. Add a new row
2. Fill in some data
3. Click **Save**
4. Wait for success message
5. Close browser or refresh page
6. ✅ Data should still be there!

### Step 6: Set Up GitHub Auto-Deploy (5 minutes)

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add two secrets:

**Secret 1:**
- Name: `AWS_ACCESS_KEY_ID`
- Value: `<your access key from Step 1>`

**Secret 2:**
- Name: `AWS_SECRET_ACCESS_KEY`
- Value: `<your secret key from Step 1>`

5. Commit and push your changes:

```bash
git add .
git commit -m "Add AWS infrastructure and deployment"
git push origin main
```

6. Go to **Actions** tab on GitHub
7. Watch your app deploy automatically! 🎉

### Step 7: Access Your Live App

After GitHub Actions completes, your app will be available at:

```
https://YOUR_CLOUDFRONT_DOMAIN.cloudfront.net
```

(CloudFront domain shown in CDK deployment outputs)

## 🎉 You're Done!

Your app now has:
- ✅ Persistent data storage in AWS DynamoDB
- ✅ Serverless API with Lambda + API Gateway
- ✅ Global CDN with CloudFront
- ✅ Automatic deployments via GitHub Actions
- ✅ Secure, scalable infrastructure
- ✅ Costs ~$1-2/month (free for first year with AWS Free Tier)

## 📚 Additional Resources

- **Full deployment guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Quick start**: [QUICK_START.md](./QUICK_START.md)
- **Infrastructure docs**: [infrastructure/README.md](./infrastructure/README.md)
- **Troubleshooting**: [DEPLOYMENT.md#troubleshooting](./DEPLOYMENT.md#-troubleshooting)

## 🐛 Troubleshooting

### "Command not found: aws"
Install AWS CLI: https://aws.amazon.com/cli/

### "Unable to locate credentials"
Run `aws configure` again with your access keys

### "Stack already exists"
Someone may have deployed already. Run:
```bash
cd infrastructure
npm run destroy  # Delete existing stack
npm run deploy   # Deploy fresh
```

### Lambda deployment errors
Make sure Lambda dependencies are installed:
```bash
cd infrastructure/lambda/get-business-data && npm install
cd ../save-business-data && npm install
```

### API returns 403 Forbidden
Wait a few minutes for CloudFormation to complete. Then check:
```bash
aws apigateway get-rest-apis --region us-east-1
```

## 💡 Pro Tips

1. **Monitor costs**: Set up AWS Cost Alerts in billing console
2. **View logs**: Use CloudWatch Logs to debug Lambda functions
3. **Test API**: Use Postman or curl to test API endpoints directly
4. **Backup data**: DynamoDB has point-in-time recovery enabled
5. **Scale up**: DynamoDB auto-scales, but you can adjust Lambda memory if needed

## 🆘 Need Help?

Check the logs:
```bash
# Lambda logs
aws logs tail /aws/lambda/alswipeby-get-business-data --follow

# CloudFormation events
aws cloudformation describe-stack-events --stack-name AlswipebyStack
```

Or review the detailed troubleshooting in [DEPLOYMENT.md](./DEPLOYMENT.md#-troubleshooting).

---

**Happy deploying! 🚀**


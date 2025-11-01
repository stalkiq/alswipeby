# 🚀 AWS Deployment Guide

Complete guide to deploy the Alswipeby spreadsheet application to AWS with persistent data storage.

## 📋 Overview

This application uses:
- **DynamoDB** for persistent data storage
- **Lambda** for serverless API functions
- **API Gateway** for REST API endpoints
- **S3 + CloudFront** for static hosting
- **GitHub Actions** for CI/CD automation

## 🎯 Prerequisites

Before starting, ensure you have:

- [x] AWS Account (ID: 016442247702)
- [x] AWS CLI installed ([Install Guide](https://aws.amazon.com/cli/))
- [x] Node.js 20+ installed
- [x] Git installed
- [x] GitHub account with this repo

## 📝 Step-by-Step Deployment

### Step 1: Create AWS IAM User

1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Click **Users** → **Create user**
3. Username: `alswipeby-deployer`
4. Check: **Programmatic access**
5. Click **Next**
6. Attach policies:
   - `AdministratorAccess` (for initial setup)
   - Or create custom policy with specific permissions
7. Click **Create user**
8. **SAVE** the credentials:
   - Access Key ID
   - Secret Access Key

### Step 2: Configure AWS CLI

Open terminal and run:

```bash
aws configure
```

Enter:
- **AWS Access Key ID**: (from Step 1)
- **AWS Secret Access Key**: (from Step 1)
- **Default region**: `us-east-1`
- **Default output format**: `json`

Verify configuration:
```bash
aws sts get-caller-identity
```

You should see your account ID: `016442247702`

### Step 3: Bootstrap AWS CDK

First time only - initialize CDK in your AWS account:

```bash
cd infrastructure
npm install
npx cdk bootstrap aws://016442247702/us-east-1
```

### Step 4: Install Lambda Dependencies

```bash
cd lambda/get-business-data
npm install --production

cd ../save-business-data
npm install --production

cd ../..
```

### Step 5: Deploy Infrastructure

```bash
npm run deploy
```

This will create:
- ✅ DynamoDB table
- ✅ 2 Lambda functions
- ✅ API Gateway REST API
- ✅ S3 bucket
- ✅ CloudFront distribution

**Wait 5-10 minutes** for deployment to complete.

### Step 6: Get API Gateway URL

After deployment, you'll see outputs:

```
Outputs:
AlswipebyStack.ApiGatewayUrl = https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod
AlswipebyStack.CloudFrontDistributionDomain = d1234567890.cloudfront.net
AlswipebyStack.DynamoDBTableName = AlswipebyBusinessData
AlswipebyStack.S3BucketName = alswipeby-website-016442247702
```

**Copy the `ApiGatewayUrl`** - you'll need it!

### Step 7: Configure Next.js App

Create `.env.local` file in project root:

```bash
cd ..
cp env.example .env.local
```

Edit `.env.local` and paste your API Gateway URL:

```env
NEXT_PUBLIC_API_GATEWAY_URL=https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod
API_GATEWAY_URL=https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod
```

### Step 8: Test Locally

```bash
npm run dev
```

Open http://localhost:9002

Try:
1. Add a row
2. Fill in data
3. Click **Save**
4. Refresh the page
5. ✅ Data should persist!

### Step 9: Set Up GitHub Actions (CI/CD)

1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**

2. Add the following secrets:
   - `AWS_ACCESS_KEY_ID` = (from Step 1)
   - `AWS_SECRET_ACCESS_KEY` = (from Step 1)

3. Push your code:

```bash
git add .
git commit -m "Add AWS infrastructure and deployment"
git push origin main
```

4. Go to **Actions** tab on GitHub
5. Watch the deployment run automatically! 🎉

### Step 10: Access Your Live Site

After GitHub Actions completes:

**Option A - CloudFront (Recommended):**
```
https://YOUR_DISTRIBUTION_ID.cloudfront.net
```

**Option B - S3 Website:**
```
http://alswipeby-website-016442247702.s3-website-us-east-1.amazonaws.com
```

## 🔧 Configuration

### Custom Domain (Optional)

To use your own domain:

1. Register domain in Route 53
2. Request SSL certificate in ACM (us-east-1)
3. Update CDK stack:

```typescript
// In lib/alswipeby-stack.ts
const distribution = new cloudfront.Distribution(this, 'WebsiteDistribution', {
  domainNames: ['app.yourdomain.com'],
  certificate: certificate,
  // ... rest of config
});
```

4. Create Route 53 A record pointing to CloudFront

### Environment Variables

Create `.env.local`:

```env
# Required
NEXT_PUBLIC_API_GATEWAY_URL=https://xxxxx.execute-api.us-east-1.amazonaws.com/prod
API_GATEWAY_URL=https://xxxxx.execute-api.us-east-1.amazonaws.com/prod

# Optional
DYNAMODB_TABLE_NAME=AlswipebyBusinessData
AWS_REGION=us-east-1
```

## 🧪 Testing

### Test API Gateway

```bash
# Get data
curl https://YOUR_API_URL/businesses

# Save data
curl -X POST https://YOUR_API_URL/businesses/save \
  -H "Content-Type: application/json" \
  -d '{"data":[{"businessName":"Test","street":"123 Main","city":"NYC","zip":"10001","phone":"555-1234","category":"Restaurant","facebookUrl":"","facebookLastPost":"","instagramUrl":"","instagramPresent":"No","website":"","onlineOn":"","notes":""}]}'
```

### Test Lambda Functions

```bash
# Invoke GET Lambda
aws lambda invoke \
  --function-name alswipeby-get-business-data \
  --region us-east-1 \
  output.json && cat output.json

# Invoke POST Lambda
aws lambda invoke \
  --function-name alswipeby-save-business-data \
  --region us-east-1 \
  --payload '{"body":"{\"data\":[{\"businessName\":\"Test\"}]}"}' \
  output.json && cat output.json
```

## 📊 Monitoring

### CloudWatch Logs

```bash
# Lambda logs
aws logs tail /aws/lambda/alswipeby-get-business-data --follow
aws logs tail /aws/lambda/alswipeby-save-business-data --follow
```

### DynamoDB Table

```bash
# View all items
aws dynamodb scan --table-name AlswipebyBusinessData

# Get item count
aws dynamodb describe-table --table-name AlswipebyBusinessData \
  --query 'Table.ItemCount'
```

### API Gateway Metrics

1. Go to [API Gateway Console](https://console.aws.amazon.com/apigateway/)
2. Select your API
3. Click **Dashboard** for metrics

## 💰 Cost Breakdown

**Monthly estimates (low traffic):**

| Service | Usage | Cost |
|---------|-------|------|
| DynamoDB | 1GB storage, 10K reads/writes | $0.25 |
| Lambda | 100K invocations | $0.20 |
| API Gateway | 100K requests | $0.35 |
| S3 | 5GB storage | $0.12 |
| CloudFront | 10GB transfer | $0.85 |
| **Total** | | **~$1.77/month** |

**Free tier covers most costs for first 12 months!**

## 🐛 Troubleshooting

### Issue: API returns 403 Forbidden

**Solution**: Check CORS configuration in API Gateway

```bash
cd infrastructure
# Update lib/alswipeby-stack.ts CORS settings
npm run deploy
```

### Issue: Lambda timeout

**Solution**: Increase timeout

```typescript
// In lib/alswipeby-stack.ts
timeout: cdk.Duration.seconds(60)
```

### Issue: DynamoDB throttling

**Solution**: Already using on-demand billing, but you can add more read/write capacity:

```typescript
// In lib/alswipeby-stack.ts
billingMode: dynamodb.BillingMode.PROVISIONED,
readCapacity: 5,
writeCapacity: 5,
```

### Issue: "No API Gateway URL"

**Solution**: Check CDK outputs

```bash
aws cloudformation describe-stacks \
  --stack-name AlswipebyStack \
  --query 'Stacks[0].Outputs'
```

### Issue: GitHub Actions fails

**Solution**: Check secrets are set correctly
1. GitHub repo → Settings → Secrets
2. Verify `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
3. Check Actions logs for specific error

## 🔒 Security Best Practices

1. **Restrict CORS** (Production):
```typescript
allowOrigins: ['https://yourdomain.com']
```

2. **Use IAM Roles** (Production):
- Remove access keys from GitHub secrets
- Use GitHub OIDC provider
- Grant temporary credentials

3. **Enable WAF** (Optional):
```typescript
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';

const webAcl = new wafv2.CfnWebACL(this, 'WebAcl', {
  scope: 'CLOUDFRONT',
  defaultAction: { allow: {} },
  // Add rules for rate limiting, IP blocking, etc.
});
```

4. **Enable CloudTrail**: Track all API calls
5. **Enable GuardDuty**: Threat detection
6. **Rotate credentials**: Every 90 days

## 🗑️ Clean Up

To delete all resources and stop charges:

```bash
cd infrastructure
npm run destroy
```

⚠️ **WARNING**: This will permanently delete:
- All data in DynamoDB
- S3 bucket contents
- Lambda functions
- API Gateway
- CloudFront distribution

**Confirm**: Type `y` when prompted

## 📚 Additional Resources

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [API Gateway CORS](https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-cors.html)
- [CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)

## 🆘 Support

If you encounter issues:

1. Check CloudWatch Logs
2. Review AWS CloudFormation console
3. Verify IAM permissions
4. Test API endpoints manually
5. Check GitHub Actions logs

## 🎉 Success Checklist

- [x] AWS CLI configured
- [x] CDK bootstrapped
- [x] Infrastructure deployed
- [x] API Gateway URL obtained
- [x] .env.local configured
- [x] Local testing successful
- [x] GitHub secrets configured
- [x] CI/CD pipeline working
- [x] Data persists after page refresh
- [x] CloudFront distribution accessible

**Congratulations! Your application is now live on AWS with persistent storage! 🚀**


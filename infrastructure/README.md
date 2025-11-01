# Alswipeby Infrastructure

AWS CDK infrastructure for the Alswipeby spreadsheet application.

## Architecture

```
┌──────────────┐      ┌───────────────┐
│ CloudFront   │──────│ S3 Bucket     │
│ (CDN)        │      │ (Next.js)     │
└──────────────┘      └───────────────┘
       │
       ▼
┌──────────────┐      ┌───────────────┐
│ API Gateway  │──────│ Lambda        │
│ (REST API)   │      │ Functions     │
└──────────────┘      └───────────────┘
                             │
                             ▼
                      ┌───────────────┐
                      │  DynamoDB     │
                      │  (Database)   │
                      └───────────────┘
```

## Components

### DynamoDB Table
- **Name**: `AlswipebyBusinessData`
- **Partition Key**: `docId` (String)
- **Billing**: Pay-per-request (On-demand)
- **Features**: Point-in-time recovery, AWS managed encryption

### Lambda Functions
1. **get-business-data**: Fetches all business records from DynamoDB
2. **save-business-data**: Saves/updates business records in DynamoDB

### API Gateway
- **Type**: REST API
- **Stage**: prod
- **CORS**: Enabled for all origins
- **Endpoints**:
  - `GET /businesses` - Fetch all data
  - `POST /businesses/save` - Save data

### S3 + CloudFront
- **S3 Bucket**: Hosts Next.js static assets
- **CloudFront**: Global CDN for fast content delivery
- **Security**: Origin Access Identity (OAI) for secure S3 access

## Prerequisites

1. **AWS CLI**: Install from https://aws.amazon.com/cli/
2. **Node.js 20+**: Install from https://nodejs.org/
3. **AWS Account**: ID `016442247702`
4. **AWS Credentials**: Access key and secret key with admin permissions

## Setup

### 1. Configure AWS Credentials

```bash
aws configure
```

Enter your:
- AWS Access Key ID
- AWS Secret Access Key
- Default region: `us-east-1`
- Default output format: `json`

### 2. Install Dependencies

```bash
cd infrastructure
npm install
```

### 3. Install Lambda Dependencies

```bash
cd lambda/get-business-data && npm install
cd ../save-business-data && npm install
cd ../..
```

### 4. Bootstrap CDK (First time only)

```bash
npx cdk bootstrap aws://016442247702/us-east-1
```

## Deployment

### Deploy Infrastructure

```bash
npm run deploy
```

This will:
1. Create DynamoDB table
2. Deploy Lambda functions
3. Set up API Gateway
4. Create S3 bucket and CloudFront distribution

### View Outputs

After deployment, you'll see outputs like:

```
Outputs:
AlswipebyStack.ApiGatewayUrl = https://xxxxx.execute-api.us-east-1.amazonaws.com/prod
AlswipebyStack.DynamoDBTableName = AlswipebyBusinessData
AlswipebyStack.S3BucketName = alswipeby-website-016442247702
AlswipebyStack.CloudFrontDistributionDomain = dxxxxx.cloudfront.net
```

**Copy the ApiGatewayUrl** - you'll need it for the Next.js app!

## Update Next.js App

1. Create `.env.local` in the project root:

```bash
cd ..
cp env.example .env.local
```

2. Edit `.env.local` and add the API Gateway URL from CDK outputs:

```env
NEXT_PUBLIC_API_GATEWAY_URL=https://xxxxx.execute-api.us-east-1.amazonaws.com/prod
API_GATEWAY_URL=https://xxxxx.execute-api.us-east-1.amazonaws.com/prod
```

3. Restart your dev server:

```bash
npm run dev
```

## CDK Commands

```bash
npm run build      # Compile TypeScript
npm run watch      # Watch for changes
npm run cdk        # Run CDK CLI commands
npm run deploy     # Deploy stack
npm run synth      # Synthesize CloudFormation
npm run diff       # Compare deployed vs local
npm run destroy    # Delete all resources (careful!)
```

## Testing Locally

### Test Lambda Functions

```bash
# Test GET function
aws lambda invoke \
  --function-name alswipeby-get-business-data \
  --region us-east-1 \
  response.json

# Test POST function
aws lambda invoke \
  --function-name alswipeby-save-business-data \
  --region us-east-1 \
  --payload '{"body": "{\"data\":[{\"businessName\":\"Test\"}]}"}' \
  response.json
```

### Test API Gateway

```bash
# GET request
curl https://YOUR_API_URL/businesses

# POST request
curl -X POST https://YOUR_API_URL/businesses/save \
  -H "Content-Type: application/json" \
  -d '{"data":[{"businessName":"Test Business","street":"123 Main","city":"NYC","zip":"10001","phone":"555-1234","category":"Restaurant","facebookUrl":"","facebookLastPost":"","instagramUrl":"","instagramPresent":"No","website":"","onlineOn":"","notes":"Test note"}]}'
```

## Monitoring

### CloudWatch Logs

```bash
# Lambda logs
aws logs tail /aws/lambda/alswipeby-get-business-data --follow
aws logs tail /aws/lambda/alswipeby-save-business-data --follow

# API Gateway logs
aws logs tail API-Gateway-Execution-Logs_YOUR_API_ID/prod --follow
```

### DynamoDB

```bash
# Scan table
aws dynamodb scan --table-name AlswipebyBusinessData

# Get item count
aws dynamodb describe-table --table-name AlswipebyBusinessData \
  --query 'Table.ItemCount'
```

## Cost Estimation

**Monthly costs (approximate):**
- DynamoDB: $0.25 (25GB free tier)
- Lambda: $0.20 (1M free requests)
- API Gateway: $3.50 (1M requests)
- S3: $0.10 (50GB free tier)
- CloudFront: $0.85 (1GB free tier)

**Total: ~$1-5/month** for low-traffic usage

## Troubleshooting

### Issue: "Stack already exists"
```bash
npm run destroy
npm run deploy
```

### Issue: Lambda timeout
Increase timeout in `lib/alswipeby-stack.ts`:
```typescript
timeout: cdk.Duration.seconds(60)
```

### Issue: CORS errors
Check API Gateway CORS settings in the stack.

### Issue: "Access Denied"
Verify IAM permissions for your AWS credentials.

## Security Best Practices

1. **Never commit credentials**: Keep `.env.local` in `.gitignore`
2. **Use IAM roles**: In production, use IAM roles instead of access keys
3. **Restrict CORS**: Update `allowOrigins` to your domain only
4. **Enable WAF**: Add AWS WAF for API protection (optional)
5. **Enable encryption**: Already enabled for DynamoDB and S3

## Clean Up

To delete all resources and stop charges:

```bash
npm run destroy
```

⚠️ **Warning**: This will delete your DynamoDB table and all data!

## Support

For issues, check:
1. CloudWatch Logs
2. CloudFormation console
3. API Gateway test console


# ⚡ Quick Start Guide

Get your app deployed to AWS in under 15 minutes!

## Prerequisites

- AWS Account (ID: 016442247702)
- AWS CLI installed
- Node.js 20+

## 🚀 5-Minute Deployment

### 1. Configure AWS

```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Region: us-east-1
# Format: json
```

### 2. Deploy Infrastructure

```bash
cd infrastructure
npm install
npx cdk bootstrap aws://016442247702/us-east-1
cd lambda/get-business-data && npm install && cd ../save-business-data && npm install && cd ../..
npm run deploy
```

⏳ Wait 5-10 minutes...

### 3. Configure App

Copy the API Gateway URL from deployment output:

```bash
cd ..
cp env.example .env.local
# Edit .env.local and paste your API Gateway URL
```

### 4. Test Locally

```bash
npm run dev
```

Open http://localhost:9002 and test!

### 5. Set Up Auto-Deploy

1. Add GitHub secrets:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`

2. Push code:
```bash
git add .
git commit -m "Deploy to AWS"
git push origin main
```

Done! Your app auto-deploys on every push! 🎉

## 📖 Full Documentation

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete guide.


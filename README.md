# Alswipeby - Business Spreadsheet Manager

A modern spreadsheet application for managing business information with AWS backend and persistent data storage.

## 🌟 Features

- 📊 Excel-like interface for data entry
- 💾 Persistent storage with AWS DynamoDB
- 🚀 Serverless architecture (Lambda + API Gateway)
- 🔄 Auto-save functionality
- 📝 Notes system for each business
- ☁️ CloudFront CDN for fast global access
- 🔐 Secure and scalable
- 📱 Responsive design

## 🛠️ Tech Stack

**Frontend:**
- Next.js 15.3 (React 18 + TypeScript)
- TailwindCSS + shadcn/ui components
- Server Actions for data mutations

**Backend:**
- AWS DynamoDB (NoSQL Database)
- AWS Lambda (Serverless functions)
- API Gateway (REST API)
- S3 + CloudFront (Static hosting)

**Infrastructure:**
- AWS CDK (Infrastructure as Code)
- GitHub Actions (CI/CD)
- TypeScript

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start development server (with mock data)
npm run dev
```

Open http://localhost:9002

### Deploy to AWS

See [QUICK_START.md](./QUICK_START.md) for 5-minute deployment guide.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete AWS setup instructions.

## 📁 Project Structure

```
alswipeby/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Main page
│   │   ├── actions.ts            # Server actions
│   │   ├── layout.tsx            # Root layout
│   │   └── globals.css           # Global styles
│   ├── components/
│   │   ├── spreadsheet-table.tsx # Main spreadsheet component
│   │   └── ui/                   # shadcn/ui components
│   ├── lib/
│   │   ├── aws-dynamodb.ts       # AWS DynamoDB client
│   │   ├── types.ts              # TypeScript types
│   │   └── utils.ts              # Utility functions
│   └── hooks/                    # React hooks
├── infrastructure/               # AWS CDK infrastructure
│   ├── bin/
│   │   └── app.ts               # CDK app entry point
│   ├── lib/
│   │   └── alswipeby-stack.ts   # CDK stack definition
│   ├── lambda/
│   │   ├── get-business-data/   # GET Lambda function
│   │   └── save-business-data/  # POST Lambda function
│   ├── package.json
│   └── tsconfig.json
├── .github/workflows/
│   └── deploy.yml               # CI/CD pipeline
├── DEPLOYMENT.md                # Full deployment guide
├── QUICK_START.md               # Quick start guide
└── env.example                  # Environment variables template
```

## ⚙️ Configuration

### Environment Variables

Create `.env.local` in the project root:

```env
# Required for AWS backend
NEXT_PUBLIC_API_GATEWAY_URL=https://xxxxx.execute-api.us-east-1.amazonaws.com/prod
API_GATEWAY_URL=https://xxxxx.execute-api.us-east-1.amazonaws.com/prod

# Optional
DYNAMODB_TABLE_NAME=AlswipebyBusinessData
AWS_REGION=us-east-1
```

**Note**: Without these variables, the app will use mock in-memory data (useful for local development).

## 📜 Available Scripts

### Frontend

```bash
npm run dev         # Start development server (Turbopack)
npm run build       # Build for production
npm run start       # Start production server
npm run lint        # Run ESLint
npm run typecheck   # TypeScript type checking
```

### Infrastructure (AWS CDK)

```bash
cd infrastructure
npm run build       # Compile TypeScript
npm run deploy      # Deploy to AWS
npm run destroy     # Delete all AWS resources
npm run synth       # Generate CloudFormation template
npm run diff        # Compare local vs deployed stack
```

## 🏗️ Architecture

```
┌─────────────┐
│   GitHub    │ ──► Automatic deployment on push
└─────────────┘
       │
       ▼
┌────────────────────────────────────────────┐
│         AWS Account: 016442247702          │
│                                            │
│  ┌──────────────┐      ┌───────────────┐ │
│  │ CloudFront   │──────│ S3 Bucket     │ │
│  │ (CDN)        │      │ (Next.js SSR) │ │
│  └──────────────┘      └───────────────┘ │
│         │                                  │
│         ▼                                  │
│  ┌──────────────┐      ┌───────────────┐ │
│  │ API Gateway  │──────│ Lambda        │ │
│  │ (REST API)   │      │ Functions     │ │
│  └──────────────┘      └───────────────┘ │
│                               │            │
│                               ▼            │
│                        ┌───────────────┐  │
│                        │  DynamoDB     │  │
│                        │  (Database)   │  │
│                        └───────────────┘  │
└────────────────────────────────────────────┘
```

## 💰 Cost Estimate

**Monthly costs for low traffic (~1,000 requests/month):**

| Service | Cost |
|---------|------|
| DynamoDB | $0.25 |
| Lambda | $0.20 |
| API Gateway | $0.35 |
| S3 | $0.12 |
| CloudFront | $0.85 |
| **Total** | **~$1.77/month** |

**Note**: AWS Free Tier covers most of this for the first 12 months!

## 🔐 Security Features

- ✅ AWS IAM authentication
- ✅ DynamoDB encryption at rest
- ✅ HTTPS only (CloudFront)
- ✅ CORS configured
- ✅ API throttling enabled
- ✅ CloudWatch logging
- ✅ Point-in-time recovery for DynamoDB

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

- 📚 [Full Deployment Guide](./DEPLOYMENT.md)
- ⚡ [Quick Start Guide](./QUICK_START.md)
- 🏗️ [Infrastructure Documentation](./infrastructure/README.md)
- 🐛 [Troubleshooting](./DEPLOYMENT.md#-troubleshooting)

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Infrastructure with [AWS CDK](https://aws.amazon.com/cdk/)

---

**Made with ❤️ for business data management**

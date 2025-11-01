# 🚀 AWS Amplify Hosting Setup Guide

Deploy your Next.js app to production with AWS Amplify + CloudFront.

## Why Amplify?

- ✅ Handles Next.js SSR perfectly
- ✅ Automatic CloudFront integration
- ✅ GitHub auto-deployment
- ✅ Built-in CI/CD
- ✅ Custom domains
- ✅ Preview deployments

---

## 📋 Prerequisites

1. Your GitHub repository must be pushed to GitHub
2. AWS CLI configured (already done ✅)
3. AWS account access (already done ✅)

---

## 🚀 Step-by-Step Setup

### Step 1: Push Your Code to GitHub

```bash
cd /Users/appleid/Desktop/alswipeby

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Add AWS Amplify configuration"

# Add your GitHub repo as remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/alswipeby.git

# Push to GitHub
git push -u origin main
```

---

### Step 2: Create Amplify App via AWS Console

1. **Open AWS Amplify Console**:
   - Go to: https://console.aws.amazon.com/amplify/home?region=us-east-1

2. **Click "Create new app"**

3. **Connect to GitHub**:
   - Select **"GitHub"** as the repository service
   - Click **"Continue"**
   - **Authorize AWS Amplify** to access your GitHub account
   - Select your repository: `alswipeby`
   - Select branch: `main`
   - Click **"Next"**

4. **Configure Build Settings**:
   - App name: `alswipeby`
   - The `amplify.yml` file will be auto-detected ✅
   - Click **"Next"**

5. **Advanced Settings** (IMPORTANT):
   - Click **"Add environment variable"**
   - Add these variables:

   ```
   Key: NEXT_PUBLIC_API_GATEWAY_URL
   Value: https://1tdn6cblr4.execute-api.us-east-1.amazonaws.com/prod
   
   Key: API_GATEWAY_URL
   Value: https://1tdn6cblr4.execute-api.us-east-1.amazonaws.com/prod
   
   Key: AWS_REGION
   Value: us-east-1
   
   Key: DYNAMODB_TABLE_NAME
   Value: AlswipebyBusinessData-v2
   ```

6. **Review and Save**:
   - Review all settings
   - Click **"Save and deploy"**

---

### Step 3: Wait for Deployment (5-10 minutes)

Amplify will:
1. ✅ Clone your repository
2. ✅ Install dependencies
3. ✅ Build your Next.js app
4. ✅ Deploy to CloudFront
5. ✅ Provide you with a live URL

---

### Step 4: Get Your Production URL

After deployment completes, you'll see:

```
https://main.xxxxxx.amplifyapp.com
```

This is your **production URL** with:
- ✅ CloudFront CDN (global distribution)
- ✅ HTTPS enabled
- ✅ Connected to your AWS backend
- ✅ Auto-deploys on every git push

---

## 🎯 Alternative: Use AWS CLI (Faster!)

If you prefer command-line setup:

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Configure Amplify
amplify configure

# Initialize Amplify in your project
cd /Users/appleid/Desktop/alswipeby
amplify init

# Add hosting
amplify add hosting

# Select: Amazon CloudFront and S3
# Follow prompts

# Publish
amplify publish
```

---

## 🔧 Configuration Files Already Created

I've created `amplify.yml` in your project root with:
- Next.js build configuration
- Caching for faster builds
- Proper artifact setup

---

## 📊 After Deployment

### Your URLs:

**Amplify URL**: `https://main.xxxxxx.amplifyapp.com`  
**API Backend**: `https://1tdn6cblr4.execute-api.us-east-1.amazonaws.com/prod`

### Features:

1. **Auto-deployment**: Every push to `main` triggers rebuild
2. **Preview deployments**: Pull requests get preview URLs
3. **Custom domain**: Add your own domain in Amplify console
4. **Monitoring**: View logs in Amplify console
5. **Rollback**: Easy rollback to previous versions

---

## 🌐 Add Custom Domain (Optional)

1. Go to Amplify Console → Your App → **Domain management**
2. Click **"Add domain"**
3. Enter your domain name
4. Amplify will configure:
   - SSL certificate (automatic)
   - DNS records (you'll need to add to your DNS provider)
   - CloudFront distribution

---

## 🔄 Continuous Deployment

After initial setup, deployment is automatic:

```bash
# Make changes to your code
git add .
git commit -m "Update feature"
git push

# Amplify automatically:
# 1. Detects the push
# 2. Runs build
# 3. Deploys to production
# 4. Updates CloudFront
```

---

## 📈 Monitoring & Logs

**View Build Logs**:
1. Go to Amplify Console
2. Select your app
3. Click on the build in progress or completed
4. View detailed logs

**View Application Logs**:
- CloudWatch Logs are automatically configured
- Access via Amplify Console → Monitoring

---

## 💰 Cost Estimate

**Amplify Hosting**:
- **Build minutes**: $0.01 per minute (100 free minutes/month)
- **Hosting**: $0.15 per GB served (15 GB free/month)
- **Data transfer**: First 15 GB free

**Typical monthly cost**: $0-5 (most covered by free tier)

**Combined with your backend**: ~$2-7/month total

---

## 🐛 Troubleshooting

### Build Fails

**Check environment variables**:
1. Amplify Console → App Settings → Environment variables
2. Ensure all variables are set correctly

**Check build logs**:
- Look for errors in the build output
- Common issues: missing dependencies, wrong Node version

### Site Loads but Shows Errors

**CORS Issues**:
- Your API Gateway already has CORS enabled ✅

**API Connection Issues**:
- Verify environment variables in Amplify
- Check CloudWatch logs for Lambda errors

### Slow First Load

**Cold Start**:
- Next.js SSR has ~1-2s initial load (normal)
- Subsequent loads are instant (CloudFront cache)

---

## ✅ Success Checklist

After setup, verify:

- [ ] Amplify app created and connected to GitHub
- [ ] Environment variables configured
- [ ] First build completes successfully
- [ ] Production URL works
- [ ] Can add/save data
- [ ] Data persists after refresh
- [ ] Auto-deployment works (push a change)

---

## 🎉 Next Steps

1. **Push your code to GitHub** (Step 1 above)
2. **Create Amplify app** (Step 2 above)
3. **Wait for deployment** (5-10 minutes)
4. **Test your production URL**
5. **Share with the world!** 🚀

---

## 📚 Resources

- [AWS Amplify Documentation](https://docs.amplify.aws/)
- [Next.js on Amplify](https://aws.amazon.com/blogs/mobile/host-a-next-js-ssr-app-with-real-time-data-on-aws-amplify/)
- [Amplify Console](https://console.aws.amazon.com/amplify/home?region=us-east-1)

---

## 🆘 Need Help?

If you encounter issues:

1. Check Amplify build logs
2. Verify environment variables
3. Test API Gateway directly:
   ```bash
   curl https://1tdn6cblr4.execute-api.us-east-1.amazonaws.com/prod/businesses
   ```
4. Check CloudWatch logs for Lambda errors

---

**Once deployed, you'll have a production-ready app with:**
- ✅ Global CDN (CloudFront)
- ✅ Auto-scaling (Lambda + DynamoDB)
- ✅ CI/CD pipeline (GitHub → Amplify)
- ✅ HTTPS enabled
- ✅ Monitoring and logs
- ✅ Cost-effective (~$2-7/month)

Let's deploy! 🚀


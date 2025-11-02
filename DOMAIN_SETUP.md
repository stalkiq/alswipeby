# Setting Up Custom Domain: alswipeby.com

This guide explains how to set up `alswipeby.com` for your CloudFront distribution.

## Prerequisites

1. **Domain Registration**: The domain `alswipeby.com` must be registered first.
   - If registered with Route 53: Proceed with deployment
   - If registered elsewhere (GoDaddy, Namecheap, etc.): You'll need to update nameservers after deployment

## Deployment Steps

### Step 1: Deploy Infrastructure

The CDK stack will:
1. Create a Route 53 hosted zone for `alswipeby.com`
2. Request an SSL certificate from ACM (must be in `us-east-1` for CloudFront)
3. Configure CloudFront to use the custom domain
4. Create DNS records pointing to CloudFront

```bash
cd infrastructure
npm run deploy
```

### Step 2: Certificate Validation

After deployment, AWS Certificate Manager (ACM) will need to validate the certificate. This happens automatically via DNS validation:

1. Check AWS Console → Certificate Manager (us-east-1 region)
2. The certificate will show "Pending validation"
3. Route 53 records for validation are created automatically
4. Wait 5-30 minutes for validation to complete

### Step 3: Update Nameservers (If Domain Registered Externally)

If your domain is registered outside Route 53:

1. **Get Route 53 Nameservers**:
   ```bash
   aws route53 get-hosted-zone --id <HOSTED_ZONE_ID> --query "DelegationSet.NameServers" --output table
   ```
   Or check the CDK outputs after deployment.

2. **Update Nameservers at Your Registrar**:
   - Log into your domain registrar (GoDaddy, Namecheap, etc.)
   - Find DNS/Nameserver settings
   - Replace existing nameservers with the Route 53 nameservers from step 1
   - Save changes

3. **Wait for Propagation**: DNS changes can take 24-48 hours, but usually work within a few hours

### Step 4: Verify Setup

Once DNS propagates and certificate is validated:

1. Visit `https://alswipeby.com` - should show your site
2. Visit `https://www.alswipeby.com` - should redirect/show your site
3. Both should have valid SSL certificates

## Troubleshooting

### If Hosted Zone Already Exists

If you get an error that the hosted zone already exists, update `infrastructure/lib/alswipeby-stack.ts`:

```typescript
// Replace the hosted zone creation with:
const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
  domainName: domainName,
});
```

Then redeploy.

### Certificate Not Validating

1. Check Route 53 hosted zone for validation CNAME records
2. Ensure nameservers are correctly set at your registrar
3. Wait longer (can take up to 48 hours)

### DNS Not Resolving

1. Check nameservers are correct at registrar
2. Use `dig alswipeby.com` or `nslookup alswipeby.com` to verify DNS
3. Wait for DNS propagation (can take 24-48 hours)

## Post-Deployment

After successful deployment, you'll see these outputs:

- `CustomDomainName`: alswipeby.com
- `HostedZoneId`: Your Route 53 hosted zone ID
- `CertificateArn`: Your ACM certificate ARN
- `CloudFrontDistributionDomain`: The CloudFront domain (still works)

Your site will be accessible at:
- `https://alswipeby.com`
- `https://www.alswipeby.com`
- `https://ddhgvznsnhzg9.cloudfront.net` (still works as fallback)


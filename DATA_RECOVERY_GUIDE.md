# 🔄 Data Recovery Guide

Complete guide on how to access and restore your data if something goes wrong.

---

## 🚨 **Emergency Recovery Options**

You have **3 ways** to recover your data:

1. **Point-in-Time Recovery** (Automatic, up to 35 days)
2. **S3 Daily Backups** (Automatic, daily at 2 AM UTC)
3. **Manual Export** (On-demand)

---

## 📋 **Quick Reference**

| Recovery Method | Recovery Time | Data Retention | Best For |
|----------------|---------------|----------------|----------|
| Point-in-Time Recovery | ~5 minutes | 35 days | Accidental deletion, corruption |
| S3 Daily Backup | ~10 minutes | 90 days | Full table restore |
| Manual Export | ~5 minutes | Forever | Quick backup before changes |

---

## 🔍 **Method 1: Point-in-Time Recovery** (Easiest)

**Use when**: You accidentally deleted data or corrupted records

### Step 1: Check Available Recovery Times

```bash
aws dynamodb describe-continuous-backups \
  --table-name AlswipebyBusinessData-v2 \
  --region us-east-1 \
  --query 'ContinuousBackupsDescription.PointInTimeRecoveryDescription'
```

**Output shows**:
- ✅ `PointInTimeRecoveryStatus: ENABLED`
- `EarliestRestorableDateTime`: Earliest time you can restore to
- `LatestRestorableDateTime`: Latest time you can restore to

### Step 2: Restore to Specific Time

```bash
# Restore to yesterday at 10 AM
aws dynamodb restore-table-to-point-in-time \
  --source-table-name AlswipebyBusinessData-v2 \
  --target-table-name AlswipebyBusinessData-restored \
  --restore-date-time "2025-11-01T10:00:00Z" \
  --region us-east-1
```

**What happens**:
- Creates NEW table: `AlswipebyBusinessData-restored`
- Copies all data from that exact time
- Original table unchanged

### Step 3: Verify Restored Data

```bash
# Check restored table
aws dynamodb scan \
  --table-name AlswipebyBusinessData-restored \
  --region us-east-1 \
  --query 'Items | length(@)'
```

### Step 4: Replace Original Table (Optional)

```bash
# Delete old table
aws dynamodb delete-table \
  --table-name AlswipebyBusinessData-v2 \
  --region us-east-1

# Rename restored table
aws dynamodb update-table \
  --table-name AlswipebyBusinessData-restored \
  --table-name AlswipebyBusinessData-v2 \
  --region us-east-1
```

**⚠️ Note**: You'll need to update your app's table name or manually rename in AWS Console.

---

## 💾 **Method 2: Restore from S3 Daily Backup**

**Use when**: You need data from a specific day or point-in-time recovery expired

### Step 1: List Available Backups

```bash
# List all backups
aws s3 ls s3://alswipeby-backups-016442247702/backups/ --recursive --human-readable

# Example output:
# 2025-11-01 02:00:15   15.2 KiB backups/2025-11-01/backup-2025-11-01T02-00-00-000Z.json
# 2025-11-02 02:00:22   18.5 KiB backups/2025-11-02/backup-2025-11-02T02-00-00-000Z.json
```

### Step 2: Download Backup

```bash
# Download specific backup
aws s3 cp \
  s3://alswipeby-backups-016442247702/backups/2025-11-01/backup-2025-11-01T02-00-00-000Z.json \
  /tmp/backup.json \
  --region us-east-1
```

### Step 3: View Backup Contents

```bash
# Check what's in the backup
cat /tmp/backup.json | jq '.itemCount'
cat /tmp/backup.json | jq '.items[0]'  # View first item
```

### Step 4: Restore Backup

**Option A: Use Recovery Script** (Easiest)

```bash
# Make script executable
chmod +x scripts/restore-from-backup.sh

# Restore from backup
./scripts/restore-from-backup.sh /tmp/backup.json
```

**Option B: Manual Restore**

```bash
# Extract items and restore manually
jq -c '.items[]' /tmp/backup.json | while read item; do
  aws dynamodb put-item \
    --table-name AlswipebyBusinessData-v2 \
    --item "$item" \
    --region us-east-1
done
```

---

## 📤 **Method 3: Manual Export** (On-Demand)

**Use when**: You want a backup before making major changes

### Export Current Data

```bash
# Export entire table to JSON
aws dynamodb scan \
  --table-name AlswipebyBusinessData-v2 \
  --region us-east-1 \
  --output json > backup-manual-$(date +%Y%m%d-%H%M%S).json

# Check export
cat backup-manual-*.json | jq '.Items | length'
```

### Upload to S3 (Optional)

```bash
# Upload to backup bucket
aws s3 cp backup-manual-*.json \
  s3://alswipeby-backups-016442247702/manual-backups/ \
  --region us-east-1
```

---

## 🛠️ **Using the Recovery Scripts**

### Interactive Recovery Script

```bash
# Make executable
chmod +x scripts/recover-data.sh

# Run interactive menu
./scripts/recover-data.sh
```

**Menu Options**:
1. List available backups
2. Restore from S3 backup
3. Check Point-in-Time Recovery status
4. Restore from Point-in-Time Recovery
5. View current data
6. Exit

### Direct Backup Restore

```bash
# Download backup first
aws s3 cp s3://alswipeby-backups-016442247702/backups/2025-11-01/backup-2025-11-01T02-00-00-000Z.json /tmp/backup.json

# Restore
chmod +x scripts/restore-from-backup.sh
./scripts/restore-from-backup.sh /tmp/backup.json
```

---

## 📊 **Check Backup Status**

### View Latest Backup

```bash
# Get most recent backup
LATEST_BACKUP=$(aws s3 ls s3://alswipeby-backups-016442247702/backups/ --recursive | sort | tail -1 | awk '{print $4}')

echo "Latest backup: $LATEST_BACKUP"

# Download and check
aws s3 cp "s3://alswipeby-backups-016442247702/${LATEST_BACKUP}" /tmp/latest-backup.json
cat /tmp/latest-backup.json | jq '{timestamp, itemCount, tableName}'
```

### Check Backup Lambda Logs

```bash
# View backup execution logs
aws logs tail /aws/lambda/alswipeby-daily-backup --follow --region us-east-1

# Check last backup status
aws logs filter-log-events \
  --log-group-name /aws/lambda/alswipeby-daily-backup \
  --start-time $(date -d '1 day ago' +%s)000 \
  --region us-east-1 \
  --query 'events[-1].message'
```

---

## 🔐 **Accessing Your Data**

### Via AWS Console

1. **DynamoDB Console**: https://console.aws.amazon.com/dynamodbv2/home?region=us-east-1#tables
   - Click table: `AlswipebyBusinessData-v2`
   - Click "Items" tab
   - View/edit/export data

2. **S3 Console**: https://s3.console.aws.amazon.com/s3/buckets/alswipeby-backups-016442247702
   - Navigate to `backups/` folder
   - Download any backup file
   - View JSON directly in browser

3. **CloudWatch Logs**: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups
   - Log group: `/aws/lambda/alswipeby-daily-backup`
   - See backup execution history

### Via AWS CLI

```bash
# View all data
aws dynamodb scan \
  --table-name AlswipebyBusinessData-v2 \
  --region us-east-1

# Count items
aws dynamodb describe-table \
  --table-name AlswipebyBusinessData-v2 \
  --region us-east-1 \
  --query 'Table.ItemCount'

# Get specific item
aws dynamodb get-item \
  --table-name AlswipebyBusinessData-v2 \
  --key '{"docId": {"S": "your-doc-id"}}' \
  --region us-east-1
```

### Via API

```bash
# Get all data via API
curl https://1tdn6cblr4.execute-api.us-east-1.amazonaws.com/prod/businesses

# Save data via API
curl -X POST https://1tdn6cblr4.execute-api.us-east-1.amazonaws.com/prod/businesses/save \
  -H "Content-Type: application/json" \
  -d '{"data":[...]}'
```

---

## 🚨 **Common Recovery Scenarios**

### Scenario 1: Accidentally Deleted a Row

**Solution**: Point-in-Time Recovery

```bash
# 1. Find when you deleted it (check CloudWatch logs or estimate time)
# 2. Restore to time BEFORE deletion
aws dynamodb restore-table-to-point-in-time \
  --source-table-name AlswipebyBusinessData-v2 \
  --target-table-name AlswipebyBusinessData-restored \
  --restore-date-time "2025-11-01T09:00:00Z"  # Before deletion

# 3. Copy missing row back to original table
```

### Scenario 2: All Data Gone

**Solution**: S3 Backup or Point-in-Time Recovery

```bash
# Option 1: Restore from yesterday's backup
aws s3 cp s3://alswipeby-backups-016442247702/backups/2025-11-01/backup-2025-11-01T02-00-00-000Z.json /tmp/backup.json
./scripts/restore-from-backup.sh /tmp/backup.json

# Option 2: Point-in-time recovery
aws dynamodb restore-table-to-point-in-time \
  --source-table-name AlswipebyBusinessData-v2 \
  --target-table-name AlswipebyBusinessData-restored \
  --restore-date-time "2025-11-01T01:00:00Z"
```

### Scenario 3: Corrupted Data

**Solution**: Restore to before corruption

```bash
# Restore to known good time
aws dynamodb restore-table-to-point-in-time \
  --source-table-name AlswipebyBusinessData-v2 \
  --target-table-name AlswipebyBusinessData-restored \
  --restore-date-time "2025-11-01T08:00:00Z"  # Before corruption
```

### Scenario 4: Need Data from Last Week

**Solution**: Use S3 Backup from that day

```bash
# List backups from last week
aws s3 ls s3://alswipeby-backups-016442247702/backups/2025-10-25/ --recursive

# Download and restore
aws s3 cp s3://alswipeby-backups-016442247702/backups/2025-10-25/backup-2025-10-25T02-00-00-000Z.json /tmp/backup.json
./scripts/restore-from-backup.sh /tmp/backup.json
```

---

## 📅 **Backup Schedule**

- **Daily Backups**: Every day at **2:00 AM UTC** (automatic)
- **Retention**: 90 days in S3
- **Point-in-Time Recovery**: Continuous (last 35 days)
- **Manual Backups**: Anytime via script

---

## ✅ **Verification Steps**

After any restore:

1. **Verify Item Count**:
   ```bash
   aws dynamodb describe-table \
     --table-name AlswipebyBusinessData-v2 \
     --region us-east-1 \
     --query 'Table.ItemCount'
   ```

2. **Spot Check Data**:
   ```bash
   aws dynamodb scan \
     --table-name AlswipebyBusinessData-v2 \
     --region us-east-1 \
     --limit 5
   ```

3. **Test via API**:
   ```bash
   curl https://1tdn6cblr4.execute-api.us-east-1.amazonaws.com/prod/businesses | jq '.count'
   ```

4. **Check in Web App**:
   - Visit: https://ddhgvznsnhzg9.cloudfront.net
   - Verify data appears correctly

---

## 🆘 **Emergency Contacts**

**AWS Support**: https://console.aws.amazon.com/support/home?region=us-east-1

**CloudWatch Logs**: Check for errors
```bash
aws logs tail /aws/lambda/alswipeby-daily-backup --follow
```

**Backup Status**: Check Lambda execution
```bash
aws lambda get-function --function-name alswipeby-daily-backup --region us-east-1
```

---

## 📝 **Notes**

- **Backups are automatic** - No action needed
- **Point-in-Time Recovery is enabled** - Always available
- **Backups stored in S3** - Separate from main table
- **90-day retention** - Old backups auto-deleted
- **Encrypted backups** - AES-256 encryption

---

**Remember**: Your data is protected by **multiple layers** of backup and recovery! 🛡️


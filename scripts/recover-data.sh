#!/bin/bash
# Data Recovery Script for Alswipeby
# This script helps you recover data from backups or point-in-time recovery

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

TABLE_NAME="AlswipebyBusinessData-v2"
BACKUP_BUCKET="alswipeby-backups-016442247702"
REGION="us-east-1"

echo -e "${GREEN}=== Alswipeby Data Recovery Tool ===${NC}\n"

# Function to list available backups
list_backups() {
    echo -e "${YELLOW}Available backups in S3:${NC}"
    aws s3 ls s3://${BACKUP_BUCKET}/backups/ --recursive --human-readable --summarize 2>/dev/null || {
        echo -e "${RED}No backups found or bucket doesn't exist${NC}"
        return 1
    }
}

# Function to restore from S3 backup
restore_from_backup() {
    echo -e "\n${YELLOW}Restore from S3 Backup${NC}"
    echo "Enter the backup file path (e.g., backups/2025-11-01/backup-2025-11-01T02-00-00-000Z.json):"
    read -r backup_path
    
    if [ -z "$backup_path" ]; then
        echo -e "${RED}Backup path is required${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}Downloading backup...${NC}"
    aws s3 cp "s3://${BACKUP_BUCKET}/${backup_path}" /tmp/backup.json --region ${REGION}
    
    echo -e "${YELLOW}Backup contents:${NC}"
    cat /tmp/backup.json | jq '.itemCount' && echo " items"
    
    echo -e "\n${YELLOW}To restore this backup, you'll need to:${NC}"
    echo "1. Review the backup file: cat /tmp/backup.json"
    echo "2. Use the restore script: ./scripts/restore-from-backup.sh"
    echo "3. Or manually import via AWS Console"
}

# Function to check point-in-time recovery
check_pitr() {
    echo -e "\n${YELLOW}Checking Point-in-Time Recovery status...${NC}"
    aws dynamodb describe-continuous-backups \
        --table-name ${TABLE_NAME} \
        --region ${REGION} \
        --query 'ContinuousBackupsDescription.PointInTimeRecoveryDescription' \
        --output json | jq .
}

# Function to restore from point-in-time
restore_from_pitr() {
    echo -e "\n${YELLOW}Restore from Point-in-Time Recovery${NC}"
    echo "Enter restore time (ISO format, e.g., 2025-11-01T10:00:00Z):"
    read -r restore_time
    
    if [ -z "$restore_time" ]; then
        echo -e "${RED}Restore time is required${NC}"
        return 1
    fi
    
    NEW_TABLE_NAME="${TABLE_NAME}-restored-$(date +%s)"
    
    echo -e "${YELLOW}Restoring to new table: ${NEW_TABLE_NAME}${NC}"
    echo -e "${RED}This will create a new table. Continue? (yes/no)${NC}"
    read -r confirm
    
    if [ "$confirm" != "yes" ]; then
        echo "Cancelled"
        return 1
    fi
    
    aws dynamodb restore-table-to-point-in-time \
        --source-table-name ${TABLE_NAME} \
        --target-table-name ${NEW_TABLE_NAME} \
        --restore-date-time "${restore_time}" \
        --region ${REGION}
    
    echo -e "${GREEN}Restore initiated. Check status with:${NC}"
    echo "aws dynamodb describe-table --table-name ${NEW_TABLE_NAME} --region ${REGION}"
}

# Function to view current data
view_current_data() {
    echo -e "\n${YELLOW}Current data in table:${NC}"
    aws dynamodb scan \
        --table-name ${TABLE_NAME} \
        --region ${REGION} \
        --output json | jq '.Items | length' && echo " items"
    
    echo -e "\n${YELLOW}Export to file? (yes/no)${NC}"
    read -r export_confirm
    
    if [ "$export_confirm" == "yes" ]; then
        OUTPUT_FILE="backup-$(date +%Y%m%d-%H%M%S).json"
        aws dynamodb scan \
            --table-name ${TABLE_NAME} \
            --region ${REGION} \
            --output json > "${OUTPUT_FILE}"
        echo -e "${GREEN}Exported to: ${OUTPUT_FILE}${NC}"
    fi
}

# Main menu
echo "What would you like to do?"
echo "1) List available backups"
echo "2) Restore from S3 backup"
echo "3) Check Point-in-Time Recovery status"
echo "4) Restore from Point-in-Time Recovery"
echo "5) View current data"
echo "6) Exit"

read -r choice

case $choice in
    1) list_backups ;;
    2) restore_from_backup ;;
    3) check_pitr ;;
    4) restore_from_pitr ;;
    5) view_current_data ;;
    6) echo "Exiting..."; exit 0 ;;
    *) echo -e "${RED}Invalid choice${NC}"; exit 1 ;;
esac


#!/bin/bash
# Restore DynamoDB table from S3 backup JSON file

set -e

TABLE_NAME="AlswipebyBusinessData-v2"
REGION="us-east-1"

if [ -z "$1" ]; then
    echo "Usage: $0 <backup-file.json>"
    echo "Example: $0 /tmp/backup.json"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "Loading backup file: $BACKUP_FILE"
echo "Target table: $TABLE_NAME"
echo ""
echo "⚠️  WARNING: This will OVERWRITE existing data in the table!"
echo "Press Ctrl+C to cancel, or Enter to continue..."
read

# Extract items from backup JSON
ITEMS=$(jq -c '.items[]' "$BACKUP_FILE")

COUNT=0
BATCH_SIZE=25
BATCH_ITEMS=""

echo "Restoring items..."

for item in $ITEMS; do
    # Add item to batch
    if [ -z "$BATCH_ITEMS" ]; then
        BATCH_ITEMS="$item"
    else
        BATCH_ITEMS="$BATCH_ITEMS $item"
    fi
    
    COUNT=$((COUNT + 1))
    
    # Process batch when it reaches 25 items
    if [ $((COUNT % BATCH_SIZE)) -eq 0 ]; then
        # Write batch request JSON
        BATCH_FILE="/tmp/batch-${COUNT}.json"
        {
            echo "{"
            echo "  \"$TABLE_NAME\": ["
            FIRST=true
            for batch_item in $BATCH_ITEMS; do
                if [ "$FIRST" = true ]; then
                    FIRST=false
                else
                    echo ","
                fi
                echo -n "    { \"PutRequest\": { \"Item\": $batch_item } }"
            done
            echo ""
            echo "  ]"
            echo "}"
        } > "$BATCH_FILE"
        
        # Execute batch write
        aws dynamodb batch-write-item \
            --request-items "file://${BATCH_FILE}" \
            --region ${REGION} > /dev/null
        
        echo "Restored batch of $BATCH_SIZE items (total: $COUNT)"
        BATCH_ITEMS=""
        rm "$BATCH_FILE"
    fi
done

# Process remaining items
if [ -n "$BATCH_ITEMS" ]; then
    BATCH_FILE="/tmp/batch-final.json"
    {
        echo "{"
        echo "  \"$TABLE_NAME\": ["
        FIRST=true
        for batch_item in $BATCH_ITEMS; do
            if [ "$FIRST" = true ]; then
                FIRST=false
            else
                echo ","
            fi
            echo -n "    { \"PutRequest\": { \"Item\": $batch_item } }"
        done
        echo ""
        echo "  ]"
        echo "}"
    } > "$BATCH_FILE"
    
    aws dynamodb batch-write-item \
        --request-items "file://${BATCH_FILE}" \
        --region ${REGION} > /dev/null
    
    echo "Restored final batch (total: $COUNT)"
    rm "$BATCH_FILE"
fi

echo ""
echo "✅ Restore complete! Restored $COUNT items to $TABLE_NAME"


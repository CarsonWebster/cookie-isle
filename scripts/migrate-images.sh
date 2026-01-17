#!/bin/bash
#
# migrate-images.sh - Upload legacy images to R2 bucket
#
# This script uses wrangler to upload images directly to R2.
# Images are renamed to use the R2 serving pattern for consistency.
#
# Usage:
#   ./scripts/migrate-images.sh [--dry-run]
#

set -e

BUCKET_NAME="cookie-isle-images"
LEGACY_DIR="_legacy/static"
DRY_RUN=false

# Check for dry-run flag
if [ "$1" = "--dry-run" ]; then
	DRY_RUN=true
	echo "🔍 DRY RUN MODE - No files will be uploaded"
	echo ""
fi

echo "=== Cookie Isle Image Migration to R2 ==="
echo ""

# Check if wrangler is available
if ! command -v wrangler &>/dev/null; then
	echo "❌ Error: wrangler CLI not found"
	echo "   Install with: npm install -g wrangler"
	exit 1
fi

# Check if legacy directory exists
if [ ! -d "$LEGACY_DIR" ]; then
	echo "❌ Error: Legacy directory not found: $LEGACY_DIR"
	exit 1
fi

echo "📁 Source: $LEGACY_DIR"
echo "☁️  Destination: R2 bucket '$BUCKET_NAME'"
echo ""

# Image mappings (legacy filename -> R2 filename)
declare -A IMAGES=(
	["Cholocatechipsingle.png"]="chocolate-chip-single.png"
	["Cholocatechipmultiple.png"]="chocolate-chip-multiple.png"
	["ChocChipBowl.jpg"]="chocolate-chip-bowl.jpg"
	["ChocChipRack.jpg"]="chocolate-chip-rack.jpg"
	["Brownie.jpg"]="brownie.jpg"
	["Saltedcaramelsingle.png"]="salted-caramel-single.png"
	["Saltedcaramelmultiple.png"]="salted-caramel-multiple.png"
)

SUCCESS_COUNT=0
FAIL_COUNT=0

echo "=== Uploading Images ==="
echo ""

for LEGACY_FILE in "${!IMAGES[@]}"; do
	R2_FILE="${IMAGES[$LEGACY_FILE]}"
	SOURCE_PATH="$LEGACY_DIR/$LEGACY_FILE"

	if [ ! -f "$SOURCE_PATH" ]; then
		echo "⚠️  Skipping: $LEGACY_FILE (file not found)"
		((FAIL_COUNT++))
		continue
	fi

	echo "📤 $LEGACY_FILE → $R2_FILE"

	if [ "$DRY_RUN" = true ]; then
		echo "   [DRY RUN] Would upload to: $BUCKET_NAME/$R2_FILE"
	else
		# Upload to R2 using wrangler
		if wrangler r2 object put "$BUCKET_NAME/$R2_FILE" --file="$SOURCE_PATH" &>/dev/null; then
			echo "   ✅ Uploaded successfully"
			((SUCCESS_COUNT++))
		else
			echo "   ❌ Upload failed"
			((FAIL_COUNT++))
		fi
	fi
	echo ""
done

echo "=== Upload Summary ==="
echo ""
echo "✅ Successful: $SUCCESS_COUNT"
echo "❌ Failed: $FAIL_COUNT"
echo ""

if [ "$DRY_RUN" = true ]; then
	echo "Run without --dry-run to actually upload files."
	exit 0
fi

if [ $FAIL_COUNT -gt 0 ]; then
	echo "⚠️  Some uploads failed. Check errors above."
	exit 1
fi

echo "=== Next Steps ==="
echo ""
echo "1. Update product records in database:"
echo "   npx wrangler d1 execute cookie-isle-db --local --file=scripts/update-product-images.sql"
echo ""
echo "2. Verify images are accessible:"
echo "   Visit: http://localhost:5173/images/chocolate-chip-single.png"
echo ""
echo "✨ Migration complete!"

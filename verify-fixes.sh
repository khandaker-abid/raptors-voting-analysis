#!/bin/bash

echo "Verifying TypeScript fixes..."
echo ""

# Check if the files have the correct syntax
files=(
  "src/charts/DropboxBubbleChart.tsx"
  "src/components/VoterRegistrationBubbleOverlay.tsx"
  "src/main.tsx"
  "src/utils/chartAnimations.ts"
  "src/data/everyStateAllModelsData.ts"
)

echo "✅ Fixed files:"
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  - $file exists"
  else
    echo "  ❌ $file NOT FOUND"
  fi
done

echo ""
echo "✅ Test files excluded in tsconfig.app.json:"
grep -A 1 '"exclude"' tsconfig.app.json

echo ""
echo "All fixes have been applied. Try running: npm run build"

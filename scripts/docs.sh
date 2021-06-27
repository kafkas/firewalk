#!/bin/sh

. ./helpers.sh --source-only

# Step 1: Validate command

cd ..

if [ "$#" -ne 1 ]; then
    echo "Invalid command. Must provide a valid <packageId> argument."
    exit 1
fi

# Step 2: Get the current version of the package

package_id=$1
validate_package $package_id
package_path="packages/$package_id"
version=$(jq -r .version "$package_path/package.json")

# Step 3: Generate the docs

npx typedoc --out docs/$version --entryPoints "$package_path/src/index.ts" --tsconfig "$package_path/src/tsconfig.json"

# Step 4: Update docs readme

ts-node scripts/updateDocsReadme.ts

npx prettier -w docs/index.md


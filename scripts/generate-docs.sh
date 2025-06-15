#!/bin/sh
# Run from project root

# Parse version
complete_version=$(npm pkg get version | tr -d '"')

# Extract the major version
major_version=$(echo $complete_version | awk -F '.' '{print $1}')

# Generate docs
typedoc --out docs/v$major_version

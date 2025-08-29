#!/bin/bash

# A script to verify the development environment on macOS

echo "🩺 Checking macOS environment..."
FAIL=0

# Helper function to check command and version
check_version() {
    local cmd=$1
    local required_version=$2
    local actual_version=$($cmd 2>/dev/null)

    if [[ $? -ne 0 ]]; then
        echo "❌ ERROR: '$1' is not installed."
        FAIL=1
    elif [[ ! "$actual_version" == *"$required_version"* ]]; then
        echo "⚠️  WARNING: Mismatched $1 version. Found: $actual_version, Required: ~$required_version"
        FAIL=1
    else
        echo "✅ OK: $1 version ($actual_version)"
    fi
}

# --- Checks ---
check_version "node --version" "v22.18"
check_version "npm --version" "10.9"
check_version "ruby --version" "3.2.2"
check_version "pod --version" "1.16.2"

# --- Final Result ---
if [[ $FAIL -eq 0 ]]; then
    echo -e "\n🎉 Your environment looks good!"
else
    echo -e "\n❗ Please fix the issues above to ensure a stable environment."
    exit 1
fi
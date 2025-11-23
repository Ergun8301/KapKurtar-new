#!/bin/bash
# EAS Build hook - Mapbox temporarily disabled
# This script is kept for future re-enablement of Mapbox

set -e

echo "Build pre-install hook running..."

# Mapbox is currently disabled - no authentication needed
# When re-enabling Mapbox, uncomment the following:
#
# if [ -z "$MAPBOX_DOWNLOADS_TOKEN" ]; then
#   echo "Error: MAPBOX_DOWNLOADS_TOKEN is not set"
#   echo "Please add it as an EAS secret: eas secret:create --name MAPBOX_DOWNLOADS_TOKEN --value <your-token>"
#   exit 1
# fi
#
# NETRC_FILE="$HOME/.netrc"
# echo "machine api.mapbox.com" >> "$NETRC_FILE"
# echo "login mapbox" >> "$NETRC_FILE"
# echo "password $MAPBOX_DOWNLOADS_TOKEN" >> "$NETRC_FILE"
# chmod 600 "$NETRC_FILE"
# echo "Mapbox authentication configured successfully"

echo "Pre-install completed (Mapbox disabled)"

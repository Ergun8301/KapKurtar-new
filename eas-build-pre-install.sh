#!/bin/bash
# EAS Build hook to configure Mapbox SDK authentication
# This creates the .netrc file required for Mapbox Maven repository access

set -e

echo "Configuring Mapbox SDK authentication..."

if [ -z "$MAPBOX_DOWNLOADS_TOKEN" ]; then
  echo "Error: MAPBOX_DOWNLOADS_TOKEN is not set"
  echo "Please add it as an EAS secret: eas secret:create --name MAPBOX_DOWNLOADS_TOKEN --value <your-token>"
  exit 1
fi

# Create .netrc file for Mapbox authentication
NETRC_FILE="$HOME/.netrc"

echo "machine api.mapbox.com" >> "$NETRC_FILE"
echo "login mapbox" >> "$NETRC_FILE"
echo "password $MAPBOX_DOWNLOADS_TOKEN" >> "$NETRC_FILE"

chmod 600 "$NETRC_FILE"

echo "Mapbox authentication configured successfully"

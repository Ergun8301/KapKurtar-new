// app.config.js - Dynamic Expo config for environment variables
module.exports = ({ config }) => {
  // Build Mapbox plugin config - only include token if available
  const mapboxConfig = {
    RNMapboxMapsImpl: "mapbox",
  };

  // Only set download token if explicitly provided
  // Otherwise, rely on .netrc file created by eas-build-pre-install.sh
  const downloadToken = process.env.MAPBOX_DOWNLOADS_TOKEN;
  if (downloadToken) {
    mapboxConfig.RNMapboxMapsDownloadToken = downloadToken;
  }

  return {
    ...config,
    plugins: [
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "KapKurtar needs your location to show nearby offers."
        }
      ],
      ["@rnmapbox/maps", mapboxConfig],
      "expo-secure-store"
    ]
  };
};

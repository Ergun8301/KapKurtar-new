// app.config.js - Dynamic Expo config for environment variables
module.exports = ({ config }) => {
  return {
    ...config,
    plugins: [
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "KapKurtar needs your location to show nearby offers."
        }
      ],
      [
        "@rnmapbox/maps",
        {
          RNMapboxMapsImpl: "mapbox",
          // Use environment variable for download token (set in EAS secrets)
          RNMapboxMapsDownloadToken: process.env.MAPBOX_DOWNLOADS_TOKEN || process.env.EXPO_PUBLIC_MAPBOX_DOWNLOADS_TOKEN
        }
      ],
      "expo-secure-store"
    ]
  };
};

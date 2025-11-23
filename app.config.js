// app.config.js - Dynamic Expo config for environment variables
// NOTE: Mapbox has been temporarily disabled due to 401 auth issues
// To re-enable Mapbox later, add back the @rnmapbox/maps plugin
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
      "expo-secure-store"
    ]
  };
};

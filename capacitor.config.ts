import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.pocketclick.app",
  appName: "Pocket Click",
  webDir: "out",
  ios: {
    contentInset: "never",
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: "#0e0e0f",
      showSpinner: false,
    },
  },
};

export default config;

import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.pocketclick.app",
  appName: "Pocket Click",
  webDir: "out",
  ios: {
    contentInset: "never",
  },
};

export default config;

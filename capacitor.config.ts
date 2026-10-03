import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.bobs.restaurant",
  appName: "Grokheads",
  webDir: "dist",

  server: {
    androidScheme: "https",
  },
};

export default config;

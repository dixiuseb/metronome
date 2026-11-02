import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";

const isCapacitorBuild = process.env.CAPACITOR_BUILD === "1";

const nextConfig: NextConfig = {
  reactCompiler: true,
  ...(isCapacitorBuild ? { output: "export" as const } : {}),
};

export default withSerwist(nextConfig);

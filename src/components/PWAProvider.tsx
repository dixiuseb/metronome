"use client";

import { SerwistProvider } from "@serwist/turbopack/react";
import { Capacitor } from "@capacitor/core";
import type { ReactNode } from "react";

export default function PWAProvider({ children }: { children: ReactNode }) {
  if (Capacitor.isNativePlatform()) {
    return children;
  }

  return <SerwistProvider swUrl="/serwist/sw.js">{children}</SerwistProvider>;
}

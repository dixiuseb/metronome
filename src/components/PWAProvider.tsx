"use client";

import { SerwistProvider } from "@serwist/turbopack/react";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import { useEffect, type ReactNode } from "react";

function NativeShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    void SplashScreen.hide({ fadeOutDuration: 250 });
  }, []);

  return children;
}

export default function PWAProvider({ children }: { children: ReactNode }) {
  if (Capacitor.isNativePlatform()) {
    return <NativeShell>{children}</NativeShell>;
  }

  return <SerwistProvider swUrl="/serwist/sw.js">{children}</SerwistProvider>;
}

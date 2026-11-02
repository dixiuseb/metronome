"use client";

import { SerwistProvider } from "@serwist/turbopack/react";
<<<<<<< Updated upstream
import type { ReactNode } from "react";

export default function PWAProvider({ children }: { children: ReactNode }) {
=======
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

>>>>>>> Stashed changes
  return <SerwistProvider swUrl="/serwist/sw.js">{children}</SerwistProvider>;
}

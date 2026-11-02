"use client";

import { SerwistProvider } from "@serwist/turbopack/react";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import { useEffect, type ReactNode } from "react";

/** Keep splash visible at least this long from page load (app is fast; avoids a flash). */
const SPLASH_MIN_VISIBLE_MS = 1000;
const SPLASH_FADE_OUT_MS = 300;

function NativeShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    const delay = Math.max(0, SPLASH_MIN_VISIBLE_MS - performance.now());
    const id = window.setTimeout(() => {
      void SplashScreen.hide({ fadeOutDuration: SPLASH_FADE_OUT_MS });
    }, delay);
    return () => clearTimeout(id);
  }, []);

  return children;
}

export default function PWAProvider({ children }: { children: ReactNode }) {
  if (Capacitor.isNativePlatform()) {
    return <NativeShell>{children}</NativeShell>;
  }

  return <SerwistProvider swUrl="/serwist/sw.js">{children}</SerwistProvider>;
}

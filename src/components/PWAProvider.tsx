"use client";

import { SerwistProvider } from "@serwist/turbopack/react";
import { useEffect, type ReactNode } from "react";

export default function PWAProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const blockTouchScroll = (event: TouchEvent) => {
      event.preventDefault();
    };
    document.addEventListener("touchmove", blockTouchScroll, { passive: false });
    return () =>
      document.removeEventListener("touchmove", blockTouchScroll);
  }, []);

  return <SerwistProvider swUrl="/serwist/sw.js">{children}</SerwistProvider>;
}

"use client";

import { SerwistProvider } from "@serwist/turbopack/react";
import type { ReactNode } from "react";

export default function PWAProvider({ children }: { children: ReactNode }) {
  return <SerwistProvider swUrl="/serwist/sw.js">{children}</SerwistProvider>;
}

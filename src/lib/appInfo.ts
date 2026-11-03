export const APP_NAME = "Pocket Click";

export const SUPPORT_URL =
  process.env.NEXT_PUBLIC_SUPPORT_URL ??
  "https://ethandoes.com/pocketclick/support";

export const PRIVACY_URL =
  process.env.NEXT_PUBLIC_PRIVACY_URL ??
  "https://ethandoes.com/pocketclick/privacy";

/** Shown on support page / mailto fallbacks */
export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "pc-support@ethandoes.com";

export const GUIDE_DISMISSED_KEY = "pocketclick.guide.dismissed";

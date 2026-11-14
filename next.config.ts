import type { NextConfig } from "next";

// Google Analytics is optional. Its hosts are only allowed when an ID is set,
// so without one the page may talk to nothing but this site.
const analytics = /^G-[A-Z0-9]+$/.test(process.env.GA_MEASUREMENT_ID ?? "");
const GTM = "https://www.googletagmanager.com";

const csp = [
  "default-src 'self'",
  // Next.js puts the page data in inline scripts, and a static page can't carry a
  // per-request nonce, so inline scripts stay allowed. Nothing on the page renders
  // visitor input or reads the URL, which is what keeps that safe.
  `script-src 'self' 'unsafe-inline'${analytics ? ` ${GTM}` : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data:${analytics ? ` https://www.google-analytics.com ${GTM}` : ""}`,
  "font-src 'self'",
  `connect-src 'self'${analytics ? ` https://*.google-analytics.com https://*.analytics.google.com ${GTM}` : ""}`,
  "worker-src 'self'",
  "manifest-src 'self'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  // Other sites can't keep a handle on this window, and it gets its own process.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Origin-Agent-Cluster", value: "?1" },
  {
    key: "Permissions-Policy",
    value:
      "accelerometer=(), camera=(), display-capture=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
  },
  { key: "Content-Security-Policy", value: csp },
];

const config: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default config;

import { profile } from "@/data/profile";

export const dynamic = "force-static";

/**
 * Tells security researchers where to report a problem with this site (RFC 9116).
 * The expiry date is set when the site is built, a little under a year ahead, so
 * every deploy renews it.
 */
export function GET() {
  const expires = new Date(Date.now() + 360 * 24 * 60 * 60 * 1000);
  expires.setUTCHours(0, 0, 0, 0);
  const lines = [
    `Contact: mailto:${profile.email}`,
    `Expires: ${expires.toISOString()}`,
    "Preferred-Languages: en, ur",
    `Canonical: ${profile.siteUrl}/.well-known/security.txt`,
    "",
  ];
  return new Response(lines.join("\n"), { headers: { "content-type": "text/plain; charset=utf-8" } });
}

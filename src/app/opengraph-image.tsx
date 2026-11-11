import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { profile } from "@/data/profile";
import { getChain } from "@/lib/chain";

export const alt = `${profile.name}, full-stack engineer`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const mono = await readFile(join(process.cwd(), "src/fonts/GeistMono-Medium.ttf"));
  const { blocks } = await getChain();
  const recent = blocks.slice(-4);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "#0a1a2f",
          color: "#e8eef6",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 82, fontWeight: 800, letterSpacing: -3, lineHeight: 1 }}>{profile.name}</div>
          <div style={{ fontSize: 34, marginTop: 22, color: "#97aac0" }}>
            Full-stack engineer. TypeScript and Rust, Web3, secure systems.
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          {recent.map((b, i) => (
            <div key={b.hash} style={{ display: "flex", alignItems: "center" }}>
              {i > 0 && <div style={{ width: 28, height: 3, background: "#24415f" }} />}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  width: 230,
                  padding: "16px 18px",
                  border: `2px solid ${i === recent.length - 1 ? "#a9b6ff" : "#24415f"}`,
                  borderRadius: 6,
                  background: "#0f243d",
                }}
              >
                <div style={{ fontSize: 24, fontWeight: 700 }}>{b.org}</div>
                <div style={{ fontFamily: "Geist Mono", fontSize: 18, marginTop: 8, color: "#97aac0", display: "flex" }}>
                  <span style={{ color: "#a9b6ff" }}>#{b.height} 0000</span>
                  {b.hash.slice(4, 12)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Geist Mono", data: mono, weight: 500, style: "normal" }] },
  );
}

import { ImageResponse } from "next/og";
import { profile } from "@/data/profile";

export const alt = `${profile.name}, full-stack developer`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const AREAS = [
  { label: "Full-stack", color: "#7fb0ff" },
  { label: "AI", color: "#c9a2ff" },
  { label: "Blockchain", color: "#f6c065" },
  { label: "Security", color: "#55e0c6" },
];

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "#0a1a2f",
          color: "#e8eef6",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 84, fontWeight: 800, letterSpacing: -3, lineHeight: 1 }}>{profile.name}</div>
          <div style={{ fontSize: 36, marginTop: 24, color: "#97aac0" }}>Full-stack developer in Islamabad</div>
        </div>
        <div style={{ display: "flex" }}>
          {AREAS.map((a) => (
            <div
              key={a.label}
              style={{
                display: "flex",
                marginRight: 16,
                padding: "12px 24px",
                borderRadius: 999,
                border: `2px solid ${a.color}`,
                color: a.color,
                fontSize: 30,
                fontWeight: 600,
              }}
            >
              {a.label}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}

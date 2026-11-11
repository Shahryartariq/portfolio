import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a1a2f" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ width: 62, height: 62, border: "11px solid #e8eef6", borderRadius: 6 }} />
          <div style={{ width: 18, height: 11, background: "#e8eef6" }} />
          <div style={{ width: 48, height: 48, background: "#a9b6ff", borderRadius: 6 }} />
        </div>
      </div>
    ),
    size,
  );
}

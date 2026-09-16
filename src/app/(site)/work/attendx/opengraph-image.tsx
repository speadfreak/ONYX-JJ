import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0A0A0F", color: "#00E5A0", fontSize: 60 }}>
        ATTENDX TEST
      </div>
    ),
    size
  );
}

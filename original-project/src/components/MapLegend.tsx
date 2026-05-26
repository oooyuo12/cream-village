import type { PinCategory } from "../types";

const CATEGORY_INFO: Record<
  PinCategory,
  {
    label: string;
    color: string;
    emoji: string;
  }
> = {
  CAFE: {
    label: "카페",
    color: "#8B5E3C",
    emoji: "☕",
  },
  HOSPITAL: {
    label: "동물병원",
    color: "#E53935",
    emoji: "🏥",
  },
  PARK: {
    label: "공원·산책로",
    color: "#43A047",
    emoji: "🌳",
  },
  PET_STORE: {
    label: "용품점",
    color: "#8E24AA",
    emoji: "🛒",
  },
  TOILET: {
    label: "배변시설",
    color: "#1E88E5",
    emoji: "🚮",
  },
  GROOMING: {
    label: "미용·목욕",
    color: "#D81B60",
    emoji: "✂️",
  },
};

export default function MapLegend() {
  return (
    <section
      style={{
        margin: "16px 0",
        padding: "12px",
        border: "1px solid #ddd",
        borderRadius: "12px",
      }}
    >
      <h2 style={{ fontSize: "16px", marginBottom: "10px" }}>지도 범례</h2>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {Object.entries(CATEGORY_INFO).map(([category, info]) => (
          <div
            key={category}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "14px",
            }}
          >
            <span
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: info.color,
                color: "white",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "13px",
              }}
            >
              {info.emoji}
            </span>
            <span>{info.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
import type { RouteResult } from "../types";

type RouteCardProps = {
  route: RouteResult;
  isSelected: boolean;
  onSelect: () => void;
};

const CATEGORY_LABEL: Record<string, string> = {
  CAFE: "반려동물 동반 카페",
  HOSPITAL: "동물병원",
  PARK: "산책로·공원",
  PET_STORE: "반려동물 용품점",
  TOILET: "배변시설",
  GROOMING: "미용·목욕샵",
};

const INTENSITY_COLOR: Record<string, { background: string; color: string }> = {
  가벼움: {
    background: "#dcfce7",
    color: "#166534",
  },
  보통: {
    background: "#fef3c7",
    color: "#92400e",
  },
  "긴 코스": {
    background: "#fee2e2",
    color: "#991b1b",
  },
};

export default function RouteCard({
  route,
  isSelected,
  onSelect,
}: RouteCardProps) {
  const intensityStyle = INTENSITY_COLOR[route.walkingIntensity];

  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        width: "100%",
        textAlign: "left",
        marginTop: "14px",
        padding: "22px",
        border: isSelected ? "3px solid #2563eb" : "1px solid #d1d5db",
        borderRadius: "16px",
        background: isSelected ? "#eff6ff" : "#ffffff",
        color: "#111827",
        cursor: "pointer",
        boxShadow: isSelected
          ? "0 8px 24px rgba(37, 99, 235, 0.25)"
          : "0 4px 14px rgba(0, 0, 0, 0.12)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          marginBottom: "10px",
          flexWrap: "wrap",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "22px",
            fontWeight: 800,
            color: "#111827",
          }}
        >
          {route.title}
        </h3>

        {isSelected && (
          <span
            style={{
              padding: "6px 10px",
              borderRadius: "999px",
              background: "#2563eb",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            선택됨
          </span>
        )}
      </div>

      <p
        style={{
          margin: "8px 0 14px",
          fontSize: "15px",
          lineHeight: 1.6,
          color: "#374151",
        }}
      >
        {route.description}
      </p>

      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: "14px",
        }}
      >
        <span
          style={{
            padding: "8px 12px",
            borderRadius: "10px",
            background: "#f3f4f6",
            color: "#111827",
            fontWeight: 700,
          }}
        >
          예상 거리 {route.totalDistanceKm}km
        </span>

        <span
          style={{
            padding: "8px 12px",
            borderRadius: "10px",
            background: "#dbeafe",
            color: "#1e40af",
            fontWeight: 700,
          }}
        >
          예상 시간 약 {route.estimatedMinutes}분
        </span>

        <span
          style={{
            padding: "8px 12px",
            borderRadius: "10px",
            background: intensityStyle.background,
            color: intensityStyle.color,
            fontWeight: 700,
          }}
        >
          산책 강도 {route.walkingIntensity}
        </span>

        <span
          style={{
            padding: "8px 12px",
            borderRadius: "10px",
            background: "#fef3c7",
            color: "#92400e",
            fontWeight: 700,
          }}
        >
          추천 점수 {route.score}점
        </span>
      </div>

      <ol
        style={{
          margin: 0,
          paddingLeft: "22px",
          color: "#111827",
          lineHeight: 1.8,
          fontSize: "15px",
        }}
      >
        {route.pins.map((pin) => (
          <li key={pin.id}>
            <strong>{pin.name}</strong>
            <span style={{ color: "#6b7280" }}>
              {" "}
              - {CATEGORY_LABEL[pin.category]}
            </span>
          </li>
        ))}
      </ol>
    </button>
  );
}
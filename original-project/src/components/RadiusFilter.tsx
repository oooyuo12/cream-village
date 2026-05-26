export type RadiusFilterValue = 0.5 | 1 | 2 | 3 | 5 | "ALL";

type RadiusFilterProps = {
  selectedRadius: RadiusFilterValue;
  onChange: (radius: RadiusFilterValue) => void;
};

const RADIUS_OPTIONS: Array<{
  label: string;
  value: RadiusFilterValue;
}> = [
  { label: "500m", value: 0.5 },
  { label: "1km", value: 1 },
  { label: "2km", value: 2 },
  { label: "3km", value: 3 },
  { label: "5km", value: 5 },
  { label: "전체", value: "ALL" },
];

export default function RadiusFilter({
  selectedRadius,
  onChange,
}: RadiusFilterProps) {
  return (
    <section
      style={{
        margin: "20px 0",
        padding: "18px",
        borderRadius: "16px",
        border: "1px solid #d1d5db",
        background: "#ffffff",
        color: "#111827",
        boxShadow: "0 4px 14px rgba(0, 0, 0, 0.12)",
      }}
    >
      <h2
        style={{
          margin: "0 0 8px",
          fontSize: "20px",
          fontWeight: 900,
          color: "#111827",
        }}
      >
        출발점 기준 반경 필터
      </h2>

      <p
        style={{
          margin: "0 0 14px",
          fontSize: "14px",
          lineHeight: 1.5,
          color: "#4b5563",
        }}
      >
        선택한 출발 지점 주변의 장소만 표시하고, 해당 범위 안에서 추천 루트를
        계산합니다.
      </p>

      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        {RADIUS_OPTIONS.map((option) => {
          const isSelected = selectedRadius === option.value;

          return (
            <button
              key={String(option.value)}
              type="button"
              onClick={() => onChange(option.value)}
              style={{
                padding: "10px 14px",
                borderRadius: "999px",
                border: isSelected
                  ? "1px solid #2563eb"
                  : "1px solid #cbd5e1",
                background: isSelected ? "#2563eb" : "#ffffff",
                color: isSelected ? "#ffffff" : "#111827",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
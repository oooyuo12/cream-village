export type RegionFilterValue = "ALL" | "DUKYI" | "SEONGNAM" | "BUCHEON";

type RegionFilterProps = {
  selectedRegion: RegionFilterValue;
  onChange: (region: RegionFilterValue) => void;
};

const REGION_OPTIONS: Array<{
  label: string;
  value: RegionFilterValue;
  description: string;
}> = [
  {
    label: "전체",
    value: "ALL",
    description: "모든 조사 지역",
  },
  {
    label: "덕이동",
    value: "DUKYI",
    description: "고양시 일산서구 덕이동 생활권",
  },
  {
    label: "성남·가천대 주변",
    value: "SEONGNAM",
    description: "성남 수정구·중원구·가천대 주변",
  },
  {
    label: "부천 범안로 주변",
    value: "BUCHEON",
    description: "부천 소사구 범안로·양지남로 주변",
  },
];

export default function RegionFilter({
  selectedRegion,
  onChange,
}: RegionFilterProps) {
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
        조사 지역 선택
      </h2>

      <p
        style={{
          margin: "0 0 14px",
          fontSize: "14px",
          lineHeight: 1.5,
          color: "#4b5563",
        }}
      >
        여러 지역의 조사 데이터가 섞여 있을 때, 특정 생활권의 장소만 사용해
        추천 루트를 계산합니다.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "10px",
        }}
      >
        {REGION_OPTIONS.map((option) => {
          const isSelected = selectedRegion === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              style={{
                padding: "14px",
                borderRadius: "14px",
                border: isSelected
                  ? "2px solid #2563eb"
                  : "1px solid #cbd5e1",
                background: isSelected ? "#eff6ff" : "#ffffff",
                color: "#111827",
                textAlign: "left",
                cursor: "pointer",
                boxShadow: isSelected
                  ? "0 4px 12px rgba(37, 99, 235, 0.18)"
                  : "none",
              }}
            >
              <strong
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontSize: "15px",
                  color: isSelected ? "#1d4ed8" : "#111827",
                }}
              >
                {option.label}
              </strong>

              <span
                style={{
                  fontSize: "13px",
                  lineHeight: 1.45,
                  color: "#4b5563",
                }}
              >
                {option.description}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
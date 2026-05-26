import type { Purpose } from "../types";

type PurposeSelectorProps = {
  selectedPurpose: Purpose;
  onChange: (purpose: Purpose) => void;
};

const PURPOSE_OPTIONS: { value: Purpose; label: string }[] = [
  { value: "WALK", label: "단순 산책" },
  { value: "HOSPITAL_VISIT", label: "병원 방문" },
  { value: "GROOMING", label: "미용·목욕" },
  { value: "SHOPPING", label: "용품 구매" },
  { value: "STRESS_RELIEF", label: "스트레스 해소" },
];

export default function PurposeSelector({
  selectedPurpose,
  onChange,
}: PurposeSelectorProps) {
  return (
    <section style={{ margin: "20px 0" }}>
      <h2 style={{ fontSize: "18px", marginBottom: "10px" }}>외출 목적 선택</h2>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {PURPOSE_OPTIONS.map((option) => {
          const isSelected = selectedPurpose === option.value;

          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              style={{
                padding: "10px 14px",
                borderRadius: "8px",
                border: isSelected ? "2px solid #222" : "1px solid #ccc",
                background: isSelected ? "#222" : "#fff",
                color: isSelected ? "#fff" : "#222",
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
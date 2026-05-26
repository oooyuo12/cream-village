import type { CSSProperties } from "react";
import type { DogConditionFilters, DogSize } from "../types";

type DogConditionFilterProps = {
  filters: DogConditionFilters;
  onToggleDogSize: (size: DogSize) => void;
  onToggleIndoorOnly: () => void;
  onToggleParkingOnly: () => void;
  onToggleNoReservationOnly: () => void;
  onClear: () => void;
};

const DOG_SIZE_OPTIONS: { value: DogSize; label: string }[] = [
  { value: "SMALL", label: "소형견 가능" },
  { value: "MEDIUM", label: "중형견 가능" },
  { value: "LARGE", label: "대형견 가능" },
];

const buttonBaseStyle: CSSProperties = {
  padding: "10px 14px",
  borderRadius: "999px",
  border: "1px solid #cbd5e1",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: 700,
  background: "#ffffff",
  color: "#111827",
};

function getToggleButtonStyle(isSelected: boolean): CSSProperties {
  return {
    ...buttonBaseStyle,
    background: isSelected ? "#2563eb" : "#ffffff",
    color: isSelected ? "#ffffff" : "#111827",
    border: isSelected ? "1px solid #2563eb" : "1px solid #cbd5e1",
    boxShadow: isSelected
      ? "0 4px 12px rgba(37, 99, 235, 0.25)"
      : "none",
  };
}

export default function DogConditionFilter({
  filters,
  onToggleDogSize,
  onToggleIndoorOnly,
  onToggleParkingOnly,
  onToggleNoReservationOnly,
  onClear,
}: DogConditionFilterProps) {
  return (
    <section
      style={{
        margin: "20px 0",
        padding: "20px",
        border: "1px solid #d1d5db",
        borderRadius: "16px",
        background: "#ffffff",
        color: "#111827",
        boxShadow: "0 4px 14px rgba(0, 0, 0, 0.12)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "12px",
          alignItems: "center",
          marginBottom: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 800,
              margin: 0,
              color: "#111827",
            }}
          >
            반려견 조건 필터
          </h2>

          <p
            style={{
              margin: "6px 0 0",
              fontSize: "14px",
              color: "#4b5563",
              lineHeight: 1.5,
            }}
          >
            반려견 크기, 실내 동반, 주차, 예약 조건으로 장소를 걸러볼 수
            있습니다.
          </p>
        </div>

        <button
          type="button"
          onClick={onClear}
          style={{
            padding: "9px 13px",
            borderRadius: "999px",
            border: "1px solid #cbd5e1",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 700,
            background: "#f8fafc",
            color: "#334155",
          }}
        >
          조건 초기화
        </button>
      </div>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {DOG_SIZE_OPTIONS.map((option) => {
          const isSelected = filters.selectedDogSizes.includes(option.value);

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onToggleDogSize(option.value)}
              style={getToggleButtonStyle(isSelected)}
            >
              {option.label}
            </button>
          );
        })}

        <button
          type="button"
          onClick={onToggleIndoorOnly}
          style={getToggleButtonStyle(filters.indoorOnly)}
        >
          실내 동반 가능
        </button>

        <button
          type="button"
          onClick={onToggleParkingOnly}
          style={getToggleButtonStyle(filters.parkingOnly)}
        >
          주차 가능
        </button>

        <button
          type="button"
          onClick={onToggleNoReservationOnly}
          style={getToggleButtonStyle(filters.noReservationOnly)}
        >
          예약 없이 가능
        </button>
      </div>
    </section>
  );
}
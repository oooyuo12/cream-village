import type { Location, Pin } from "../types";

export type StartPointMode = "CURRENT" | "DEFAULT" | "PIN" | "CUSTOM";

type StartPointSelectorProps = {
  mode: StartPointMode;
  pins: Pin[];
  selectedPinId: string;
  customStartLocation: Location | null;
  onChangeMode: (mode: StartPointMode) => void;
  onChangePin: (pinId: string) => void;
  onSetStartToMapCenter: () => void;
  onSetStartToCurrentLocation: () => void;
};

const CATEGORY_LABEL: Record<string, string> = {
  CAFE: "카페",
  HOSPITAL: "동물병원",
  PARK: "공원·산책로",
  PET_STORE: "용품점",
  TOILET: "배변시설",
  GROOMING: "미용·목욕",
};

function getButtonStyle(isSelected: boolean) {
  return {
    padding: "10px 14px",
    borderRadius: "999px",
    border: isSelected ? "1px solid #2563eb" : "1px solid #cbd5e1",
    background: isSelected ? "#2563eb" : "#ffffff",
    color: isSelected ? "#ffffff" : "#111827",
    fontWeight: 800,
    cursor: "pointer",
  };
}

function formatCoordinate(value: number) {
  return value.toFixed(6);
}

export default function StartPointSelector({
  mode,
  pins,
  selectedPinId,
  customStartLocation,
  onChangeMode,
  onChangePin,
  onSetStartToMapCenter,
  onSetStartToCurrentLocation,
}: StartPointSelectorProps) {
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
        출발 지점 선택
      </h2>

      <p
        style={{
          margin: "0 0 14px",
          fontSize: "14px",
          lineHeight: 1.5,
          color: "#4b5563",
        }}
      >
        현재 위치, 기본 위치, 등록된 장소, 또는 지도 화면 중앙을 출발점으로
        지정할 수 있습니다.
      </p>

      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: "14px",
        }}
      >
        <button
          type="button"
          onClick={() => onChangeMode("CURRENT")}
          style={getButtonStyle(mode === "CURRENT")}
        >
          현재 위치에서 시작
        </button>

        <button
          type="button"
          onClick={() => onChangeMode("DEFAULT")}
          style={getButtonStyle(mode === "DEFAULT")}
        >
          기본 위치에서 시작
        </button>

        <button
          type="button"
          onClick={() => onChangeMode("PIN")}
          style={getButtonStyle(mode === "PIN")}
        >
          등록된 장소에서 시작
        </button>

        <button
          type="button"
          onClick={onSetStartToMapCenter}
          style={{
            ...getButtonStyle(mode === "CUSTOM"),
            background: mode === "CUSTOM" ? "#7c3aed" : "#ffffff",
            border: mode === "CUSTOM" ? "1px solid #7c3aed" : "1px solid #cbd5e1",
          }}
        >
          지도 중앙에 출발 핀 놓기
        </button>

        <button
          type="button"
          onClick={onSetStartToCurrentLocation}
          style={{
            padding: "10px 14px",
            borderRadius: "999px",
            border: "1px solid #f97316",
            background: "#fff7ed",
            color: "#9a3412",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          출발 핀을 현재 위치로 이동
        </button>
      </div>

      {mode === "PIN" && (
        <select
          value={selectedPinId}
          onChange={(event) => onChangePin(event.target.value)}
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: "12px",
            border: "1px solid #cbd5e1",
            background: "#ffffff",
            color: "#111827",
            fontSize: "15px",
            fontWeight: 700,
            boxSizing: "border-box",
          }}
        >
          <option value="">출발할 장소를 선택하세요</option>

          {pins.map((pin) => (
            <option key={pin.id} value={pin.id}>
              [{CATEGORY_LABEL[pin.category]}] {pin.name}
            </option>
          ))}
        </select>
      )}

      {mode === "CUSTOM" && customStartLocation && (
        <div
          style={{
            marginTop: "12px",
            padding: "12px",
            borderRadius: "12px",
            background: "#f5f3ff",
            color: "#5b21b6",
            border: "1px solid #ddd6fe",
            fontSize: "14px",
            fontWeight: 800,
          }}
        >
          사용자 지정 출발점: 위도{" "}
          {formatCoordinate(customStartLocation.lat)}, 경도{" "}
          {formatCoordinate(customStartLocation.lng)}
        </div>
      )}
    </section>
  );
}
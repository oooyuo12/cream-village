type LocationStatus = "idle" | "loading" | "success" | "error";

type CurrentLocationControlProps = {
  status: LocationStatus;
  onUseCurrentLocation: () => void;
};

const STATUS_TEXT: Record<LocationStatus, string> = {
  idle: "현재 위치를 기준으로 추천 루트를 계산할 수 있습니다.",
  loading: "현재 위치를 불러오는 중입니다...",
  success: "현재 위치가 추천 기준점으로 설정되었습니다.",
  error: "현재 위치를 불러오지 못했습니다. 브라우저 위치 권한을 확인하세요.",
};

export default function CurrentLocationControl({
  status,
  onUseCurrentLocation,
}: CurrentLocationControlProps) {
  const isLoading = status === "loading";
  const isError = status === "error";
  const isSuccess = status === "success";

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
          fontWeight: 800,
          color: "#111827",
        }}
      >
        현재 위치 기준 추천
      </h2>

      <p
        style={{
          margin: "0 0 14px",
          fontSize: "14px",
          lineHeight: 1.5,
          color: isError ? "#991b1b" : isSuccess ? "#166534" : "#4b5563",
          fontWeight: isError || isSuccess ? 700 : 500,
        }}
      >
        {STATUS_TEXT[status]}
      </p>

      <button
        type="button"
        onClick={onUseCurrentLocation}
        disabled={isLoading}
        style={{
          padding: "11px 15px",
          borderRadius: "999px",
          border: "1px solid #2563eb",
          background: isLoading ? "#bfdbfe" : "#2563eb",
          color: "#ffffff",
          fontWeight: 800,
          cursor: isLoading ? "not-allowed" : "pointer",
        }}
      >
        {isLoading ? "위치 확인 중..." : "내 현재 위치 사용"}
      </button>
    </section>
  );
}
import type { WalkingRouteResult } from "../utils/walkingRoute";

type WalkingRouteStatus = "idle" | "loading" | "success" | "error";

type RouteDirectionsPanelProps = {
  status: WalkingRouteStatus;
  route: WalkingRouteResult | null;
};

function formatDistance(meters: number) {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)}km`;
  }

  return `${Math.round(meters)}m`;
}

function formatMinutes(seconds: number) {
  return `약 ${Math.max(1, Math.round(seconds / 60))}분`;
}

export default function RouteDirectionsPanel({
  status,
  route,
}: RouteDirectionsPanelProps) {
  if (status === "loading") {
    return (
      <section
        style={{
          marginTop: "16px",
          padding: "16px",
          borderRadius: "16px",
          background: "#eff6ff",
          color: "#1e40af",
          border: "1px solid #bfdbfe",
          fontWeight: 700,
        }}
      >
        보행 경로 안내를 불러오는 중입니다.
      </section>
    );
  }

  if (status === "error" || !route || route.segments.length === 0) {
    return (
      <section
        style={{
          marginTop: "16px",
          padding: "16px",
          borderRadius: "16px",
          background: "#fff7ed",
          color: "#9a3412",
          border: "1px solid #fed7aa",
          fontWeight: 700,
        }}
      >
        상세 보행 안내를 불러오지 못했습니다. 현재 지도에는 임시 경로가 표시됩니다.
      </section>
    );
  }

  return (
    <section
      style={{
        marginTop: "16px",
        padding: "18px",
        borderRadius: "16px",
        background: "#ffffff",
        color: "#111827",
        border: "1px solid #d1d5db",
        boxShadow: "0 4px 14px rgba(0, 0, 0, 0.12)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "12px",
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: "14px",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: "20px",
              fontWeight: 900,
              color: "#111827",
            }}
          >
            경로 안내
          </h2>
          <p
            style={{
              margin: "6px 0 0",
              color: "#4b5563",
              fontSize: "14px",
              lineHeight: 1.5,
            }}
          >
            지도 선이 겹치는 구간은 아래 구간 순서로 확인하세요.
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <span
            style={{
              padding: "8px 12px",
              borderRadius: "999px",
              background: "#f3f4f6",
              color: "#111827",
              fontWeight: 800,
            }}
          >
            총 {formatDistance(route.distanceMeters)}
          </span>

          <span
            style={{
              padding: "8px 12px",
              borderRadius: "999px",
              background: "#dbeafe",
              color: "#1e40af",
              fontWeight: 800,
            }}
          >
            {formatMinutes(route.durationSeconds)}
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gap: "10px" }}>
        {route.segments.map((segment, index) => (
          <details
            key={segment.id}
            open={index === 0}
            style={{
              padding: "14px",
              borderRadius: "14px",
              border: "1px solid #e5e7eb",
              background: "#f9fafb",
            }}
          >
            <summary
              style={{
                cursor: "pointer",
                fontWeight: 900,
                color: "#111827",
              }}
            >
              {segment.title}: {segment.from} → {segment.to}
              <span
                style={{
                  marginLeft: "8px",
                  color: "#6b7280",
                  fontWeight: 700,
                }}
              >
                {formatDistance(segment.distanceMeters)} ·{" "}
                {formatMinutes(segment.durationSeconds)}
              </span>
            </summary>

            {segment.steps.length > 0 && (
              <ol
                style={{
                  margin: "12px 0 0",
                  paddingLeft: "22px",
                  color: "#374151",
                  lineHeight: 1.8,
                  fontSize: "14px",
                }}
              >
                {segment.steps.slice(0, 8).map((step, stepIndex) => (
                  <li key={`${segment.id}-step-${stepIndex}`}>
                    {step.instruction}
                    <span style={{ color: "#6b7280" }}>
                      {" "}
                      · {formatDistance(step.distanceMeters)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </details>
        ))}
      </div>
    </section>
  );
}
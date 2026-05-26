import type { RouteResult } from "../types";
import type { AiRouteRecommendation } from "../utils/aiRouteClient";

type AiRouteStatus = "idle" | "loading" | "success" | "error";

type AiRoutePanelProps = {
  userRequest: string;
  onChangeUserRequest: (value: string) => void;
  status: AiRouteStatus;
  errorMessage: string;
  result: AiRouteRecommendation | null;
  route: RouteResult | null;
  candidateCount: number;
  onGenerate: () => void;
  onClear: () => void;
};

function getStatusText(status: AiRouteStatus) {
  if (status === "loading") {
    return "AI가 현재 핀 데이터를 분석하는 중입니다...";
  }

  if (status === "success") {
    return "AI 맞춤 루트가 지도에 적용되었습니다.";
  }

  if (status === "error") {
    return "AI 루트 추천에 실패했습니다.";
  }

  return "원하는 산책 조건을 자연어로 입력하면 AI가 핀 조합을 추천합니다.";
}

export default function AiRoutePanel({
  userRequest,
  onChangeUserRequest,
  status,
  errorMessage,
  result,
  route,
  candidateCount,
  onGenerate,
  onClear,
}: AiRoutePanelProps) {
  const isLoading = status === "loading";
  const isDisabled = isLoading || candidateCount < 2;

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
        }}
      >
        AI 맞춤 루트 생성
      </h2>

      <p
        style={{
          margin: "0 0 14px",
          fontSize: "14px",
          lineHeight: 1.5,
          color: "#4b5563",
        }}
      >
        현재 지역, 반경, 반려견 조건을 만족하는 핀 {candidateCount}개를
        기준으로 AI가 방문할 핀 조합을 고릅니다.
      </p>

      <textarea
        value={userRequest}
        onChange={(event) => onChangeUserRequest(event.target.value)}
        placeholder="예: 소형견이랑 30분 정도만 산책하고 싶어. 카페는 빼고 배변시설이랑 공원 위주로 추천해줘."
        rows={4}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "12px 14px",
          borderRadius: "12px",
          border: "1px solid #cbd5e1",
          resize: "vertical",
          fontSize: "15px",
          lineHeight: 1.5,
          color: "#111827",
          background: "#ffffff",
          marginBottom: "12px",
        }}
      />

      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <button
          type="button"
          onClick={onGenerate}
          disabled={isDisabled}
          style={{
            padding: "11px 16px",
            borderRadius: "999px",
            border: "1px solid #7c3aed",
            background: isDisabled ? "#e5e7eb" : "#7c3aed",
            color: isDisabled ? "#6b7280" : "#ffffff",
            fontWeight: 900,
            cursor: isDisabled ? "not-allowed" : "pointer",
          }}
        >
          {isLoading ? "AI 분석 중..." : "AI에게 맞춤 루트 추천받기"}
        </button>

        {route && (
          <button
            type="button"
            onClick={onClear}
            style={{
              padding: "11px 16px",
              borderRadius: "999px",
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#111827",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            AI 루트 해제
          </button>
        )}
      </div>

      <div
        style={{
          padding: "12px",
          borderRadius: "12px",
          background:
            status === "error"
              ? "#fef2f2"
              : status === "success"
              ? "#f5f3ff"
              : "#f8fafc",
          color:
            status === "error"
              ? "#991b1b"
              : status === "success"
              ? "#5b21b6"
              : "#334155",
          border:
            status === "error"
              ? "1px solid #fecaca"
              : status === "success"
              ? "1px solid #ddd6fe"
              : "1px solid #e2e8f0",
          fontWeight: 800,
          marginBottom: result ? "14px" : 0,
        }}
      >
        {status === "error" && errorMessage
          ? errorMessage
          : getStatusText(status)}
      </div>

      {result && route && (
        <div
          style={{
            padding: "14px",
            borderRadius: "14px",
            background: "#fafafa",
            border: "1px solid #e5e7eb",
          }}
        >
          <h3
            style={{
              margin: "0 0 8px",
              fontSize: "18px",
              fontWeight: 900,
            }}
          >
            {result.title}
          </h3>

          <p
            style={{
              margin: "0 0 12px",
              lineHeight: 1.6,
              color: "#374151",
            }}
          >
            {result.summary}
          </p>

          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              marginBottom: "12px",
            }}
          >
            <span
              style={{
                padding: "7px 10px",
                borderRadius: "999px",
                background: "#ede9fe",
                color: "#5b21b6",
                fontWeight: 800,
              }}
            >
              AI 신뢰도 {result.confidenceScore}점
            </span>

            <span
              style={{
                padding: "7px 10px",
                borderRadius: "999px",
                background: "#eff6ff",
                color: "#1d4ed8",
                fontWeight: 800,
              }}
            >
              선택 핀 {route.pins.length}개
            </span>
          </div>

          <ol
            style={{
              margin: "0 0 12px",
              paddingLeft: "22px",
              lineHeight: 1.7,
            }}
          >
            {route.pins.map((pin) => (
              <li key={pin.id}>
                <strong>{pin.name}</strong>
                <span style={{ color: "#6b7280" }}> - {pin.category}</span>
              </li>
            ))}
          </ol>

          {result.reasons.length > 0 && (
            <>
              <strong>추천 이유</strong>
              <ul
                style={{
                  margin: "6px 0 12px",
                  paddingLeft: "20px",
                  lineHeight: 1.6,
                }}
              >
                {result.reasons.map((reason, index) => (
                  <li key={`reason-${index}`}>{reason}</li>
                ))}
              </ul>
            </>
          )}

          {result.warnings.length > 0 && (
            <>
              <strong>주의사항</strong>
              <ul
                style={{
                  margin: "6px 0 0",
                  paddingLeft: "20px",
                  lineHeight: 1.6,
                  color: "#92400e",
                }}
              >
                {result.warnings.map((warning, index) => (
                  <li key={`warning-${index}`}>{warning}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </section>
  );
}
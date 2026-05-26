type VercelRequest = {
  method?: string;
  body?: unknown;
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => unknown;
};

type CandidatePin = {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  address?: string;
  description?: string;
  notes?: string;
  dogFriendlyScore?: number;
  routePriorityScore?: number;
  accessibilityScore?: number;
  safetyScore?: number;
};

type AiRouteRequestBody = {
  userRequest: string;
  purpose: string;
  region: string;
  radius: string;
  startLocation: {
    lat: number;
    lng: number;
  };
  dogFilters: {
    selectedDogSizes: string[];
    indoorOnly: boolean;
    parkingOnly: boolean;
    noReservationOnly: boolean;
  };
  candidatePins: CandidatePin[];
};

type GeminiPinSelection = {
  selectedPinIds: string[];
};

type AiRouteResponseBody = {
  title: string;
  summary: string;
  selectedPinIds: string[];
  reasons: string[];
  warnings: string[];
  confidenceScore: number;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

const DEFAULT_MODEL_CANDIDATES = ["gemini-3.5-flash", "gemini-2.5-flash"];

const PIN_SELECTION_SCHEMA = {
  type: "object",
  properties: {
    selectedPinIds: {
      type: "array",
      description:
        "candidatePins 안에 존재하는 핀 id만 사용한다. 방문 순서대로 2개 이상 4개 이하를 선택한다.",
      items: {
        type: "string",
      },
    },
  },
  required: ["selectedPinIds"],
};

const CATEGORY_KOREAN_LABEL: Record<string, string> = {
  CAFE: "카페",
  HOSPITAL: "동물병원",
  PARK: "산책로·공원",
  PET_STORE: "반려동물 용품점",
  TOILET: "배변시설",
  GROOMING: "미용·목욕샵",
};

function getBody(req: VercelRequest): AiRouteRequestBody {
  if (typeof req.body === "string") {
    return JSON.parse(req.body) as AiRouteRequestBody;
  }

  return req.body as AiRouteRequestBody;
}

function getModelCandidates() {
  const customModel = process.env.GEMINI_MODEL?.trim();

  if (customModel) {
    return [customModel, ...DEFAULT_MODEL_CANDIDATES].filter(
      (model, index, array) => array.indexOf(model) === index
    );
  }

  return DEFAULT_MODEL_CANDIDATES;
}

function limitCandidatePins(pins: CandidatePin[]): CandidatePin[] {
  return pins.slice(0, 60).map((pin) => ({
    id: pin.id,
    name: pin.name,
    category: pin.category,
    lat: pin.lat,
    lng: pin.lng,
    address: pin.address,
    description: pin.description,
    notes: pin.notes,
    dogFriendlyScore: pin.dogFriendlyScore,
    routePriorityScore: pin.routePriorityScore,
    accessibilityScore: pin.accessibilityScore,
    safetyScore: pin.safetyScore,
  }));
}

function buildPrompt(body: AiRouteRequestBody) {
  const candidatePins = limitCandidatePins(body.candidatePins);

  return `
너는 반려견 산책 지도 웹앱의 AI 핀 선택 엔진이다.

너의 임무:
- candidatePins 목록에서 사용자의 요청에 맞는 방문 핀 id만 고른다.
- 실제 보행 경로 계산은 지도 API가 하므로, 너는 핀 조합만 선택한다.
- 반드시 candidatePins에 존재하는 id만 사용한다.
- 없는 장소, 새 장소, 추측한 장소를 만들지 않는다.
- selectedPinIds는 실제 방문 순서대로 정렬한다.
- 보통 산책이면 2~3개 핀을 고른다.
- 긴 산책 요청이면 3~4개 핀까지 고른다.
- 너무 먼 장소를 억지로 포함하지 않는다.
- 배변시설과 산책로·공원은 일상 산책에서 우선 고려한다.
- 사용자가 카페 제외, 병원 제외처럼 말하면 해당 카테고리를 피한다.

현재 조건:
사용자 요청: ${body.userRequest || "현재 필터 조건에 맞춰 추천"}
목적: ${body.purpose}
지역: ${body.region}
반경: ${body.radius}
출발점 좌표: ${JSON.stringify(body.startLocation)}
반려견 조건: ${JSON.stringify(body.dogFilters)}

candidatePins:
${JSON.stringify(candidatePins, null, 2)}

출력:
JSON 객체 하나만 출력한다.
형식:
{
  "selectedPinIds": ["candidatePins에 존재하는 id만"]
}
`;
}

async function callGemini({
  apiKey,
  model,
  prompt,
  structured,
}: {
  apiKey: string;
  model: string;
  prompt: string;
  structured: boolean;
}) {
  const generationConfig = structured
    ? {
        temperature: 0.05,
        maxOutputTokens: 300,
        responseFormat: {
          text: {
            mimeType: "application/json",
            schema: PIN_SELECTION_SCHEMA,
          },
        },
      }
    : {
        temperature: 0.05,
        maxOutputTokens: 300,
      };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig,
      }),
    }
  );

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(
      `Gemini model ${model} failed with ${response.status}: ${responseText}`
    );
  }

  const data = JSON.parse(responseText) as GeminiResponse;

  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("") ?? "";

  if (!text.trim()) {
    throw new Error(`Gemini model ${model} returned empty text.`);
  }

  return text.trim();
}

function stripCodeFence(text: string) {
  return text
    .trim()
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();
}

function tryParseJsonSelection(text: string): GeminiPinSelection | null {
  const cleanedText = stripCodeFence(text);

  try {
    return JSON.parse(cleanedText) as GeminiPinSelection;
  } catch {
    // continue
  }

  const jsonStart = cleanedText.indexOf("{");
  const jsonEnd = cleanedText.lastIndexOf("}");

  if (jsonStart >= 0 && jsonEnd > jsonStart) {
    try {
      return JSON.parse(cleanedText.slice(jsonStart, jsonEnd + 1)) as GeminiPinSelection;
    } catch {
      return null;
    }
  }

  return null;
}

function extractPinIdsFromRawText(
  text: string,
  validPinIdSet: Set<string>
): string[] {
  const selectedIds: string[] = [];

  validPinIdSet.forEach((pinId) => {
    if (text.includes(pinId)) {
      selectedIds.push(pinId);
    }
  });

  return selectedIds;
}

function getDistanceKm(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): number {
  const earthRadiusKm = 6371;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

function createDeterministicFallbackPinIds(body: AiRouteRequestBody): string[] {
  const pins = limitCandidatePins(body.candidatePins);

  const requestText = body.userRequest.toLowerCase();

  const categoryBoost = (pin: CandidatePin) => {
    if (requestText.includes("카페") && pin.category === "CAFE") return 18;
    if (requestText.includes("병원") && pin.category === "HOSPITAL") return 18;
    if (requestText.includes("용품") && pin.category === "PET_STORE") return 18;
    if (requestText.includes("미용") && pin.category === "GROOMING") return 18;
    if (requestText.includes("배변") && pin.category === "TOILET") return 22;
    if (
      (requestText.includes("공원") ||
        requestText.includes("산책") ||
        requestText.includes("탄천")) &&
      pin.category === "PARK"
    ) {
      return 22;
    }

    if (body.purpose === "WALK" && pin.category === "TOILET") return 15;
    if (body.purpose === "WALK" && pin.category === "PARK") return 15;

    return 0;
  };

  const excludedCategoryPenalty = (pin: CandidatePin) => {
    if (requestText.includes("카페") && requestText.includes("빼") && pin.category === "CAFE") {
      return 100;
    }

    if (requestText.includes("카페") && requestText.includes("제외") && pin.category === "CAFE") {
      return 100;
    }

    return 0;
  };

  const scoredPins = pins
    .map((pin) => {
      const distanceKm = getDistanceKm(body.startLocation, {
        lat: pin.lat,
        lng: pin.lng,
      });

      const baseScore =
        (pin.dogFriendlyScore ?? 3) * 8 +
        (pin.routePriorityScore ?? 3) * 8 +
        (pin.accessibilityScore ?? 3) * 5 +
        (pin.safetyScore ?? 3) * 5;

      return {
        pin,
        score:
          baseScore +
          categoryBoost(pin) -
          excludedCategoryPenalty(pin) -
          distanceKm * 8,
      };
    })
    .sort((a, b) => b.score - a.score);

  const selected: CandidatePin[] = [];
  const preferredCategories =
    body.purpose === "WALK"
      ? ["TOILET", "PARK", "PARK", "CAFE"]
      : ["PARK", "TOILET", "CAFE", "PET_STORE"];

  preferredCategories.forEach((category) => {
    const nextPin = scoredPins.find(
      (item) =>
        item.pin.category === category &&
        !selected.some((selectedPin) => selectedPin.id === item.pin.id)
    )?.pin;

    if (nextPin && selected.length < 3) {
      selected.push(nextPin);
    }
  });

  scoredPins.forEach((item) => {
    if (selected.length >= 3) {
      return;
    }

    if (!selected.some((pin) => pin.id === item.pin.id)) {
      selected.push(item.pin);
    }
  });

  return selected.map((pin) => pin.id);
}

function normalizeSelectedPinIds(
  rawPinIds: string[],
  validPinIdSet: Set<string>
): string[] {
  return Array.from(
    new Set(rawPinIds.filter((pinId) => validPinIdSet.has(pinId)))
  ).slice(0, 4);
}

async function selectPinIdsWithGemini({
  apiKey,
  model,
  body,
  prompt,
  validPinIdSet,
}: {
  apiKey: string;
  model: string;
  body: AiRouteRequestBody;
  prompt: string;
  validPinIdSet: Set<string>;
}) {
  const rawResponses: string[] = [];

  try {
    const structuredText = await callGemini({
      apiKey,
      model,
      prompt,
      structured: true,
    });

    rawResponses.push(structuredText);

    const parsed = tryParseJsonSelection(structuredText);

    if (parsed?.selectedPinIds) {
      const ids = normalizeSelectedPinIds(parsed.selectedPinIds, validPinIdSet);

      if (ids.length > 0) {
        return ids;
      }
    }

    const extracted = normalizeSelectedPinIds(
      extractPinIdsFromRawText(structuredText, validPinIdSet),
      validPinIdSet
    );

    if (extracted.length > 0) {
      return extracted;
    }
  } catch (error) {
    rawResponses.push(error instanceof Error ? error.message : String(error));
  }

  try {
    const plainText = await callGemini({
      apiKey,
      model,
      prompt,
      structured: false,
    });

    rawResponses.push(plainText);

    const parsed = tryParseJsonSelection(plainText);

    if (parsed?.selectedPinIds) {
      const ids = normalizeSelectedPinIds(parsed.selectedPinIds, validPinIdSet);

      if (ids.length > 0) {
        return ids;
      }
    }

    const extracted = normalizeSelectedPinIds(
      extractPinIdsFromRawText(plainText, validPinIdSet),
      validPinIdSet
    );

    if (extracted.length > 0) {
      return extracted;
    }
  } catch (error) {
    rawResponses.push(error instanceof Error ? error.message : String(error));
  }

  const fallbackIds = createDeterministicFallbackPinIds(body);

  if (fallbackIds.length > 0) {
    return fallbackIds;
  }

  throw new Error(
    `Gemini가 유효한 핀 ID를 선택하지 못했습니다. 원문: ${rawResponses.join(
      "\n\n"
    )}`
  );
}

function buildResult(
  body: AiRouteRequestBody,
  selectedPinIds: string[]
): AiRouteResponseBody {
  const pinMap = new Map(body.candidatePins.map((pin) => [pin.id, pin]));
  const selectedPins = selectedPinIds
    .map((pinId) => pinMap.get(pinId))
    .filter((pin): pin is CandidatePin => Boolean(pin));

  const categoryLabels = selectedPins.map(
    (pin) => CATEGORY_KOREAN_LABEL[pin.category] ?? pin.category
  );

  const uniqueCategoryLabels = Array.from(new Set(categoryLabels));

  const title = "AI 맞춤 산책 루트";

  const summary =
    selectedPins.length > 0
      ? `${uniqueCategoryLabels.join(", ")}을(를) 조합해 현재 조건에 맞는 루트를 구성했습니다.`
      : "현재 조건에 맞춰 AI가 추천한 루트입니다.";

  const reasons = [
    "현재 선택한 지역, 반경, 반려견 조건 안에 있는 핀만 사용했습니다.",
    selectedPins.some((pin) => pin.category === "TOILET")
      ? "배변 처리 후보 지점을 포함해 산책 전후 관리가 쉽습니다."
      : "사용자 요청과 가까운 장소 조합을 우선했습니다.",
    selectedPins.some((pin) => pin.category === "PARK")
      ? "공원 또는 산책로 지점을 포함해 실제 산책 목적에 맞췄습니다."
      : "가까운 후보 핀을 중심으로 이동 부담을 줄였습니다.",
  ];

  const warnings = selectedPins
    .flatMap((pin) => {
      const notes = pin.notes ?? "";
      const result: string[] = [];

      if (notes.includes("확인 필요") || notes.includes("현장확인필요")) {
        result.push(`${pin.name}: 현장 확인이 필요한 정보가 있습니다.`);
      }

      if (notes.includes("배변봉투함 여부") || notes.includes("공식 배변봉투함")) {
        result.push(`${pin.name}: 배변봉투함 여부는 방문 전 확인이 필요합니다.`);
      }

      if (notes.includes("동반 가능 여부")) {
        result.push(`${pin.name}: 반려견 동반 가능 여부를 방문 전 확인하세요.`);
      }

      return result;
    })
    .slice(0, 4);

  return {
    title,
    summary,
    selectedPinIds,
    reasons,
    warnings,
    confidenceScore: selectedPinIds.length >= 2 ? 82 : 65,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({
      message: "POST 요청만 지원합니다.",
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      message: "GEMINI_API_KEY 환경변수가 없습니다.",
    });
  }

  try {
    const body = getBody(req);

    if (!body.candidatePins || body.candidatePins.length < 2) {
      return res.status(400).json({
        message: "AI 루트를 만들 후보 핀이 부족합니다.",
      });
    }

    const prompt = buildPrompt(body);
    const validPinIdSet = new Set(body.candidatePins.map((pin) => pin.id));
    const modelCandidates = getModelCandidates();

    const errors: string[] = [];

    for (const model of modelCandidates) {
      try {
        const selectedPinIds = await selectPinIdsWithGemini({
          apiKey,
          model,
          body,
          prompt,
          validPinIdSet,
        });

        const result = buildResult(body, selectedPinIds);

        return res.status(200).json(result);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);

        errors.push(`[${model}] ${message}`);
        console.error(`[${model}] ${message}`);
      }
    }

    const fallbackPinIds = createDeterministicFallbackPinIds(body);

    if (fallbackPinIds.length > 0) {
      return res.status(200).json(buildResult(body, fallbackPinIds));
    }

    return res.status(502).json({
      message: "Gemini API 호출 또는 핀 선택에 실패했습니다.",
      detail: errors.join("\n\n"),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    console.error(message);

    return res.status(500).json({
      message: "AI 루트 추천 처리 중 오류가 발생했습니다.",
      detail: message,
    });
  }
}
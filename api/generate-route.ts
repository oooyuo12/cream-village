import { GoogleGenAI, Type } from "@google/genai";

type VercelRequest = {
  method?: string;
  body?: any;
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => unknown;
};

function getBody(req: VercelRequest) {
  if (typeof req.body === "string") {
    return JSON.parse(req.body || "{}");
  }
  return req.body || {};
}

function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }

  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "cream-village-vercel-app",
      },
    },
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST 요청만 지원합니다." });
  }

  try {
    const { character, requirement, radius, purpose, region } = getBody(req);

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured. Add it in Vercel Environment Variables.",
      });
    }

    const charNameMap: Record<string, string> = {
      mango: "고양이 망고 (치즈태비, 호기심 많은 지름길/숨어있는 비밀장소 탐정)",
      janggun: "강아지 장군 (검정 믹스견, 듬직하고 안전한 안심길 가이드)",
      nabi: "고양이 나비 (턱시도 아깽이, 장난꾸러기 돌발 이벤트/놀이보물 찾기 담당)",
      bori: "강아지 보리 (크림색 댕댕이, 풍경/소리/흙내음 위주 감성 치유 힐링가이드)",
      mungchi: "강아지 뭉치 (포메라니안, 무한 체력의 활동가/뱃지 메이커)",
    };

    const guideName = charNameMap[character] || "감성 반려동물 친구들";

    const systemPrompt = `You are an expert storyteller and custom pet walk route creator for high-fidelity interactive map coordinates of Cream Village.
Your goal is to output a beautiful, imaginative, and highly tailored custom route led by the user's selected guide: "${guideName}".
The user's walk requirements are: "${requirement || "신선한 동네 바람 탐험"}".
The user set target radius/distance around ${radius || 1000} meters, walking purpose is "${purpose || "오후 두리번"}", and neighborhood is "${region || "크림빌리지"}".

CRITICAL - Map coordinates grid:
Generate a series of coordinates of the path (between 4 to 6 path points).
Coordinates MUST be on a 0 to 100 grid (e.g. {x: 35, y: 40}).
Ensure these coordinates map a continuous believable walk outline (not erratic jumping, but a sequential walking path).
You MUST also generate exactly 2 or 3 fun interactive checkpoints along these coordinate coordinates.

Checkpoints:
Checkpoint coordinates MUST match or be very close to the path points you created.
Each checkpoint must have a name, interesting description (lore-rich), and "characterComment" - a cute first-person commentary spoken in Korean by the guide in their distinct signature tone!
Tone details for comments:
- mango: "말끝마디에 다우나 ~냥냥체를 남발하는 호기심 탐험묘!"
- janggun: "듬직하고 존댓말이나 씩씩한 보초병 말투, 다치지 않게 수호해준다는 온정!"
- nabi: "헤헤! 꺄아! 거리는 개구쟁이 아깽이, 보물상자랑 도토리를 찾아 기뻐함!"
- bori: "풀냄새 솔솔바람을 읊조리는 문학적이고 조용한 힐링 댕댕이!"
- mungchi: "헥헥! 고고! 달리자! 소리치는 열혈 응원 리더 뽀짝견!"`;

    const userPrompt = `Please generate a single detailed pet adventure walk route, in full match of the instructions. Returning JSON.
Keep descriptions and character comments purely in playful, heartfelt, expressive KOREAN matching the chosen character's personality perfectly.
Generate custom labels, witty Korean tags, and creative pathway names.`;

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: [
            "id",
            "name",
            "description",
            "category",
            "characterGuide",
            "purpose",
            "distance",
            "duration",
            "difficulty",
            "region",
            "coordinates",
            "checkpoints",
            "tags",
          ],
          properties: {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            category: { type: Type.STRING, enum: ["sensory", "nature", "quiet", "adventure"] },
            characterGuide: { type: Type.STRING },
            purpose: { type: Type.STRING },
            distance: { type: Type.NUMBER },
            duration: { type: Type.NUMBER },
            difficulty: { type: Type.STRING, enum: ["easy", "normal", "challenge"] },
            region: { type: Type.STRING },
            coordinates: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["x", "y"],
                properties: {
                  x: { type: Type.INTEGER },
                  y: { type: Type.INTEGER },
                },
              },
            },
            checkpoints: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["id", "name", "description", "x", "y", "type", "discovered", "characterComment"],
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  x: { type: Type.INTEGER },
                  y: { type: Type.INTEGER },
                  type: { type: Type.STRING, enum: ["sniff", "chest", "photo", "rest", "landmark"] },
                  discovered: { type: Type.BOOLEAN },
                  characterComment: { type: Type.STRING },
                },
              },
            },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
        },
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    return res.status(200).json(parsedData);
  } catch (err: any) {
    console.error("Gemini route generation failed:", err);
    return res.status(500).json({ error: err.message || "Unknown server error occurred." });
  }
}

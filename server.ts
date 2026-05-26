import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import aiRouteRecommendHandler from "./api/ai-route-recommend";

// Load environment variables from .env
// Required for AI features: GEMINI_API_KEY
// Optional: PORT, GOOGLE_MAPS_PLATFORM_KEY
// Optional for legacy AI route selection: GEMINI_MODEL
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json({ limit: "2mb" }));

function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }

  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "cream-village-merged-app",
      },
    },
  });
}

// Team UI route generator endpoint.
// Used by src/components/AiRoutePanel.tsx -> fetch('/api/generate-route')
app.post("/api/generate-route", async (req, res) => {
  try {
    const { character, requirement, radius, purpose, region } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured. Create a .env file and add GEMINI_API_KEY.",
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
    return res.json(parsedData);
  } catch (err: any) {
    console.error("Gemini route generation failed:", err);
    return res.status(500).json({ error: err.message || "Unknown server error occurred." });
  }
});

// Legacy endpoint from the original project.
// Kept so the original AI pin-selection API is preserved after merging.
app.all("/api/ai-route-recommend", async (req, res) => {
  return aiRouteRecommendHandler(req as any, res as any);
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));

    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[CREAM-VILLAGE] running on http://localhost:${PORT}`);
  });
}

startServer();

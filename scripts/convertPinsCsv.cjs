const fs = require("fs");
const path = require("path");
const Papa = require("papaparse");

const inputPath = path.join(__dirname, "..", "data-source", "pins.csv");
const outputPath = path.join(__dirname, "..", "src", "data", "pins.ts");

const VALID_CATEGORIES = new Set([
  "CAFE",
  "HOSPITAL",
  "PARK",
  "PET_STORE",
  "TOILET",
  "GROOMING",
]);

const VALID_DOG_SIZES = new Set(["SMALL", "MEDIUM", "LARGE"]);

function parseBoolean(value) {
  if (value === undefined || value === null) return undefined;

  const text = String(value).trim().toLowerCase();

  if (["true", "yes", "y", "1", "가능", "o"].includes(text)) return true;
  if (["false", "no", "n", "0", "불가", "x"].includes(text)) return false;

  return undefined;
}

function parseNumber(value, fallback = undefined) {
  if (value === undefined || value === null || value === "") return fallback;

  const number = Number(value);

  if (Number.isNaN(number)) return fallback;

  return number;
}

function parseDogSizes(value) {
  if (!value) return [];

  return String(value)
    .split("|")
    .map((item) => item.trim().toUpperCase())
    .filter((item) => VALID_DOG_SIZES.has(item));
}

function cleanString(value) {
  if (value === undefined || value === null) return undefined;

  const text = String(value).trim();

  return text.length > 0 ? text : undefined;
}

function toPin(row, index) {
  const id = cleanString(row.id);
  const name = cleanString(row.name);
  const category = cleanString(row.category)?.toUpperCase();
  const lat = parseNumber(row.lat);
  const lng = parseNumber(row.lng);

  const errors = [];

  if (!id) errors.push("id 없음");
  if (!name) errors.push("name 없음");
  if (!category || !VALID_CATEGORIES.has(category)) {
    errors.push(`category 오류: ${row.category}`);
  }
  if (lat === undefined) errors.push(`lat 오류: ${row.lat}`);
  if (lng === undefined) errors.push(`lng 오류: ${row.lng}`);

  if (errors.length > 0) {
    throw new Error(
      `CSV ${index + 2}번째 줄 오류: ${errors.join(", ")}`
    );
  }

  return {
    id,
    name,
    category,
    lat,
    lng,
    address: cleanString(row.address),
    description: cleanString(row.description),

    dogFriendlyScore: parseNumber(row.dogFriendlyScore, 3),
    routePriorityScore: parseNumber(row.routePriorityScore, 3),
    accessibilityScore: parseNumber(row.accessibilityScore, 3),
    safetyScore: parseNumber(row.safetyScore, 3),

    dogSizeAllowed: parseDogSizes(row.dogSizeAllowed),
    indoorAllowed: parseBoolean(row.indoorAllowed),
    parkingAvailable: parseBoolean(row.parkingAvailable),
    reservationRequired: parseBoolean(row.reservationRequired),
    leashRequired: parseBoolean(row.leashRequired),

    source: cleanString(row.source),
    lastChecked: cleanString(row.lastChecked),
    notes: cleanString(row.notes),
  };
}

function removeUndefinedFields(object) {
  return Object.fromEntries(
    Object.entries(object).filter(([, value]) => {
      if (value === undefined) return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    })
  );
}

function main() {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`CSV 파일을 찾을 수 없습니다: ${inputPath}`);
  }

  const csvText = fs.readFileSync(inputPath, "utf8");

  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  if (result.errors.length > 0) {
    console.error(result.errors);
    throw new Error("CSV 파싱 중 오류가 발생했습니다.");
  }

  const pins = result.data.map((row, index) =>
    removeUndefinedFields(toPin(row, index))
  );

  const fileContent = `import type { Pin } from "../types";

export const pins: Pin[] = ${JSON.stringify(pins, null, 2)};
`;

  fs.writeFileSync(outputPath, fileContent, "utf8");

  console.log(`변환 완료: ${pins.length}개 장소`);
  console.log(`생성 파일: ${outputPath}`);
}

main();
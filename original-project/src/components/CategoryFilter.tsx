import type { PinCategory } from "../types";

type CategoryFilterProps = {
  selectedCategories: PinCategory[];
  onToggleCategory: (category: PinCategory) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
};

const CATEGORY_OPTIONS: { value: PinCategory; label: string }[] = [
  { value: "CAFE", label: "카페" },
  { value: "HOSPITAL", label: "동물병원" },
  { value: "PARK", label: "공원·산책로" },
  { value: "PET_STORE", label: "용품점" },
  { value: "TOILET", label: "배변시설" },
  { value: "GROOMING", label: "미용·목욕" },
];

export default function CategoryFilter({
  selectedCategories,
  onToggleCategory,
  onSelectAll,
  onClearAll,
}: CategoryFilterProps) {
  return (
    <section style={{ margin: "20px 0" }}>
      <h2 style={{ fontSize: "18px", marginBottom: "10px" }}>카테고리 필터</h2>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button
          onClick={onSelectAll}
          style={{
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            cursor: "pointer",
          }}
        >
          전체 보기
        </button>

        <button
          onClick={onClearAll}
          style={{
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            cursor: "pointer",
          }}
        >
          전체 숨기기
        </button>

        {CATEGORY_OPTIONS.map((option) => {
          const isSelected = selectedCategories.includes(option.value);

          return (
            <button
              key={option.value}
              onClick={() => onToggleCategory(option.value)}
              style={{
                padding: "8px 12px",
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
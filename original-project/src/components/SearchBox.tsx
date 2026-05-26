type SearchBoxProps = {
  searchQuery: string;
  onChange: (value: string) => void;
};

export default function SearchBox({ searchQuery, onChange }: SearchBoxProps) {
  return (
    <section style={{ margin: "20px 0" }}>
      <h2 style={{ fontSize: "18px", marginBottom: "10px" }}>장소 검색</h2>

      <input
        type="text"
        value={searchQuery}
        onChange={(event) => onChange(event.target.value)}
        placeholder="장소명, 카테고리, 설명으로 검색하세요. 예: 카페, 공원, 배변"
        style={{
          width: "100%",
          padding: "12px 14px",
          borderRadius: "10px",
          border: "1px solid #d1d5db",
          fontSize: "15px",
          boxSizing: "border-box",
        }}
      />

      {searchQuery.trim() && (
        <p style={{ marginTop: "8px", color: "#6b7280", fontSize: "14px" }}>
          검색어: <strong>{searchQuery}</strong>
        </p>
      )}
    </section>
  );
}
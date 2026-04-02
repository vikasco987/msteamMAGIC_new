type FiltersProps = {
  year: number | null;
  setYear: (year: number) => void;
  month: string | null;
  setMonth: (month: string) => void;
};

export default function Filters({ year, setYear, month, setMonth }: FiltersProps) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div className="bg-white p-4 border rounded-md">
      <h2 className="text-lg font-semibold mb-4">📅 Filters</h2>

      <div className="mb-4">
        <p>Year</p>
        {[2025, 2024, 2023].map((yr) => (
          <button
            key={yr}
            onClick={() => setYear(yr)}
            className={`px-3 py-1 border rounded mr-2 ${
              yr === year ? "bg-blue-600 text-white" : ""
            }`}
          >
            {yr}
          </button>
        ))}
      </div>

      <div>
        <p>Month</p>
        {months.map((m) => (
          <button
            key={m}
            onClick={() => setMonth(m)}
            className={`px-3 py-1 border rounded mr-2 mb-2 ${
              m === month ? "bg-blue-600 text-white" : ""
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <p className="mt-4 text-sm text-gray-600">
        <strong>Selected:</strong> {month} {year}
      </p>
    </div>
  );
}

const MOCK_ARRAY = new Array(50).fill("").map((_, i) => i);

export function TestResultsPage() {
  return (
    <div className="flex flex-col flex-grow p-4 space-y-2 overflow-auto bg-green-200">
      {MOCK_ARRAY.map((_, i) => (
        <div className="p-4 bg-green-300" key={i}>
          Test Results {i}
        </div>
      ))}
    </div>
  );
}

import { useTests } from "./hooks/useTests";

export default function TestsPage() {
  const tests = useTests();

  return (
    <div>
      <div>Tests</div>
      {tests.length ? <TestList tests={tests} /> : null}
    </div>
  );
}

function TestList({ tests }: { tests: any[] }) {
  if (!tests.length) {
    return null;
  }

  return (
    <div>
      {tests.map((t, i) => (
        <div key={i}>{t.title}</div>
      ))}
    </div>
  );
}

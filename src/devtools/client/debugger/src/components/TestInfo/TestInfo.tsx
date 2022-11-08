import { useFetchCypressSpec } from "ui/hooks/useFetchCypressSpec";
import { getReporterAnnotations } from "ui/reducers/reporter";
import { useAppSelector } from "ui/setup/hooks";
import { TestItem } from "ui/types";

import { TestCase } from "./TestCase";

export default function TestInfo({ testCases }: { testCases: TestItem[] }) {
  const annotations = useAppSelector(getReporterAnnotations);
  const cypressResults = useFetchCypressSpec();

  // The test start times in metadata may be incorrect. If we have the reporter annotations,
  // we can use those instead
  const correctedTestCases = testCases.map((t, i) => ({
    ...t,
    relativeStartTime: annotations?.[i]?.time ? annotations?.[i]?.time : t.relativeStartTime,
  }));

  return (
    <div className="flex flex-col px-4 py-2 space-y-1">
      {annotations.length}
      {correctedTestCases.map((t, i) => (
        <TestCase test={t} key={i} location={cypressResults?.[i]?.location} />
      ))}
    </div>
  );
}

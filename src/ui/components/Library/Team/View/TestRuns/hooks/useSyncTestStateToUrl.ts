import { useRouter } from "next/router";
import { Dispatch, SetStateAction, useEffect, useRef } from "react";

import { parseQueryParams } from "ui/components/Library/Team/utils";

export function useSyncTestStateToUrl(
  teamId: string,
  testRunId: string | null,
  setTestRunId: Dispatch<SetStateAction<string | null>>,
  testId: string | null,
  setTestId: Dispatch<SetStateAction<string | null>>
) {
  const router = useRouter();

  const prevTestRunIdRef = useRef(testRunId);
  const prevTestIdRef = useRef(testId);

  // Sync component state changes to URL
  useEffect(() => {
    const prevTestRunId = prevTestRunIdRef.current;
    const prevTestId = prevTestIdRef.current;
    if (testRunId && (testRunId !== prevTestRunId || (testId && testId !== prevTestId))) {
      const pathname = `/team/${teamId}/runs/${testRunId}${testId ? `/tests/${testId}` : ""}`;
      if (prevTestRunId === null) {
        router.replace({ pathname, query: router.query });
      } else if (prevTestRunIdRef.current !== testRunId || prevTestIdRef.current !== testId) {
        router.push({ pathname, query: router.query });
      }
    }

    prevTestRunIdRef.current = testRunId;
    prevTestIdRef.current = testId;
  }, [router, teamId, testRunId, testId]);

  // Sync URL changes to component state
  useEffect(() => {
    const testRunIdFromState = prevTestRunIdRef.current;
    const testIdFromState = prevTestIdRef.current;
    const { testRunId: testRunIdFromUrl, testId: testIdFromUrl } = parseQueryParams(router.query);
    if (testRunIdFromUrl) {
      if (testRunIdFromState !== testRunIdFromUrl) {
        setTestRunId(testRunIdFromUrl);
      }
      if (testIdFromState !== testIdFromUrl) {
        setTestId(testIdFromUrl);
      }
    }
  }, [router.query, setTestRunId, setTestId]);
}

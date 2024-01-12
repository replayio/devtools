import { useRouter } from "next/router";
import { Dispatch, SetStateAction, useEffect, useRef } from "react";

import { parseQueryParams } from "ui/components/Library/Team/utils";

export function useSyncTestStateToUrl(
  teamId: string,
  viewId: string | null,
  setViewId: Dispatch<SetStateAction<string | null>>,
  subId?: string | null,
  setSubId?: Dispatch<SetStateAction<string | null>>
) {
  const router = useRouter();
  const {view} = parseQueryParams(router.query)

  const prevViewIdRef = useRef(viewId);
  const prevSubIdRef = useRef(subId);

  // Sync component state changes to URL
  useEffect(() => {
    const prevViewId = prevViewIdRef.current;
    const prevSubId = prevSubIdRef.current;
    if (viewId && (viewId !== prevViewId || (subId && subId !== prevSubId))) {
      const pathname = [`team/${teamId}`, view, viewId, subId].filter(Boolean).join("/");
      if (prevViewId === null) {
        router.replace({ pathname, query: router.query });
      } else if (prevViewIdRef.current !== viewId || prevSubIdRef.current !== subId) {
        router.push({ pathname, query: router.query });
      }
    }

    prevViewIdRef.current = viewId;
    prevSubIdRef.current = subId;
  }, [router, teamId, viewId, subId, view]);

  // Sync URL changes to component state
  useEffect(() => {
    const testRunIdFromState = prevViewIdRef.current;
    const testIdFromState = prevSubIdRef.current;
    const { viewId, subId } = parseQueryParams(router.query);
    if (viewId) {
      if (testRunIdFromState !== viewId) {
        setViewId(viewId);
      }
      if (testIdFromState !== subId && setSubId) {
        setSubId(subId);
      }
    }
  }, [router.query, setViewId, setSubId]);
}

import {
  PropsWithChildren,
  createContext,
  useCallback,
  useDeferredValue,
  useMemo,
  useState,
} from "react";

import { REQUEST_DURATION_SLOW_THRESHOLD_MS } from "ui/components/ProtocolViewer/components/ProtocolViewerListItem";
import {
  ProtocolErrorMap,
  ProtocolRequestMap,
  ProtocolResponseMap,
} from "ui/reducers/protocolMessages";

export type FilterByCategory = "failed" | "pending" | "slow";

export type ProtocolViewerScope = "live" | "recorded";

export type ProtocolViewerContextType = {
  clearCurrentRequests: () => void;
  errorMap: ProtocolErrorMap;
  filteredRequestIds: number[];
  filterByCategory: FilterByCategory | null;
  filterByText: string;
  longestRequestDuration: number;
  requestMap: ProtocolRequestMap;
  responseMap: ProtocolResponseMap;
  scope: ProtocolViewerScope;
  selectedRequestId: number | null;
  selectRequest: (id: number | null) => void;
  updateFilterByCategory: (category: FilterByCategory | null) => void;
  updateFilterByText: (text: string) => void;
};

export const ProtocolViewerContext = createContext<ProtocolViewerContextType>(null as any);

export function ProtocolViewerContextRoot({
  children,
  errorMap,
  requestMap,
  responseMap,
  scope,
}: PropsWithChildren & {
  errorMap: ProtocolErrorMap;
  requestMap: ProtocolRequestMap;
  responseMap: ProtocolResponseMap;
  scope: ProtocolViewerScope;
}) {
  const [filterByCategory, updateFilterByCategory] = useState<FilterByCategory | null>(null);
  const [filterByText, updateFilterByText] = useState("");
  const [selectedRequestId, selectRequest] = useState<number | null>(null);
  const [clearBeforeIndex, setClearBeforeIndex] = useState(-1);

  const clearCurrentRequests = useCallback(() => {
    const length = Object.keys(requestMap).length;
    setClearBeforeIndex(length);
  }, [requestMap]);

  const deferredFilterByCategory = useDeferredValue(filterByCategory);
  const deferredFilterByText = useDeferredValue(filterByText);

  const longestRequestDuration = useMemo(() => {
    let longestDuration = 0;

    Array.from(Object.values(requestMap)).forEach(request => {
      const response = responseMap[request.id];
      if (!response) {
        return;
      }

      const duration = response.recordedAt - request.recordedAt;
      if (duration > longestDuration) {
        longestDuration = duration;
      }
    });

    return longestDuration;
  }, [requestMap, responseMap]);

  const filteredRequestIds = useMemo(() => {
    const filteredIds: number[] = [];

    const isInverseSearch =
      deferredFilterByText.startsWith("!") || deferredFilterByText.startsWith("-");
    const lowerCaseFilterByText = isInverseSearch
      ? deferredFilterByText.substring(1).toLowerCase()
      : deferredFilterByText.toLowerCase();

    Array.from(Object.values(requestMap)).forEach((request, index) => {
      if (index < clearBeforeIndex) {
        return;
      }

      if (deferredFilterByCategory) {
        switch (deferredFilterByCategory) {
          case "failed": {
            if (!errorMap[request.id]) {
              return;
            }
            break;
          }
          case "pending": {
            if (responseMap[request.id]) {
              return;
            }
            break;
          }
          case "slow": {
            const response = responseMap[request.id];
            if (!response) {
              return;
            } else {
              const duration = response.recordedAt - request.recordedAt;
              if (duration < REQUEST_DURATION_SLOW_THRESHOLD_MS) {
                return;
              }
            }
            break;
          }
        }
      }

      if (deferredFilterByText) {
        const text = `${request.class}.${request.method}`.toLowerCase();
        const match = text.includes(lowerCaseFilterByText);
        if (match === isInverseSearch) {
          return;
        }
      }

      filteredIds.push(request.id);
    });

    return filteredIds;
  }, [
    clearBeforeIndex,
    deferredFilterByCategory,
    errorMap,
    deferredFilterByText,
    requestMap,
    responseMap,
  ]);

  const value = useMemo(
    () => ({
      clearCurrentRequests,
      errorMap,
      filterByCategory,
      filterByText,
      filteredRequestIds,
      longestRequestDuration,
      requestMap,
      responseMap,
      scope,
      selectedRequestId,
      selectRequest,
      updateFilterByCategory,
      updateFilterByText,
    }),
    [
      clearCurrentRequests,
      errorMap,
      filterByCategory,
      filterByText,
      filteredRequestIds,
      longestRequestDuration,
      requestMap,
      responseMap,
      scope,
      selectedRequestId,
    ]
  );

  return <ProtocolViewerContext.Provider value={value}>{children}</ProtocolViewerContext.Provider>;
}

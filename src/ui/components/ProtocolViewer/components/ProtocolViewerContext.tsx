import {
  PropsWithChildren,
  createContext,
  useCallback,
  useDeferredValue,
  useMemo,
  useState,
} from "react";

import {
  ProtocolErrorMap,
  ProtocolRequestMap,
  ProtocolResponseMap,
} from "ui/reducers/protocolMessages";

export type ProtocolViewerContextType = {
  clearCurrentRequests: () => void;
  errorMap: ProtocolErrorMap;
  filteredRequestIds: number[];
  filterText: string;
  longestRequestDuration: number;
  requestMap: ProtocolRequestMap;
  responseMap: ProtocolResponseMap;
  selectedRequestId: number | null;
  selectRequest: (id: number | null) => void;
  updateFilterText: (text: string) => void;
};

export const ProtocolViewerContext = createContext<ProtocolViewerContextType>(null as any);

export function ProtocolViewerContextRoot({
  children,
  errorMap,
  requestMap,
  responseMap,
}: PropsWithChildren & {
  errorMap: ProtocolErrorMap;
  requestMap: ProtocolRequestMap;
  responseMap: ProtocolResponseMap;
}) {
  const [filterText, updateFilterText] = useState("");
  const [selectedRequestId, selectRequest] = useState<number | null>(null);
  const [clearBeforeIndex, setClearBeforeIndex] = useState(-1);

  const clearCurrentRequests = useCallback(() => {
    const length = Object.keys(requestMap).length;
    console.log("clearCurrentRequests", length);
    setClearBeforeIndex(length);
  }, [requestMap]);

  const deferredFilterText = useDeferredValue(filterText);

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
      deferredFilterText.startsWith("!") || deferredFilterText.startsWith("-");
    const lowerCaseFilterText = isInverseSearch
      ? deferredFilterText.substring(1).toLowerCase()
      : deferredFilterText.toLowerCase();

    Array.from(Object.values(requestMap)).forEach((request, index) => {
      if (index < clearBeforeIndex) {
        return;
      }

      if (deferredFilterText) {
        const text = `${request.class}.${request.method}`.toLowerCase();
        const match = text.includes(lowerCaseFilterText);
        if (match === isInverseSearch) {
          return;
        }
      }

      filteredIds.push(request.id);
    });

    return filteredIds;
  }, [clearBeforeIndex, deferredFilterText, requestMap]);

  const value = useMemo(
    () => ({
      clearCurrentRequests,
      errorMap,
      filteredRequestIds,
      filterText,
      longestRequestDuration,
      requestMap,
      responseMap,
      selectedRequestId,
      selectRequest,
      updateFilterText,
    }),
    [
      clearCurrentRequests,
      errorMap,
      filteredRequestIds,
      filterText,
      longestRequestDuration,
      requestMap,
      responseMap,
      selectedRequestId,
    ]
  );

  return <ProtocolViewerContext.Provider value={value}>{children}</ProtocolViewerContext.Provider>;
}

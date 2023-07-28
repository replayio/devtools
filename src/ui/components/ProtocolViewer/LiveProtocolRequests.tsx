import { ProtocolViewer } from "ui/components/ProtocolViewer/components/ProtocolViewer";
import {
  getProtocolErrorMap,
  getProtocolRequestMap,
  getProtocolResponseMap,
} from "ui/reducers/protocolMessages";
import { useAppSelector } from "ui/setup/hooks";

export function LiveProtocolRequests() {
  const requestMap = useAppSelector(getProtocolRequestMap);
  const responseMap = useAppSelector(getProtocolResponseMap);
  const errorMap = useAppSelector(getProtocolErrorMap);

  return <ProtocolViewer errorMap={errorMap} requestMap={requestMap} responseMap={responseMap} />;
}

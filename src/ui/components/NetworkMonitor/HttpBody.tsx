import { BodyData, RequestBodyData, ResponseBodyData } from "@recordreplay/protocol";
import { useMemo } from "react";
import ReactJson from "react-json-view";
import { base64ToArrayBuffer, ContentType } from "./utils";

const FIVE_MEGABYTES = 5e6;

let utf8decoder = new TextDecoder();

const HttpBody = ({
  bodyParts,
  contentLength,
  contentType,
}: {
  bodyParts: BodyData[];
  contentLength?: string;
  contentType: ContentType;
}) => {
  const content = useMemo(
    () =>
      bodyParts
        .map(x => base64ToArrayBuffer(x.value))
        .map(x => utf8decoder.decode(x))
        .join(""),
    [bodyParts]
  );
  const json = useMemo(() => {
    if (contentType === "json") {
      try {
        return JSON.parse(content);
      } catch {}
    }
    return null;
  }, [content, contentType]);

  if (Number(contentLength) > FIVE_MEGABYTES) {
    return (
      <div className="bg-white w-full overflow-y-auto">
        <div>This response is larger than 5MB, so it will only be partially displayed</div>
      </div>
    );
  }

  if (contentType === "json") {
    return <ReactJson src={json} shouldCollapse={() => true} />;
  }

  if (contentType === "text") {
    return <pre>{content}</pre>;
  }

  return (
    <span>
      This format of response cannot de displayed yet. We only support text and JSON responses right
      now.
    </span>
  );
};

export default HttpBody;

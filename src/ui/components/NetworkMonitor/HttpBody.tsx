import { BodyData } from "@recordreplay/protocol";
import { useMemo } from "react";
import ReactJson from "react-json-view";
import BodyDownload from "./BodyDownload";
import {
  BodyPartsToArrayBuffer,
  Displayable,
  RawToUTF8,
  StringToObjectMaybe,
  URLEncodedToPlaintext,
} from "./content";

const HttpBody = ({
  bodyParts,
  contentType,
  filename,
}: {
  bodyParts: BodyData[];
  contentType: string;
  filename: string;
}) => {
  const raw = useMemo(() => {
    return BodyPartsToArrayBuffer(bodyParts, contentType);
  }, [bodyParts]);

  const displayable = useMemo(() => {
    return StringToObjectMaybe(URLEncodedToPlaintext(RawToUTF8(raw)));
  }, [raw]);

  if (displayable.as === Displayable.JSON) {
    return <ReactJson src={displayable.content} shouldCollapse={() => true} />;
  }
  if (displayable.as === Displayable.Text) {
    return <pre className="max-w-full overflow-scroll">{displayable.content}</pre>;
  }
  if (displayable.as === Displayable.Raw) {
    return (
      <>
        <p>
          This content-type ({contentType}) cannot be displayed, but you can download the response.
        </p>
        <BodyDownload raw={raw} filename={filename} />
      </>
    );
  }
  return null;
};

export default HttpBody;

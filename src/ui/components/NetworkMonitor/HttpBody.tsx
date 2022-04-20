import { BodyData } from "@recordreplay/protocol";
import classNames from "classnames";
import { useMemo, useState } from "react";
import ReactJson from "react-json-view";
import { useSelector } from "react-redux";
import { getTheme } from "ui/reducers/app";

import MaterialIcon from "../shared/MaterialIcon";

import BodyDownload from "./BodyDownload";
import {
  BodyPartsToUInt8Array,
  Displayable,
  RawBody,
  RawToImageMaybe,
  RawToUTF8,
  StringToObjectMaybe,
  TextBody,
  URLEncodedToPlaintext,
} from "./content";
import styles from "./HttpBody.module.css";

const TextBodyComponent = ({ raw, text }: { raw: RawBody; text: string }) => {
  const [copied, setCopied] = useState(false);

  return (
    <div
      className={classNames(styles["copy-container"], "relative pr-6")}
      style={{ width: "fit-content" }}
    >
      <pre className="whitespace-pre-wrap">
        {text}
        <div
          className="absolute top-0 right-1 z-10"
          onClick={() => {
            const asString = RawToUTF8(raw) as TextBody;
            const blob = new Blob([asString.content], { type: "text/plain" });
            navigator.clipboard.write([new ClipboardItem({ "text/plain": blob })]);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          <MaterialIcon
            className={classNames(styles["copy-icon"], { "text-primaryAccent": copied })}
          >
            content_copy
          </MaterialIcon>
        </div>
      </pre>
    </div>
  );
};

const ImageBodyComponent = ({ raw, data }: { raw: RawBody; data: string }) => {
  return (
    <div
      className={classNames(styles["copy-container"], "relative pr-6")}
      style={{ width: "fit-content" }}
    >
      <img src={`data:${raw.contentType};base64,${data}`} />
    </div>
  );
};

const HttpBody = ({
  bodyParts,
  contentType,
  filename,
}: {
  bodyParts: BodyData[];
  contentType: string;
  filename: string;
}) => {
  const theme = useSelector(getTheme);
  const raw = useMemo(() => {
    return BodyPartsToUInt8Array(bodyParts, contentType);
  }, [contentType, bodyParts]);

  const displayable = useMemo(() => {
    return StringToObjectMaybe(URLEncodedToPlaintext(RawToUTF8(RawToImageMaybe(raw))));
  }, [raw]);

  if (displayable.as === Displayable.JSON) {
    return (
      <ReactJson
        style={{ backgroundColor: "none" }}
        theme={theme == "light" ? "rjv-default" : "tube"}
        src={displayable.content}
        shouldCollapse={false}
        displayDataTypes={false}
        displayObjectSize={false}
      />
    );
  }
  if (displayable.as === Displayable.Image) {
    return (
      <>
        <ImageBodyComponent raw={raw} data={displayable.content} />
      </>
    );
  }
  if (displayable.as === Displayable.Text) {
    return (
      <>
        <TextBodyComponent raw={raw} text={displayable.content} />
      </>
    );
  }
  if (displayable.as === Displayable.Raw) {
    return (
      <>
        <div className="flex items-center">
          <p>
            This content-type ({contentType}) cannot be displayed, but you can download the
            response.
          </p>
          <BodyDownload raw={raw} filename={filename} />
        </div>
      </>
    );
  }
  return null;
};

export default HttpBody;

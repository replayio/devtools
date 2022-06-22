import { PauseId, Value as ProtocolValue } from "@replayio/protocol";
import { useContext } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import { getObjectWithPreview } from "../../../src/suspense/ObjectPreviews";
import { filterNonEnumerableProperties, Value as ClientValue } from "../../../src/utils/protocol";

import useClientValue from "../useClientValue";

import ClientValueValueRenderer from "./ClientValueValueRenderer";

import styles from "./shared.module.css";
import { ObjectPreviewRendererProps } from "./types";

type Props = ObjectPreviewRendererProps & {
  showClosingTag?: boolean;
  showChildrenIndicator?: boolean;
  showOpeningTag?: boolean;
};

const MAX_PROPERTIES_TO_PREVIEW = 5;

// Renders a protocol ObjectPreview representing an HTMLElement with a format of:
//   <tag-name attr="value" ...></tag-name>
//
// https://static.replay.io/protocol/tot/Pause/#type-ObjectPreview
export default function HTMLElementRenderer({
  object,
  pauseId,
  showClosingTag = true,
  showChildrenIndicator = true,
  showOpeningTag = true,
}: Props) {
  const client = useContext(ReplayClientContext);
  const tagName = (object.preview?.node?.nodeName || "unknown").toLowerCase();

  if (object.className === "Text") {
    // HTML TextNode should just be rendered as strings.
    const text = object.preview?.node?.nodeValue || "";
    if (text) {
      const clientValue: ClientValue = {
        name: null,
        preview: text,
        type: "string",
      };
      return <ClientValueValueRenderer clientValue={clientValue} isNested={true} />;
    } else {
      return null;
    }
  }

  const childNodes = object.preview?.node?.childNodes ?? [];
  let inlineText: string | null = null;
  if (childNodes.length === 1) {
    const childNode = getObjectWithPreview(client, pauseId, childNodes[0]);
    if (childNode.className === "Text") {
      inlineText = childNode.preview?.node?.nodeValue || null;
    }
  }

  const properties = filterNonEnumerableProperties(object.preview?.node?.attributes ?? []);
  const showOverflowMarker = properties.length > MAX_PROPERTIES_TO_PREVIEW;
  const showInlineText = showChildrenIndicator && (inlineText || childNodes.length > 0);

  return (
    <>
      {showOpeningTag && (
        <div className={styles.HTMLOpeningTag}>
          {tagName}
          {properties.slice(0, MAX_PROPERTIES_TO_PREVIEW).map((property, index) => (
            <HTMLAttributeRenderer key={index} pauseId={pauseId} protocolValue={property} />
          ))}
          {showOverflowMarker && <span className={styles.Value}>…</span>}
        </div>
      )}
      {showInlineText && <div className={styles.HtmlText}>{inlineText || "…"}</div>}
      {showClosingTag && <div className={styles.HTMLClosingTag}>{tagName}</div>}
    </>
  );
}

function HTMLAttributeRenderer({
  pauseId,
  protocolValue,
}: {
  pauseId: PauseId;
  protocolValue: ProtocolValue;
}) {
  const clientValue = useClientValue(protocolValue, pauseId);

  return (
    <span className={styles.HtmlAttribute}>
      <span className={styles.HtmlAttributeName}>{clientValue.name}</span>
      <span className={styles.HtmlAttributeValue}>{protocolValue.value!}</span>
    </span>
  );
}

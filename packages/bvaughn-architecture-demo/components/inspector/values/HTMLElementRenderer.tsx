import Icon from "bvaughn-architecture-demo/components/Icon";
import {
  InspectableTimestampedPointContext,
  InspectorContext,
} from "bvaughn-architecture-demo/src/contexts/InspectorContext";
import { getObjectWithPreviewSuspense } from "bvaughn-architecture-demo/src/suspense/ObjectPreviews";
import { filterNonEnumerableProperties, Value as ClientValue } from "bvaughn-architecture-demo/src/utils/protocol";
import { PauseId, Value as ProtocolValue } from "@replayio/protocol";
import { MouseEvent, useContext } from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

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
  protocolValue,
  showClosingTag = true,
  showChildrenIndicator = true,
  showOpeningTag = true,
}: Props) {
  const { inspectHTMLElement } = useContext(InspectorContext);
  const client = useContext(ReplayClientContext);
  const timestampedPointContext = useContext(InspectableTimestampedPointContext);

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
      return <ClientValueValueRenderer clientValue={clientValue} context="nested" />;
    } else {
      return null;
    }
  }

  const childNodes = object.preview?.node?.childNodes ?? [];
  let inlineText: string | null = null;
  if (childNodes.length === 1) {
    const childNode = getObjectWithPreviewSuspense(client, pauseId, childNodes[0]);
    if (childNode.className === "Text") {
      inlineText = childNode.preview?.node?.nodeValue || null;
    }
  }

  const properties = filterNonEnumerableProperties(object.preview?.node?.attributes ?? []);
  const showOverflowMarker = properties.length > MAX_PROPERTIES_TO_PREVIEW;
  const showInlineText = showChildrenIndicator && (inlineText || childNodes.length > 0);

  const viewHtmlElement = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (inspectHTMLElement !== null) {
      if (timestampedPointContext !== null) {
        inspectHTMLElement(
          protocolValue,
          pauseId,
          timestampedPointContext.executionPoint,
          timestampedPointContext.time
        );
      }
    }
  };

  return (
    <>
      {showOpeningTag && (
        <span className={styles.HTMLOpeningTag}>
          <span className={styles.Bracket}>&lt;</span>
          {tagName}
          {properties.slice(0, MAX_PROPERTIES_TO_PREVIEW).map((property, index) => (
            <HTMLAttributeRenderer key={index} pauseId={pauseId} protocolValue={property} />
          ))}
          {showOverflowMarker && <span className={styles.Value}>…</span>}
          <span className={styles.Bracket}>&gt;</span>
        </span>
      )}
      {showInlineText && <span className={styles.HtmlText}>{inlineText || "…"}</span>}
      {showClosingTag && (
        <span className={styles.HTMLClosingTag}>
          <span className={styles.Bracket}>&lt;</span>
          {tagName}
          <span className={styles.Bracket}>&gt;</span>
        </span>
      )}
      {inspectHTMLElement !== null && (
        <button
          className={styles.IconButton}
          onClick={viewHtmlElement}
          title="Click to select the node in the inspector"
        >
          <Icon className={styles.Icon} type="view-html-element" />
        </button>
      )}
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
      <span className={styles.Separator}>=</span>
      <span className={styles.HtmlAttributeValue}>"{protocolValue.value!}"</span>
    </span>
  );
}

import { PauseId, Value as ProtocolValue } from "@replayio/protocol";
import { MouseEvent, useContext } from "react";

import Icon from "replay-next/components/Icon";
import {
  InspectableTimestampedPointContext,
  InspectorContext,
} from "replay-next/src/contexts/InspectorContext";
import { TimelineContext } from "replay-next/src/contexts/TimelineContext";
import { clientValueCache, objectCache } from "replay-next/src/suspense/ObjectPreviews";
import {
  Value as ClientValue,
  filterNonEnumerableProperties,
} from "replay-next/src/utils/protocol";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import ClientValueValueRenderer from "./ClientValueValueRenderer";
import { ObjectPreviewRendererProps } from "./types";
import styles from "./shared.module.css";

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
  const timelineContext = useContext(TimelineContext);

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
    const childNode = objectCache.read(client, pauseId, childNodes[0], "canOverflow");
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
      // we use the current point/time unless this component is wrapped in an
      // InspectableTimestampedPointContext (e.g. if the HTML element to render is
      // from a console message)
      const { executionPoint, time } = timestampedPointContext || timelineContext;
      inspectHTMLElement(protocolValue, pauseId, executionPoint, time);
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
  const client = useContext(ReplayClientContext);
  const clientValue = clientValueCache.read(client, pauseId, protocolValue);

  return (
    <span className={styles.HtmlAttribute}>
      <span className={styles.HtmlAttributeName}>{clientValue.name}</span>
      <span className={styles.Separator}>=</span>
      <span className={styles.HtmlAttributeValue}>"{protocolValue.value!}"</span>
    </span>
  );
}

import { PauseId, Value as ProtocolValue } from "@replayio/protocol";

import { filterNonEnumerableProperties } from "../../../src/utils/protocol";

import useClientValue from "../useClientValue";
import ValueRenderer from "../ValueRenderer";

import styles from "./shared.module.css";
import { ObjectPreviewRendererProps } from "./types";

// Renders a protocol ObjectPreview representing an HTMLElement with a format of:
//   <tag-name attr="value" ...></tag-name>
//
// https://static.replay.io/protocol/tot/Pause/#type-ObjectPreview
export default function HTMLElementRenderer({ object, pauseId }: ObjectPreviewRendererProps) {
  const tagName = (object.preview?.node?.nodeName || "unknown").toLowerCase();
  const properties = filterNonEnumerableProperties(object.preview?.node?.attributes ?? []);

  return (
    <>
      <div className={styles.HTMLOpeningTag}>
        {tagName}
        {properties.map((property, index) => (
          <HTMLAttributeRenderer key={index} pauseId={pauseId} protocolValue={property} />
        ))}
      </div>
      <div className={styles.HTMLClosingTag}>{tagName}</div>
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
  const { name } = useClientValue(protocolValue, pauseId);

  return (
    <span className={styles.HtmlAttribute}>
      <span className={styles.Name}>{name}</span>=
      <ValueRenderer isNested={true} pauseId={pauseId} protocolValue={protocolValue} />
    </span>
  );
}

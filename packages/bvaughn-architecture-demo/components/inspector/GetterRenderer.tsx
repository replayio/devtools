import Expandable from "@bvaughn/components/Expandable";
import Icon from "@bvaughn/components/Icon";
import Loader from "@bvaughn/components/Loader";
import {
  getObjectPropertySuspense,
  getObjectWithPreviewSuspense,
} from "@bvaughn/src/suspense/ObjectPreviews";
import { protocolValueToClientValue, Value as ClientValue } from "@bvaughn/src/utils/protocol";
import {
  Object as ProtocolObject,
  PauseId,
  Property as ProtocolProperty,
  Value as ProtocolValue,
} from "@replayio/protocol";
import classNames from "classnames";
import {
  MouseEvent,
  ReactNode,
  Suspense,
  useContext,
  useRef,
  useState,
  useTransition,
} from "react";
import { ReplayClientContext } from "shared/client/ReplayClientContext";

import HTMLExpandable from "./HTMLExpandable";
import styles from "./GetterRenderer.module.css";
import PropertiesRenderer from "./PropertiesRenderer";
import useClientValue from "./useClientValue";
import ValueRenderer from "./ValueRenderer";

export default function GetterRenderer({
  parentObjectId,
  pauseId,
  protocolProperty,
}: {
  parentObjectId: string;
  pauseId: PauseId;
  protocolProperty: ProtocolProperty;
}) {
  const client = useContext(ReplayClientContext);
  const clientValue = useClientValue(protocolProperty, pauseId);

  const { name } = clientValue;

  const [isExpanded, setIsExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [invokeGetter, setInvokeGetter] = useState(false);

  const getterValue = invokeGetter
    ? getObjectPropertySuspense(client, pauseId, parentObjectId, name!)
    : null;

  const getterClientValueRef = useRef<ClientValue>(null);
  if (getterClientValueRef.current === null && getterValue != null) {
    // @ts-ignore
    getterClientValueRef.current = protocolValueToClientValue(pauseId, getterValue);
  }

  const getterClientValue = getterClientValueRef.current;
  let getterValueWithPreview: ProtocolObject | null = null;
  let showExpandableView = false;
  switch (getterClientValue?.type) {
    case "array":
    case "function":
    case "html-element":
    case "html-text":
    case "map":
    case "object":
    case "regexp":
    case "set": {
      getterValueWithPreview = getObjectWithPreviewSuspense(
        client,
        pauseId,
        getterClientValue.objectId!
      );
      if (getterValueWithPreview == null) {
        throw Error(`Could not find object with ID "${getterClientValue.objectId}"`);
      }

      showExpandableView = true;
    }
  }

  let value: ReactNode = null;
  if (getterValue) {
    if (!isExpanded) {
      value = (
        <ValueRenderer
          context="nested"
          layout="vertical"
          pauseId={pauseId}
          protocolValue={getterValue}
        />
      );
    }
  } else {
    value = (
      <button
        className={styles.InvokeGetterButton}
        data-test-name="InvokeGetterButton"
        disabled={isPending}
        onClick={(event: MouseEvent) => {
          event.stopPropagation();

          startTransition(() => {
            setInvokeGetter(true);
          });
        }}
      >
        <Icon className={styles.InvokeGetterIcon} type="invoke-getter" />
      </button>
    );
  }

  const header = (
    <span
      className={classNames(
        styles.GetterRenderer,
        !showExpandableView ? styles.ToggleAlignmentPadding : null
      )}
      data-test-name="GetterRenderer"
    >
      <span className={styles.Name}>{name}</span>
      <span className={styles.Separator}>: </span>
      {value}
    </span>
  );

  if (showExpandableView) {
    return (
      <Expandable
        children={
          <Suspense fallback={<Loader />}>
            <PropertiesRenderer object={getterValueWithPreview!} pauseId={pauseId} />
          </Suspense>
        }
        header={header}
        onChange={setIsExpanded}
      />
    );
  } else {
    return header;
  }
}

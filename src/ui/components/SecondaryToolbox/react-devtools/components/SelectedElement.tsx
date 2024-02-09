import assert from "assert";
import { ObjectId, PauseId } from "@replayio/protocol";
import { FrontendBridge } from "@replayio/react-devtools-inline";
import { MouseEvent, ReactNode, Suspense, useContext, useDeferredValue } from "react";

import { selectNode } from "devtools/client/inspector/markup/actions/markup";
import Expandable from "replay-next/components/Expandable";
import Icon from "replay-next/components/Icon";
import Loader from "replay-next/components/Loader";
import { InspectorContext } from "replay-next/src/contexts/InspectorContext";
import { objectCache } from "replay-next/src/suspense/ObjectPreviews";
import { truncateMiddle } from "replay-next/src/utils/string";
import { suspendInParallel } from "replay-next/src/utils/suspense";
import { ReplayClientContext } from "shared/client/ReplayClientContext";
import { PreferencesKey } from "shared/user-data/LocalStorage/types";
import useLocalStorageUserData from "shared/user-data/LocalStorage/useLocalStorageUserData";
import { setSelectedPanel } from "ui/actions/layout";
import { Badge } from "ui/components/SecondaryToolbox/react-devtools/components/Badge";
import {
  ContextPropsStateRenderer,
  SectionType,
} from "ui/components/SecondaryToolbox/react-devtools/components/ContextPropsStateRenderer";
import { HooksRenderer } from "ui/components/SecondaryToolbox/react-devtools/components/HooksRenderer";
import { MAX_KEY_LENGTH } from "ui/components/SecondaryToolbox/react-devtools/components/ReactDevToolsListItem";
import { nodesToFiberIdsCache } from "ui/components/SecondaryToolbox/react-devtools/injectReactDevtoolsBackend";
import { ReactDevToolsListData } from "ui/components/SecondaryToolbox/react-devtools/ReactDevToolsListData";
import {
  ReplayWall,
  StoreWithInternals,
} from "ui/components/SecondaryToolbox/react-devtools/ReplayWall";
import { inspectedElementCache } from "ui/components/SecondaryToolbox/react-devtools/suspense/inspectedElementCache";
import {
  InspectedReactElement,
  ReactElement,
} from "ui/components/SecondaryToolbox/react-devtools/types";
import { useAppDispatch } from "ui/setup/hooks";

import styles from "./SelectedElement.module.css";

export function SelectedElement({
  bridge,
  element,
  isDebounceDelayed,
  listData,
  pauseId: defaultPriorityPauseId,
  replayWall,
  store,
}: {
  bridge: FrontendBridge;
  element: ReactElement;
  isDebounceDelayed: boolean;
  listData: ReactDevToolsListData;
  pauseId: PauseId;
  replayWall: ReplayWall;
  store: StoreWithInternals;
}) {
  const replayClient = useContext(ReplayClientContext);
  const { inspectFunctionDefinition } = useContext(InspectorContext);

  const pauseId = useDeferredValue(defaultPriorityPauseId);

  const dispatch = useAppDispatch();

  const { displayName, hocDisplayNames, id, key } = element;

  // Only Suspend at deferred priority
  const deferredElement = useDeferredValue(element);

  const isPending = isDebounceDelayed || element !== deferredElement;

  const [inspectedElement, [, fiberIdsToNodeIds]] = suspendInParallel(
    () => inspectedElementCache.read(replayClient, bridge, store, replayWall, pauseId, id),
    () => nodesToFiberIdsCache.read(replayClient, pauseId!, replayWall)
  );

  if (inspectedElement == null) {
    return (
      <div className={styles.Panel} data-is-pending={isPending || undefined}>
        <div className={styles.TopRow}>
          <div className={styles.ComponentName}>{displayName}</div>
        </div>
        <div className={styles.Error}>The selected component could not be inspected.</div>
      </div>
    );
  }

  const {
    context,
    contextObjectId,
    hooks,
    hooksObjectId,
    owners,
    props,
    propsObjectId,
    state,
    stateObjectId,
    typeObjectId,
  } = inspectedElement;

  const showOwnersList = owners !== null && owners.length > 0;

  const typeObject =
    typeObjectId != null
      ? objectCache.read(replayClient, pauseId, `${typeObjectId}`, "canOverflow")
      : null;
  const sourceLocation = typeObject?.preview?.functionLocation;

  const viewComponentSource = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (inspectFunctionDefinition !== null) {
      inspectFunctionDefinition(sourceLocation!);
    }
  };

  const nativeNodeIds = fiberIdsToNodeIds.get(id) ?? [];

  const viewNativeDomElement = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (nativeNodeIds.length > 0) {
      dispatch(selectNode(nativeNodeIds[0]));
      dispatch(setSelectedPanel("inspector"));
    }
  };

  let hocBadge: ReactNode = null;
  if (hocDisplayNames && hocDisplayNames.length > 0) {
    hocBadge = <Badge children={hocDisplayNames[0]} />;
  }

  let keyBadge: ReactNode = null;
  if (key) {
    keyBadge = <Badge children={truncateMiddle(`${key}`, MAX_KEY_LENGTH)} title={`${key}`} />;
  }

  return (
    <div className={styles.Panel} data-is-pending={isPending || undefined}>
      <div className={styles.TopRow}>
        <div className={styles.ComponentName}>
          {displayName}
          {hocBadge}
          {keyBadge}
        </div>
        {nativeNodeIds.length > 0 && (
          <button
            className={styles.IconButton}
            onClick={viewNativeDomElement}
            title="View DOM element"
          >
            <Icon className={styles.Icon} type="view-html-element" />
          </button>
        )}
        {sourceLocation != null && (
          <button
            className={styles.IconButton}
            onClick={viewComponentSource}
            title="Jump to definition"
            data-test-name="ReactDevTools-JumpToComponentSource"
          >
            <Icon className={styles.Icon} type="view-component-source" />
          </button>
        )}
      </div>
      <div className={styles.Scrollable}>
        {showOwnersList && (
          <Section title="Rendered by">
            {owners.map(owner => {
              const onClick = () => {
                const element = store.getElementByID(owner.id) as ReactElement | null;
                if (element) {
                  listData.selectElement(element);
                }
              };

              return (
                <div className={styles.OwnerName} key={owner.id} onClick={onClick}>
                  {owner.displayName}
                </div>
              );
            })}
          </Section>
        )}
        {props && (
          <InspectableSection
            inspectedElement={inspectedElement}
            objectId={propsObjectId}
            pauseId={pauseId}
            title="Props"
          />
        )}
        {state && (
          <InspectableSection
            inspectedElement={inspectedElement}
            objectId={stateObjectId}
            pauseId={pauseId}
            title="State"
          />
        )}
        {hooks && (
          <InspectableSection
            inspectedElement={inspectedElement}
            objectId={hooksObjectId}
            pauseId={pauseId}
            title="Hooks"
          />
        )}
        {context && (
          <InspectableSection
            inspectedElement={inspectedElement}
            objectId={contextObjectId}
            pauseId={pauseId}
            title="Context"
          />
        )}
      </div>
    </div>
  );
}

export type SectionTitle = "Context" | "Hooks" | "Props" | "Rendered by" | "State";

function InspectableSection({
  inspectedElement,
  objectId,
  pauseId,
  title,
}: {
  inspectedElement: InspectedReactElement;
  objectId: ObjectId | null;
  pauseId: PauseId;
  title: SectionTitle;
}) {
  return (
    <Section key={objectId} title={title}>
      <Suspense fallback={<Loader />}>
        <InspectableSectionInner
          inspectedElement={inspectedElement}
          objectId={objectId}
          pauseId={pauseId}
          title={title}
        />
      </Suspense>
    </Section>
  );
}

function InspectableSectionInner({
  inspectedElement,
  objectId,
  pauseId,
  title,
}: {
  inspectedElement: InspectedReactElement;
  objectId: ObjectId | null;
  pauseId: PauseId;
  title: SectionTitle;
}) {
  const replayClient = useContext(ReplayClientContext);

  if (!objectId) {
    return null;
  }

  const object = objectCache.read(replayClient, pauseId, `${objectId}`, "canOverflow");
  if (!object.preview?.properties) {
    return <div className={styles.Empty}>None</div>;
  }

  if (object.className === "Array") {
    // Render hooks differently; it's an Array but we don't want to show the indices.
    // It also reflects hooks internals that we shouldn't be showing directly.
    return (
      <HooksRenderer
        inspectedElement={inspectedElement}
        objectId={object.objectId as ObjectId}
        pauseId={pauseId}
        replayClient={replayClient}
      />
    );
  } else {
    let sectionType: SectionType | null = null;
    switch (title) {
      case "Context":
        sectionType = "context";
        break;
      case "Props":
        sectionType = "props";
        break;
      case "State":
        sectionType = "state";
        break;
    }
    assert(sectionType);

    return (
      <ContextPropsStateRenderer
        inspectedElement={inspectedElement}
        key="properties"
        objectId={object.objectId as ObjectId}
        pauseId={pauseId}
        replayClient={replayClient}
        sectionType={sectionType}
      />
    );
  }
}

function Section({ children, title }: { children: ReactNode; title: SectionTitle }) {
  let key: PreferencesKey | null = null;
  switch (title) {
    case "Context":
      key = "reactDevToolsContextExpanded";
      break;
    case "Hooks":
      key = "reactDevToolsHooksExpanded";
      break;
    case "Props":
      key = "reactDevToolsPropsExpanded";
      break;
    case "Rendered by":
      key = "reactDevToolsRenderedByExpanded";
      break;
    case "State":
      key = "reactDevToolsStateExpanded";
      break;
  }

  assert(key);

  const [expanded, setExpanded] = useLocalStorageUserData(key);

  return (
    <div className={styles.Section} data-test-id={`ReactDevTools-Section-${title}`}>
      <Expandable
        children={children}
        childrenClassName={styles.SectionChildren}
        defaultOpen={expanded}
        header={title}
        headerClassName={styles.SectionHeader}
        onChange={setExpanded}
      />
    </div>
  );
}

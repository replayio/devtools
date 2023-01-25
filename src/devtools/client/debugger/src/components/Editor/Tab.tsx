import { SourceId } from "@replayio/protocol";
import classnames from "classnames";
import { DragEventHandler, MouseEvent } from "react";

import { selectSource } from "devtools/client/debugger/src/actions/sources";
import { closeTab } from "devtools/client/debugger/src/actions/tabs";
import useTabContextMenu from "devtools/client/debugger/src/components/Editor/useTabContextMenu";
import { Redacted } from "ui/components/Redacted";
import { SourceDetails, getHasSiblingOfSameName, getSelectedSource } from "ui/reducers/sources";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { trackEvent } from "ui/utils/telemetry";

import { getActiveSearch, getContext } from "../../selectors";
import {
  getFileURL,
  getSourceQueryString,
  getTruncatedFileName,
  isPretty,
} from "../../utils/source";
import { CloseButton } from "../shared/Button";
import SourceIcon from "../shared/SourceIcon";

export default function Tab({
  onDragEnd,
  onDragOver,
  onDragStart,
  setTabRef,
  source,
}: {
  onDragEnd: DragEventHandler<HTMLDivElement>;
  onDragOver: DragEventHandler<HTMLDivElement>;
  onDragStart: DragEventHandler<HTMLDivElement>;
  setTabRef: (sourceId: SourceId, ref: HTMLDivElement | null) => void;
  source: SourceDetails;
}) {
  const dispatch = useAppDispatch();

  const cx = useAppSelector(getContext);
  const selectedSource = useAppSelector(getSelectedSource);
  const activeSearch = useAppSelector(getActiveSearch);
  const hasSiblingOfSameName = useAppSelector(state => getHasSiblingOfSameName(state, source));

  // @ts-expect-error activeSearch possible values mismatch
  const isSourceSearchEnabled = activeSearch === "source";
  const sourceId = source.id;
  const active = selectedSource && sourceId == selectedSource.id && !isSourceSearchEnabled;
  const isPrettyCode = isPretty(source);

  function onClickClose(event: MouseEvent) {
    event.stopPropagation();
    trackEvent("tabs.close");
    dispatch(closeTab(cx, source));
  }

  function handleTabClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    trackEvent("tabs.select");

    dispatch(selectSource(cx, sourceId));
  }

  const className = classnames("source-tab", {
    active,
    pretty: isPrettyCode,
  });

  const query = hasSiblingOfSameName ? getSourceQueryString(source) : "";

  const { contextMenu, onContextMenu } = useTabContextMenu({
    source,
  });

  const url = getFileURL(source, false);
  const fileName = url.split("/").pop();

  return (
    <>
      <Redacted
        draggable
        onDragOver={onDragOver}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        className={className}
        data-status={active ? "active" : undefined}
        data-test-name={`Source-${fileName}`}
        data-test-sourceid={source.id}
        key={sourceId}
        onClick={handleTabClick}
        onContextMenu={onContextMenu}
        // Accommodate middle click to close tab
        onMouseUp={e => e.button === 1 && closeTab(cx, source)}
        refToForward={elementRef => setTabRef(sourceId, elementRef as HTMLDivElement | null)}
        title={getFileURL(source, false)}
      >
        <SourceIcon
          source={source}
          shouldHide={(icon: string) => ["file", "javascript"].includes(icon)}
        />
        <div className="filename">{getTruncatedFileName(source, query)}</div>
        <CloseButton buttonClass="" handleClick={onClickClose} tooltip={"Close tab"} />
      </Redacted>
      {contextMenu}
    </>
  );
}

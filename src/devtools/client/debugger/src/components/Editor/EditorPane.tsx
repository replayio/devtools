import classNames from "classnames";
import { useLayoutEffect, useRef } from "react";

import { IndeterminateProgressBar } from "replay-next/components/IndeterminateLoader";
import { userData } from "shared/user-data/GraphQL/UserData";
import { Redacted } from "ui/components/Redacted";
import { getToolboxLayout } from "ui/reducers/layout";
import { getSelectedSourceId, getSourcesUserActionPending } from "ui/reducers/sources";
import { useAppSelector } from "ui/setup/hooks";
import useWidthObserver from "ui/utils/useWidthObserver";

import WelcomeBox from "../WelcomeBox";
import EditorFooter from "./Footer";
import NewSourceAdapter from "./NewSourceAdapter";
import EditorTabs from "./Tabs";

export const EditorPane = () => {
  const toolboxLayout = useAppSelector(getToolboxLayout);
  const selectedSourceId = useAppSelector(getSelectedSourceId);
  const sourcesUserActionPending = useAppSelector(getSourcesUserActionPending);
  const panelEl = useRef(null);
  const enableLargeText = userData.get("global_enableLargeText");

  const nodeWidth = useWidthObserver(panelEl);

  return (
    <div
      className={classNames("editor-pane overflow-hidden ", {
        narrow: nodeWidth && nodeWidth < 240,
        "rounded-lg": toolboxLayout == "ide",
      })}
      ref={panelEl}
    >
      <div className="editor-container relative">
        {sourcesUserActionPending ? <IndeterminateProgressBar /> : null}
        <EditorTabs />
        {selectedSourceId ? (
          <Redacted className="h-full">
            <NewSourceAdapter />
          </Redacted>
        ) : (
          <WelcomeBox />
        )}
        {selectedSourceId && <EditorFooter />}
      </div>
    </div>
  );
};

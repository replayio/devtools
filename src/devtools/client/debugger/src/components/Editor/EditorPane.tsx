import classNames from "classnames";
import { useLayoutEffect, useRef } from "react";

import { IndeterminateProgressBar } from "replay-next/components/IndeterminateLoader";
import { preferences } from "shared/preferences/Preferences";
import { Redacted } from "ui/components/Redacted";
import { getToolboxLayout } from "ui/reducers/layout";
import { getSelectedSource, getSourcesUserActionPending } from "ui/reducers/sources";
import { useAppSelector } from "ui/setup/hooks";
import useWidthObserver from "ui/utils/useWidthObserver";

import WelcomeBox from "../WelcomeBox";
import EditorFooter from "./Footer";
import NewSourceAdapter from "./NewSourceAdapter";
import EditorTabs from "./Tabs";

export const EditorPane = () => {
  const toolboxLayout = useAppSelector(getToolboxLayout);
  const selectedSource = useAppSelector(getSelectedSource);
  const sourcesUserActionPending = useAppSelector(getSourcesUserActionPending);
  const panelEl = useRef(null);
  const enableLargeText = preferences.get("enableLargeText");

  const nodeWidth = useWidthObserver(panelEl);

  // ExperimentFeature: LargeText Logic
  useLayoutEffect(() => {
    const root = document.querySelector<HTMLElement>(":root")!;
    if (enableLargeText) {
      root.style.setProperty("--theme-code-font-size", "14px");
    } else {
      root.style.setProperty("--theme-code-font-size", "11px");
    }
  }, [enableLargeText]);

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
        {selectedSource ? (
          <Redacted className="h-full">
            <NewSourceAdapter />
          </Redacted>
        ) : (
          <WelcomeBox />
        )}
        {selectedSource && <EditorFooter />}
      </div>
    </div>
  );
};

import classNames from "classnames";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setUnexpectedError } from "ui/actions/session";
import { ReplayUpdatedError } from "ui/components/ErrorBoundary";
import { Redacted } from "ui/components/Redacted";
import { getToolboxLayout } from "ui/reducers/layout";
import useWidthObserver from "ui/utils/useWidthObserver";

import { getSelectedSource } from "../../reducers/sources";
import { waitForEditor } from "../../utils/editor/create-editor";
import WelcomeBox from "../WelcomeBox";

import EditorFooter from "./Footer";
import EditorTabs from "./Tabs";

import Editor from "./index";

export const EditorPane = () => {
  const [loadingEditor, setLoadingEditor] = useState(true);
  const dispatch = useDispatch();
  const toolboxLayout = useSelector(getToolboxLayout);
  const selectedSource = useSelector(getSelectedSource);
  const panelEl = useRef(null);

  const nodeWidth = useWidthObserver(panelEl);

  useEffect(() => {
    (async () => {
      try {
        await waitForEditor();
        setLoadingEditor(false);
      } catch {
        dispatch(setUnexpectedError(ReplayUpdatedError));
      }
    })();
  }, [dispatch]);

  if (loadingEditor) {
    return null;
  }

  return (
    <div
      className={classNames("editor-pane overflow-hidden ", {
        narrow: nodeWidth && nodeWidth < 240,
        "rounded-lg": toolboxLayout == "ide",
      })}
      ref={panelEl}
    >
      <div className="editor-container relative">
        <EditorTabs />
        {selectedSource ? (
          <Redacted>
            <Editor />
          </Redacted>
        ) : (
          <WelcomeBox />
        )}
        {selectedSource && <EditorFooter />}
      </div>
    </div>
  );
};

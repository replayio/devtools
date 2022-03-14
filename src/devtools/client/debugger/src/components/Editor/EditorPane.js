import React, { useEffect, useRef } from "react";
import classNames from "classnames";
import { useSelector } from "react-redux";
import Editor from "./index";
import EditorTabs from "./Tabs";
import EditorFooter from "./Footer";

import WelcomeBox from "../WelcomeBox";
import { getSelectedSource, getOrientation } from "../../selectors";

import { Redacted } from "ui/components/Redacted";
import useWidthObserver from "ui/utils/useWidthObserver";

export const EditorPane = ({ toolboxLayout }) => {
  const selectedSource = useSelector(getSelectedSource);
  const orientation = useSelector(getOrientation);
  const panelEl = useRef(null);

  const nodeWidth = useWidthObserver(panelEl);

  const horizontal = orientation === "horizontal";
  return (
    <div
      className={classNames("editor-pane overflow-hidden ", {
        narrow: nodeWidth && nodeWidth < 240,
        "rounded-lg": toolboxLayout == "ide",
      })}
      ref={panelEl}
    >
      <div className="editor-container relative">
        {<EditorTabs horizontal={horizontal} />}
        {selectedSource ? (
          <Redacted>
            <Editor />
          </Redacted>
        ) : (
          <WelcomeBox />
        )}
        {selectedSource && <EditorFooter horizontal={horizontal} />}
      </div>
    </div>
  );
};

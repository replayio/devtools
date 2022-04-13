/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

import React, { useEffect, useState } from "react";
import classnames from "classnames";
import PanelEditor from "./PanelEditor";
import BreakpointNavigation from "devtools/client/debugger/src/components/SecondaryPanes/Breakpoints/BreakpointNavigation";
import Widget from "./Widget";
import { useDispatch, useSelector } from "react-redux";
import { inBreakpointPanel } from "devtools/client/debugger/src/utils/editor";
import PanelSummary from "./PanelSummary";
import FirstEditNag from "./FirstEditNag";
import hooks from "ui/hooks";
import { Nag } from "ui/hooks/users";
import { prefs } from "ui/utils/prefs";
import { Breakpoint, getHitCountsForSelectedSource } from "devtools/client/debugger/src/selectors";
import { getAnalysisPointsForBreakpoint } from "ui/reducers/app";
import { UIState } from "ui/state";
import { clearHoveredItem, setHoveredItem } from "ui/actions/timeline";
import { Editor } from "codemirror";
import { AnalysisError, AnalysisPayload } from "ui/state/app";

export type Input = "condition" | "logValue";
type CodeMirror = any;

function getPanelWidth(editor: Editor) {
  // The indent value is an adjustment for the distance from the gutter's left edge
  // to the panel's left edge, which is approximately ~60.
  const panelIndent = 60;
  return editor.getScrollInfo().clientWidth - panelIndent;
}

export enum PanelErrors {
  TooManyPoints = "too-many-points",
  MaxHits = "max-hits",
  Default = "default",
}

const getPanelError = (hits: number | null, analysisPoints: AnalysisPayload | null) => {
  if (analysisPoints?.error === AnalysisError.TooManyPoints) {
    return PanelErrors.TooManyPoints;
  } else if (analysisPoints?.error === AnalysisError.Default) {
    return PanelErrors.Default;
  } else if (hits && hits > prefs.maxHitsDisplayed) {
    return PanelErrors.MaxHits;
  }

  return null;
};

const useGetHitsForPanel = (breakpoint: Breakpoint) => {
  const analysisPoints = useSelector((state: UIState) =>
    getAnalysisPointsForBreakpoint(state, breakpoint)
  );
  const hitCounts = useSelector(getHitCountsForSelectedSource);
  const hitCountFromSources = hitCounts?.find(
    hitCount => hitCount.location.line === breakpoint.location.line
  );

  const loading = analysisPoints === null || !hitCountFromSources;
  const hits = analysisPoints?.data.length ?? hitCountFromSources?.hits ?? null;
  const error = getPanelError(hits, analysisPoints);

  return { hits, error, loading: hits === null && loading };
};

export default function Panel({
  breakpoint,
  editor,
  insertAt,
}: {
  breakpoint: Breakpoint;
  editor: CodeMirror;
  insertAt: number;
}) {
  const dispatch = useDispatch();
  const [editing, setEditing] = useState(false);
  const [showCondition, setShowCondition] = useState(Boolean(breakpoint.options.condition)); // nosemgrep
  const [width, setWidth] = useState(getPanelWidth(editor.editor)); // nosemgrep
  const [inputToFocus, setInputToFocus] = useState<Input>("logValue");
  const dismissNag = hooks.useDismissNag();
  const { error, hits, loading } = useGetHitsForPanel(breakpoint);

  useEffect(() => {
    editor.editor.on("refresh", updateWidth);
    dismissNag(Nag.FIRST_BREAKPOINT_ADD);

    return () => {
      editor.editor.off("refresh", updateWidth);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateWidth = () => setWidth(getPanelWidth(editor));

  const toggleEditingOn = () => {
    dismissNag(Nag.FIRST_BREAKPOINT_EDIT);
    setEditing(true);
  };
  const toggleEditingOff = () => {
    dismissNag(Nag.FIRST_BREAKPOINT_SAVE);
    setEditing(false);
  };

  const onMouseEnter = () => {
    const hoveredItem = {
      location: breakpoint.location,
      target: "widget",
    } as const;

    dispatch(setHoveredItem(hoveredItem));
  };
  const onMouseLeave = (e: React.MouseEvent) => {
    if (!inBreakpointPanel(e)) {
      dispatch(clearHoveredItem());
    }
  };

  return (
    <HitsContext.Provider value={{ hits, loading, error }}>
      <Widget location={breakpoint.location} editor={editor} insertAt={insertAt}>
        <div
          className="breakpoint-panel-wrapper mx-3 my-2"
          style={{ width: `${width}px` }}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          <FirstEditNag editing={editing} />
          <div className={classnames("breakpoint-panel", { editing })}>
            {editing ? (
              <PanelEditor
                breakpoint={breakpoint}
                toggleEditingOff={toggleEditingOff}
                inputToFocus={inputToFocus}
                showCondition={showCondition}
                setShowCondition={setShowCondition}
                dismissNag={dismissNag}
              />
            ) : (
              <PanelSummary
                breakpoint={breakpoint}
                setInputToFocus={setInputToFocus}
                toggleEditingOn={toggleEditingOn}
              />
            )}
            <BreakpointNavigation
              {...{ breakpoint, editing, showCondition, setShowCondition, hits }}
            />
          </div>
        </div>
      </Widget>
    </HitsContext.Provider>
  );
}

const defaultHitsContext: { hits: number | null; loading: boolean; error: string | null } = {
  hits: null,
  loading: false,
  error: null,
};
export const HitsContext = React.createContext(defaultHitsContext);

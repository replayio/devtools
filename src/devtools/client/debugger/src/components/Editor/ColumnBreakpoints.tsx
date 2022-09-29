/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

//

import React, { Component, useEffect } from "react";
import ColumnBreakpoint from "./ColumnBreakpoint";

import { getVisibleColumnBreakpoints, getContext } from "../../selectors";
import { getSelectedSource } from "ui/reducers/sources";
import { connect, ConnectedProps } from "react-redux";
import type { UIState } from "ui/state";
import { useAppSelector } from "ui/setup/hooks";
import { getLocationKey } from "../../utils/breakpoint";
import type { SourceEditor } from "devtools/client/debugger/src/utils/editor/source-editor";
import { useFeature, useStringPref } from "ui/hooks/settings";

// eslint-disable-next-line max-len

const mapStateToProps = (state: UIState) => ({
  cx: getContext(state),
  selectedSource: getSelectedSource(state),
  columnBreakpoints: getVisibleColumnBreakpoints(state),
});

const connector = connect(mapStateToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

type $FixTypeLater = any;
interface CBProps {
  editor: SourceEditor;
}

function ColumnBreakpoints2({ editor }: CBProps) {
  const cx = useAppSelector(getContext);
  const selectedSource = useAppSelector(getSelectedSource);
  const columnBreakpoints = useAppSelector(getVisibleColumnBreakpoints);
  const { value: hitCountsMode } = useStringPref("hitCounts");

  useEffect(() => {
    const updateWidth = () => {
      const editorElement = editor.editor.getWrapperElement();
      const gutter = editor.editor.getGutterElement();

      const gutterWidth = gutter.getBoundingClientRect().width;
      const scrollWidth = editorElement.getBoundingClientRect().width;

      // Magic formula to determine scrollbar width: https://stackoverflow.com/a/60008044/62937
      let scrollbarWidth = window.innerWidth - document.body.clientWidth;

      // Fill the _visible_ width of the editor, minus scrollbar, minus a small bit of padding
      const newWidth = scrollWidth - gutterWidth - scrollbarWidth - 10;

      let root = document.documentElement;
      root.style.setProperty("--print-statement-max-width", newWidth + "px");
    };

    editor.editor.on("refresh", updateWidth);

    updateWidth();

    return () => {
      editor.editor.off("refresh", updateWidth);
    };
  }, [editor, hitCountsMode]);

  if (!selectedSource || columnBreakpoints.length === 0) {
    return null;
  }

  const breakpoints = columnBreakpoints.map((breakpoint, i) => (
    <ColumnBreakpoint
      cx={cx}
      key={getLocationKey(breakpoint.location)}
      columnBreakpoint={breakpoint}
      editor={editor}
      source={selectedSource}
      insertAt={i}
    />
  ));

  return <div>{breakpoints}</div>;
}

export default React.memo(ColumnBreakpoints2);

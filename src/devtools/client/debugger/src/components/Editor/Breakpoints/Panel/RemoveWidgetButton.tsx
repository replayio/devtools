import ReactDOM from "react-dom";
import React, { useContext } from "react";
import { connect, ConnectedProps } from "react-redux";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";
import classNames from "classnames";
import { removeBreakpoint } from "devtools/client/debugger/src/actions/breakpoints/modify";

type RemoveWidgetButtonProps = PropsFromRedux & { panelNode: HTMLDivElement; breakpoint: any };

const getLineNumberNode = (target: HTMLDivElement) => {
  debugger;
  return target
    .closest(".CodeMirror-linewidget")!
    .parentElement!.querySelector(".CodeMirror-linenumber");
};

function RemoveWidgetButton({
  panelNode,
  cx,
  breakpoint,
  removeBreakpoint,
}: RemoveWidgetButtonProps) {
  const onClick = () => {
    return removeBreakpoint(cx, breakpoint);
  };

  const lineNumberNode = getLineNumberNode(panelNode)!;
  const { height, width } = lineNumberNode.getBoundingClientRect();

  const style = {
    top: `${(1 / 2) * height}px`,
    left: `${width}px`,
  };

  console.log(">>>123", lineNumberNode.closest(".new-breakpoint"), panelNode);
  console.log(
    ">>>456",
    panelNode.closest(".new-breakpoint")!,
    panelNode.closest(".new-breakpoint")!.querySelector(".CodeMirror-gutter-wrapper")!
  );

  return ReactDOM.createPortal(
    <button
      className={classNames(
        "bg-primaryAccent",
        "flex p-px absolute z-50 rounded-md text-white transform -translate-y-1/2 leading-3 duration-150 hover:scale-125 ml-1"
      )}
      style={style}
      onClick={onClick}
    >
      <MaterialIcon>{"remove"}</MaterialIcon>
    </button>,
    panelNode.closest(".new-breakpoint")!.querySelector(".CodeMirror-gutter-wrapper")!
  );
}

const connector = connect(
  (state: UIState) => ({
    cx: selectors.getThreadContext(state),
  }),
  {
    removeBreakpoint: removeBreakpoint,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(RemoveWidgetButton);

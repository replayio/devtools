import { SmartTraceStackFrame } from "devtools/client/shared/components/SmartTrace";
import SmartTrace from "devtools/client/webconsole/utils/connected-smart-trace";
import { ObjectInspector, ValueItem, REPS, MODE } from "devtools/packages/devtools-reps";
import { ValueFront } from "protocol/thread";
import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { actions } from "ui/actions";
import { getCurrentPoint } from "ui/reducers/app";
import { UIState } from "ui/state";

interface PropsFromParent {
  value: ValueFront;
  useQuotes?: boolean;
  transformEmptyString?: boolean;
  escapeWhitespace?: boolean;
  style?: React.CSSProperties;
}
type ObjectInspectorProps = PropsFromRedux & PropsFromParent;

function OI(props: ObjectInspectorProps) {
  const { value, isInCurrentPause } = props;
  const path = value.id();
  const roots = [new ValueItem({ contents: value, isInCurrentPause, path })];

  return (
    <ObjectInspector
      {...{
        ...props,
        onInspectIconClick: isInCurrentPause ? props.onInspectIconClick : undefined,
      }}
      autoExpandDepth={0}
      mode={MODE.LONG}
      defaultRep={REPS.Grip}
      roots={roots}
      renderStacktrace={renderStacktrace}
    />
  );
}

function onInspectIconClick(object: ValueFront, e: React.MouseEvent) {
  e.stopPropagation();
  return actions.openNodeInInspector(object);
}

function renderStacktrace(stacktrace: SmartTraceStackFrame[]) {
  return <SmartTrace key="stacktrace" stacktrace={stacktrace} mapSources={true} />;
}

const connector = connect(
  (state: UIState, { value }: PropsFromParent) => ({
    isInCurrentPause: value.getPause()?.point === getCurrentPoint(state),
  }),
  {
    onDOMNodeMouseOut: actions.unHighlightDomElement,
    onDOMNodeMouseOver: actions.highlightDomElement,
    onInspectIconClick,
    onViewSourceInDebugger: actions.onViewSourceInDebugger,
    openLink: actions.openLink,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(OI);

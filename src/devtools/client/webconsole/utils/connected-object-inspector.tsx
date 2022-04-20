import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { ValueFront } from "protocol/thread";
import { SmartTraceStackFrame } from "devtools/client/shared/components/SmartTrace";
import { actions } from "ui/actions";
import { ObjectInspector, ValueItem, REPS, MODE } from "devtools/packages/devtools-reps";
import SmartTrace from "devtools/client/webconsole/utils/connected-smart-trace";
import { UIState } from "ui/state";
import { getCurrentPoint } from "ui/reducers/app";

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
  const roots = () => [new ValueItem({ contents: value, isInCurrentPause, path })];

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
    onViewSourceInDebugger: actions.onViewSourceInDebugger,
    openLink: actions.openLink,
    onDOMNodeMouseOver: actions.highlightDomElement,
    onDOMNodeMouseOut: actions.unHighlightDomElement,
    onInspectIconClick,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(OI);

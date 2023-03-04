import { TimeStampedPoint } from "@replayio/protocol";

import Button from "./Button";

export default function ExplainButton(props: {
  disabled: boolean;
  hitPoints: TimeStampedPoint[];
  onClick: () => void;
}) {
  return (
    <Button loading={props.disabled} iconType={props.disabled ? "spinner" : "ai"} {...props}>
      Explain
    </Button>
  );
}

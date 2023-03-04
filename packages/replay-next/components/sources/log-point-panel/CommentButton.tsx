import { TimeStampedPoint } from "@replayio/protocol";

import Button from "./Button";

export default function CommentButton(props: {
  disabled: boolean;
  hitPoints: TimeStampedPoint[];
  onClick: () => void;
}) {
  return (
    <Button iconType="comment" {...props}>
      Add a Comment
    </Button>
  );
}

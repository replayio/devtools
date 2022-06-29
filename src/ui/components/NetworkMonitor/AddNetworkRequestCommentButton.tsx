import { useAppDispatch } from "ui/setup/hooks";
import { createNetworkRequestComment } from "ui/actions/comments";
import { useGetRecordingId } from "ui/hooks/recordings";
import { AddCommentButton } from "../../../../packages/components";
import { RequestSummary } from "./utils";
import useAuth0 from "ui/utils/useAuth0";

export default function AddNetworkRequestCommentButton({
  request,
  className,
}: {
  request: RequestSummary;
  className?: string;
}) {
  const dispatch = useAppDispatch();
  const recordingId = useGetRecordingId();
  const { isAuthenticated } = useAuth0();

  const addRequestComment = () => {
    dispatch(createNetworkRequestComment(request, recordingId));
  };

  // Un-authenticated users can't comment on Replays.
  if (!isAuthenticated) {
    return null;
  }

  return <AddCommentButton className={className} onClick={addRequestComment} />;
}

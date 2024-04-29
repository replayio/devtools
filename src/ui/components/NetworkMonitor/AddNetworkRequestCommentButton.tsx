import { AddCommentButton } from "design";
import { createNetworkRequestComment } from "ui/actions/comments";
import { useGetRecordingId } from "ui/hooks/recordings";
import { getAccessToken } from "ui/reducers/app";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";

import { RequestSummary } from "./utils";

export default function AddNetworkRequestCommentButton({
  request,
  className,
}: {
  request: RequestSummary;
  className?: string;
}) {
  const dispatch = useAppDispatch();
  const recordingId = useGetRecordingId();
  const isAuthenticated = !!useAppSelector(getAccessToken);

  const addRequestComment = () => {
    dispatch(createNetworkRequestComment(request, recordingId));
  };

  // Un-authenticated users can't comment on Replays.
  if (!isAuthenticated) {
    return null;
  }

  return <AddCommentButton className={className} onClick={addRequestComment} />;
}

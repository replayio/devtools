import { useAppDispatch } from "ui/setup/hooks";
import { createNetworkRequestComment } from "ui/actions/comments";
import { useGetRecordingId } from "ui/hooks/recordings";
import { useFeature } from "ui/hooks/settings";
import { AddCommentButton } from "components/AddCommentButton";
import { RequestSummary } from "./utils";

export default function AddNetworkRequestCommentButton({ request }: { request: RequestSummary }) {
  const { value: networkRequestComments } = useFeature("networkRequestComments");
  const dispatch = useAppDispatch();
  const recordingId = useGetRecordingId();

  const addRequestComment = () => {
    dispatch(createNetworkRequestComment(request, recordingId));
  };

  if (!networkRequestComments) {
    return null;
  }

  return <AddCommentButton onClick={addRequestComment} />;
}

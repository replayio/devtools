import { useDispatch } from "react-redux";
import { createNetworkRequestComment } from "ui/actions/comments";
import { useGetRecordingId } from "ui/hooks/recordings";
import { useFeature } from "ui/hooks/settings";
import { useGetUserId } from "ui/hooks/users";
import useAuth0 from "ui/utils/useAuth0";
import { RequestSummary } from "./utils";

// adasds
export default function AddNetworkRequestCommentButton({ request }: { request: RequestSummary }) {
  const { value: networkRequestComments } = useFeature("networkRequestComments");
  const dispatch = useDispatch();
  const { user } = useAuth0();
  const { userId } = useGetUserId();
  const recordingId = useGetRecordingId();

  const addRequestComment = () => {
    dispatch(createNetworkRequestComment(request, { ...user, id: userId }, recordingId));
  };

  if (!networkRequestComments) {
    return null;
  }

  return (
    <button
      className="inline-flex items-center space-x-2 rounded-md border border-transparent bg-primaryAccent px-1 text-xs font-medium leading-4 text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primaryAccent focus:ring-offset-2"
      onClick={addRequestComment}
    >
      <div className="material-icons add-comment-icon text-base text-white">add_comment</div>
      <div>Add a comment</div>
    </button>
  );
}

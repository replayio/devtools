import { useDispatch } from "react-redux";
import { createNetworkRequestComment } from "ui/actions/comments";
import { useGetRecordingId } from "ui/hooks/recordings";
import { useFeature } from "ui/hooks/settings";
import { useGetUserId } from "ui/hooks/users";
import useAuth0 from "ui/utils/useAuth0";
import { RequestSummary } from "./utils";

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
      className="bg-primaryAccent space-x-2 inline-flex items-center rounded-md border border-transparent px-1 text-xs font-medium leading-4 text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primaryAccent focus:ring-offset-2"
      onClick={addRequestComment}
    >
      <div className="material-icons add-comment-icon text-base text-white">add_comment</div>
      <div>Add a comment</div>
    </button>
  );
}

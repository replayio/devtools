import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { setModal } from "ui/actions/app";
import { useGetRecordingId } from "ui/hooks/recordings";

export default function Share() {
  const recordingId = useGetRecordingId();
  const router = useRouter();
  const dispatch = useDispatch();

  router.replace({ pathname: "/recording/[id]", query: router.query });
  dispatch(setModal("sharing", { recordingId }));
}

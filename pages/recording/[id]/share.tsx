import { useRouter } from "next/router";
import { FC } from "react";
import { useDispatch } from "react-redux";
import { setModal } from "ui/actions/app";
import { useGetRecordingId } from "ui/hooks/recordings";

const Share: FC = () => {
  const recordingId = useGetRecordingId();
  const router = useRouter();
  const dispatch = useDispatch();

  router.replace({ pathname: "/recording/[id]", query: router.query });
  dispatch(setModal("sharing", { recordingId }));

  return null;
};

export default Share;

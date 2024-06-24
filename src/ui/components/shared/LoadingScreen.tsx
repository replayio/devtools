import dynamic from "next/dynamic";
import { ReactNode, useEffect, useState } from "react";

import { useHighRiskSettingCount } from "shared/user-data/GraphQL/useHighRiskSettingCount";
import { RecordingDocumentTitle } from "ui/components/RecordingDocumentTitle";
import { getAwaitingSourcemaps, getUploading } from "ui/reducers/app";
import { useAppSelector } from "ui/setup/hooks";

import { DefaultViewportWrapper } from "./Viewport";
import styles from "./LoadingScreen.module.css";

export default function LoadingScreen({ message }: { message: ReactNode }) {
  const isAwaitingSourceMaps = useAppSelector(getAwaitingSourcemaps);
  const uploadingInfo = useAppSelector(getUploading);

  const showHighRiskWarning = useHighRiskSettingCount() > 0;

  const [colorIndex, setColorIndex] = useState(0);
  const color = colorOptions[colorIndex % colorOptions.length];

  useEffect(() => {
    const timeoutId = setInterval(() => {
      setColorIndex(prevIndex => prevIndex + 1);
    }, 5_000);

    return () => clearInterval(timeoutId);
  }, []);

  let content: ReactNode;
  if (isAwaitingSourceMaps || uploadingInfo) {
    content = (
      <span>
        Uploading {Math.round(uploadingInfo?.amount ? Number(uploadingInfo.amount) : 0)}Mb
      </span>
    );
  } else {
    content = message;
  }

  return (
    <>
      <RecordingDocumentTitle />
      <DefaultViewportWrapper className={styles.LoadingScreen}>
        <div className={styles.Spacer}></div>
        <div className={styles.Hoverboard}>
          <Hoverboard color={color} />
        </div>
        {content}
        <div className={styles.Spacer}></div>
        {showHighRiskWarning && (
          <div className={styles.HighRiskWarning}>
            You have advanced settings enabled that may negatively affect performance
          </div>
        )}
      </DefaultViewportWrapper>
    </>
  );
}

const colorOptions = ["blue", "green", "red"] as const;

const Hoverboard = dynamic(() => import("./Hoverboard"), {
  ssr: false,
  loading: () => <div />,
});

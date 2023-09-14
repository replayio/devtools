import dynamic from "next/dynamic";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { ConnectedProps, connect } from "react-redux";

import { useHighRiskSettingCount } from "shared/user-data/GraphQL/useHighRiskSettingCount";
import { RecordingDocumentTitle } from "ui/components/RecordingDocumentTitle";
import { getAwaitingSourcemaps, getUploading } from "ui/reducers/app";
import { UIState } from "ui/state";

import { DefaultViewportWrapper } from "./Viewport";
import styles from "./LoadingScreen.module.css";

const colorOptions: Array<"blue" | "green" | "red"> = ["blue", "green", "red"];

const Hoverboard = dynamic(() => import("./Hoverboard"), {
  ssr: false,
  loading: () => <div />,
});

export function LoadingScreenTemplate({ children }: { children?: ReactNode }) {
  const [hoverboardColor, setHoverboardColor] = useState(colorOptions[2]);

  const changeHoverboardColor = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * colorOptions.length);
    setHoverboardColor(colorOptions[randomIndex]);
  }, []);

  useEffect(() => {
    const timeoutId = setInterval(changeHoverboardColor, 5000);
    return () => clearInterval(timeoutId);
  }, [changeHoverboardColor]);

  return (
    <div className={styles.loadingScreenWrapper}>
      <DefaultViewportWrapper>
        <div className={styles.loadingScreenWrapper}>
          <div className="flex flex-col items-center space-y-2">
            <div className={styles.hoverboardWrapper} onClick={changeHoverboardColor}>
              <Hoverboard color={hoverboardColor} />
            </div>
            {children}
          </div>
        </div>
      </DefaultViewportWrapper>
    </div>
  );
}

function LoadingScreen({
  uploading,
  awaitingSourcemaps,
  message,
  secondaryMessage,
}: PropsFromRedux & { message: string; secondaryMessage?: string }) {
  const waitingForMessage =
    awaitingSourcemaps || uploading ? (
      <span>Uploading {Math.round(uploading?.amount ? Number(uploading.amount) : 0)}Mb</span>
    ) : (
      <>
        <div className={styles.message} dangerouslySetInnerHTML={{ __html: message }} />
        {secondaryMessage && <div className={styles.secondaryMessage}>{secondaryMessage}</div>}
      </>
    );

  const showHighRiskWarning = useHighRiskSettingCount() > 0;

  return (
    <LoadingScreenTemplate>
      <RecordingDocumentTitle />
      <div className={styles.messageWrapper}>{waitingForMessage}</div>
      {showHighRiskWarning && (
        <div className={styles.HighRiskWarning}>
          You have advanced settings enabled that may negatively affect performance
        </div>
      )}
    </LoadingScreenTemplate>
  );
}

const connector = connect((state: UIState) => ({
  uploading: getUploading(state),
  awaitingSourcemaps: getAwaitingSourcemaps(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(LoadingScreen);

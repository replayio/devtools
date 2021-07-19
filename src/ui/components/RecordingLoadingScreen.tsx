import React, { useState, useRef, useEffect } from "react";
import { connect, ConnectedProps } from "react-redux";
import Prompt from "./shared/Prompt";
import {
  screenshotCache,
  nextPaintEvent,
  getClosestPaintPoint,
  TimeStampedPointWithPaintHash,
} from "protocol/graphics";
import { selectors } from "../reducers";
import { UIState } from "ui/state";
import { ScreenShot } from "@recordreplay/protocol";

async function getScreenshotSafely(paintPoint: TimeStampedPointWithPaintHash | null) {
  if (!paintPoint) {
    return null;
  }
  const { point, paintHash } = paintPoint;
  try {
    return await screenshotCache.getScreenshotForPreview(point, paintHash);
  } catch (e) {}
}

function useGetPreviewScreen({ loading, recordingDuration }: PropsFromRedux) {
  const [screen, setScreen] = useState<ScreenShot | null>(null);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
  }, []);

  useEffect(() => {
    async function getAndSetScreen() {
      const time = (loading / 100) * (recordingDuration || 0);
      let screen;

      const closestPaintPoint = getClosestPaintPoint(time);
      screen = await getScreenshotSafely(closestPaintPoint);

      if (!screen) {
        const nextPaintPoint = nextPaintEvent(time);
        screen = await getScreenshotSafely(nextPaintPoint);
      }

      if (screen && mounted.current) {
        setScreen(screen);
      }
    }

    getAndSetScreen();

    return () => {
      mounted.current = false;
    };
  }, [loading]);

  return screen;
}

function PreviewContainer({ screen }: { screen: ScreenShot | null }) {
  if (!screen) {
    return <div className="preview-container empty" />;
  }

  const image = `url(data:${screen.mimeType};base64,${screen.data})`;
  return <div className="preview-container" style={{ backgroundImage: image }}></div>;
}

function RecordingLoadingScreen({ loading, recordingDuration }: PropsFromRedux) {
  const screen = useGetPreviewScreen({ loading, recordingDuration });

  return (
    <>
      <Prompt>
        <h1>We&apos;re getting your recording ready</h1>
        <PreviewContainer screen={screen} />
        <div className="loading-bar" style={{ width: `${loading}%` }} />
        <p className="tip">{Math.floor(loading)}%</p>
      </Prompt>
    </>
  );
}

const connector = connect(
  (state: UIState) => ({
    loading: selectors.getLoading(state),
    recordingDuration: selectors.getRecordingDuration(state),
  }),
  {}
);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(RecordingLoadingScreen);

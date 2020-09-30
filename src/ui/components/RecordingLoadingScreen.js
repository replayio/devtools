import React, { useState, useEffect } from "react";
import { connect } from "react-redux";
import Header from "./Header";
import UserPrompt from "./shared/UserPrompt";
import { screenshotCache, nextPaintEvent, getClosestPaintPoint } from "protocol/graphics";
import { selectors } from "../reducers";

async function getScreenshotSafely(paintPoint) {
  if (!paintPoint) {
    return null;
  }
  const { point, paintHash } = paintPoint;
  try {
    return await screenshotCache.getScreenshotForTooltip(point, paintHash);
  } catch (e) {}
}

function useGetPreviewScreen({ loading, recordingDuration }) {
  const [screen, setScreen] = useState(null);

  useEffect(() => {
    async function getAndSetScreen() {
      const time = (loading / 100) * recordingDuration;
      let screen;

      const closestPaintPoint = getClosestPaintPoint(time);
      screen = await getScreenshotSafely(closestPaintPoint);

      if (!screen) {
        const nextPaintPoint = nextPaintEvent(time);
        screen = await getScreenshotSafely(nextPaintPoint);
      }

      if (screen) {
        setScreen(screen);
      }
    }

    getAndSetScreen();
  }, [loading]);

  return screen;
}

function PreviewContainer({ screen }) {
  if (!screen) {
    return <div className="preview-container empty" />;
  }

  const image = `url(data:${screen.mimeType};base64,${screen.data})`;
  return <div className="preview-container" style={{ backgroundImage: image }}></div>;
}

function RecordingLoadingScreen({ loading, recordingDuration }) {
  const screen = useGetPreviewScreen({ loading, recordingDuration });

  return (
    <>
      <Header />
      <UserPrompt>
        <h1>We&apos;re getting your recording ready</h1>
        <PreviewContainer screen={screen} />
        <div className="loading-bar" style={{ width: `${loading}%` }} />
        <p className="tip">{Math.floor(loading)}%</p>
      </UserPrompt>
    </>
  );
}

export default connect(
  state => ({
    loading: selectors.getLoading(state),
    recordingDuration: selectors.getRecordingDuration(state),
  }),
  {}
)(RecordingLoadingScreen);

import React, { useState, useEffect } from "react";
import { connect } from "react-redux";
import Header from "./Header";
import { UserPrompt } from "./Account/index";
import { screenshotCache, nextPaintEvent, getClosestPaintPoint } from "protocol/graphics";
import { selectors } from "../reducers";

function useGetPreviewScreen({ loading, recordingDuration }) {
  const [screen, setScreen] = useState(null);

  useEffect(() => {
    async function getAndSetScreen() {
      const time = (loading / 100) * recordingDuration;
      let screen;

      try {
        const closestPaintPoint = getClosestPaintPoint(time);
        const { point, paintHash } = closestPaintPoint;
        screen = await screenshotCache.getScreenshotForTooltip(point, paintHash);
      } catch {
        const nextPaintPoint = nextPaintEvent(time);
        const { point, paintHash } = nextPaintPoint;
        screen = await screenshotCache.getScreenshotForTooltip(point, paintHash);
      }

      setScreen(screen);
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

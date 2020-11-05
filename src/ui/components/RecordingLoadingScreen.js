import React, { useState, useRef, useEffect } from "react";
import { connect } from "react-redux";
import Header from "./Header/index";
import Prompt from "./shared/Prompt";
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
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
  }, []);

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
      <Prompt>
        <h1>We&apos;re getting your recording ready</h1>
        <PreviewContainer screen={screen} />
        <div className="loading-bar" style={{ width: `${loading}%` }} />
        <p className="tip">{Math.floor(loading)}%</p>
      </Prompt>
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

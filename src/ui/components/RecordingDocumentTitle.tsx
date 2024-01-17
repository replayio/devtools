import Head from "next/head";
import { useEffect, useRef, useState } from "react";

import { useGetRecording, useGetRecordingId } from "ui/hooks/recordings";
import { getProcessing } from "ui/reducers/app";
import { useAppSelector } from "ui/setup/hooks";

import { isTestSuiteReplay } from "./TestSuite/utils/isTestSuiteReplay";

const ANIMATION_INTERVAL = 100;
const ANIMATION_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export function RecordingDocumentTitle() {
  const recordingId = useGetRecordingId();
  const { recording } = useGetRecording(recordingId);
  const processing = useAppSelector(getProcessing);

  const [prefix, setPrefix] = useState("");

  const { metadata, title = "" } = recording ?? {};

  const testResult = recording && isTestSuiteReplay(recording) ? metadata?.test?.result : undefined;

  // Track the animation counter with a ref so that it doesn't reset to 0 when the effect re-runs
  // (The effect will re-run when the processing progress changes, for example)
  const animationFrameCounterRef = useRef(0);

  useEffect(() => {
    // Wait until we have a signal one way or another about whether this is still processing
    // This avoids title flickers if we were to set a ✅/❌ prefix for test suites,
    // and then replacing it a moment later with a loading spinner
    if (processing != null) {
      if (processing === true) {
        // Set the first animation frame immediately (and update it in the interval below)
        setPrefix(ANIMATION_FRAMES[0]);

        // If the recording is still being processed, show a spinner in the title until it's complete
        // We intentionally don't show the processing percentage in the title for a few reasons:
        // 1) It causes layout jump since the font is not monospace and whitespace gets collapsed
        // 2) It pushes the title to the right so much that it might get cutoff if there are many tabs
        // 3) The most important signal at this level is processing vs ready, not the exact percentage
        const intervalId = setInterval(() => {
          animationFrameCounterRef.current++;

          const index = animationFrameCounterRef.current % ANIMATION_FRAMES.length;
          const prefix = ANIMATION_FRAMES[index];

          setPrefix(prefix);
        }, ANIMATION_INTERVAL);

        return () => {
          clearInterval(intervalId);
        };
      } else if (testResult) {
        switch (testResult) {
          case "passed":
            setPrefix("✅");
            break;
          case "failed":
            setPrefix("❌");
            break;
          default:
            setPrefix("");
            break;
        }
      } else {
        setPrefix("");
      }
    }
  }, [processing, testResult]);

  return (
    <Head>
      <title>{prefix ? `${prefix} ${title}` : title}</title>
    </Head>
  );
}

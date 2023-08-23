import Head from "next/head";
import { useEffect, useRef, useState } from "react";

import { useRecordingProcessingProgress } from "replay-next/src/hooks/useRecordingProcessingProgress";
import { useGetRecording, useGetRecordingId } from "ui/hooks/recordings";

const ANIMATION_INTERVAL = 100;
const ANIMATION_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export function useRecordingDocumentTitle() {
  const recordingId = useGetRecordingId();
  const { recording } = useGetRecording(recordingId);

  const processingProgress = useRecordingProcessingProgress();

  const { metadata = {}, title = "" } = recording ?? {};

  const testResult = metadata.test?.result;

  const countRef = useRef(0);

  const [prefix, setPrefix] = useState("");

  useEffect(() => {
    if (processingProgress == null) {
      // Wait
    } else {
      if (processingProgress < 1) {
        setPrefix(ANIMATION_FRAMES[0]);

        // If the recording is still being processed, show a spinner in the title until it's complete
        // We intentionally don't show the processing percentage in the title for a few reasons:
        // 1) It causes layout jump since the font is not monospace and whitespace gets collapsed
        // 2) It pushes the title to the right so much that it might get cutoff if there are many tabs
        // 3) The most important signal at this level is processing vs ready, not the exact percentage
        const intervalId = setInterval(() => {
          countRef.current++;

          const index = countRef.current % ANIMATION_FRAMES.length;
          const prefix = ANIMATION_FRAMES[index];

          setPrefix(prefix);
        }, ANIMATION_INTERVAL);

        return () => {
          clearInterval(intervalId);
        };
      } else {
        switch (testResult) {
          case "passed":
            setPrefix("✅");
          case "failed":
            setPrefix("❌");
        }
      }
    }
  }, [processingProgress, testResult, title]);

  return (
    <Head>
      <title>{prefix ? `${prefix} ${title}` : title}</title>
    </Head>
  );
}

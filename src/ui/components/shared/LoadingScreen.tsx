import dynamic from "next/dynamic";
import React, { ReactNode, useCallback, useEffect, useState } from "react";
import { ConnectedProps, connect } from "react-redux";

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

const phrases = [
  "Tuning the flux capacitor...",
  "Prepping DeLorean for time travel...",
  "Revving up to 88 miles per hour...",
  "Gathering 1.21 gigawatts of power...",
  "Ensuring temporal paradox safeguards...",
  "Being careful not to mess up your timeline...",
  "Setting coordinates for the TARDIS...",
  "Routing power to the sonic screwdriver...",
  "Checking the Time Vortex for anomalies...",
  "Preparing for warp speed...",
  "Dodging the Daleks in the time stream...",
  "Dialing numbers on the Circuits of Time...",
  "Charging the time displacement equipment...",
  "Ensuring John Connor's safety...",
  "Calibrating the time levers...",
  "Making clever references to The Time Machine, by H.G. Wells...",
  "Spinning the time dials...",
  "Avoiding temporal ripples...",
  "Dodging paradoxical time loops...",
  "Routing power to the warp coils...",
  "Synchronizing with the Starfleet Time Directive...",
  "Preparing the transporter room...",
  "Leaping into another time period...",
  "Ensuring we're not seen by our past selves...",
  "Finding the right hourglass grain...",
  "Warming up the Epoch...",
  "Reversing the polarity of the JavaScript flow...",
  "Reducing temporal latencies in the React lifecycles...",
  "Wrapping time loops in async functions...",
  "Implementing the Grandfather Paradox resolver...",
  "Patching the Bootstrap Paradox...",
  "Initiating time garbage collection to prevent memory leaks...",
  "Setting breakpoints in the space-time continuum...",
  "Debugging the time dilation formula...",
  "Applying middleware to the Fourth Dimension...",
  "Preventing cross-origin requests to the past...",
  "Running Cron job for temporal recalibration...",
  "Loading Schrödinger's CSS (it's both formatted and not until observed)...",
  "Wrapping dimensions in higher-order components...",
  "Throwing promise to future self (hope they catch it)...",
  "Flattening the time-space array...",
  "Precompiling 4th dimensional SASS...",
  "Chrono-optimizing the runtime environment...",
  "Checking quantum entanglement of state variables...",
  "Compiling tachyonic antitelephone scripts...",
  "Ensuring the time-travel GC isn't causing a stack overflow...",
];

function LoadingScreen({
  uploading,
  awaitingSourcemaps,
  fallbackMessage,
  isProcessed,
  stalledTimeout = 15000,
}: PropsFromRedux & { fallbackMessage: string; isProcessed?: boolean; stalledTimeout?: number }) {
  const longWaitMessage =
    "<div><p>This is taking longer than expected.</p><p><a href='http://replay.io/discord' target='discord'>Contact us on Discord</a></p>";

  const [message, setMessage] = useState(isProcessed ? fallbackMessage : "Processing...");
  const [processing, setProcessing] = useState(isProcessed);

  useEffect(() => {
    setProcessing(isProcessed);
  }, [isProcessed]);

  useEffect(() => {
    if (!processing) {
      const changeMessage = () => {
        const randomIndex = Math.floor(Math.random() * phrases.length);
        setMessage(phrases[randomIndex]);
      };
      const phraseTimeout = setTimeout(changeMessage, 5000);
      // swap to cutesy phrase after 5 seconds
      // note: this should only be called a single time
      return () => clearTimeout(phraseTimeout);
    } else {
      setMessage(message);
    }
  }, [processing]);

  useEffect(() => {
    if (!processing) {
      const stalledTimeoutId = setTimeout(() => {
        // after 15 seconds, switch to stalled message
        setMessage(longWaitMessage);
      }, stalledTimeout);
      return () => clearTimeout(stalledTimeoutId);
    }
  }, [isProcessed, stalledTimeout, processing]);

  const waitingForMessage =
    awaitingSourcemaps || uploading ? (
      <span>Uploading {Math.round(uploading?.amount ? Number(uploading.amount) : 0)}Mb</span>
    ) : (
      <span dangerouslySetInnerHTML={{ __html: message }}></span>
    );
  return (
    <LoadingScreenTemplate>
      <span className={styles.messageWrapper} dangerouslySetInnerHTML={{ __html: message }}></span>
    </LoadingScreenTemplate>
  );
}

const connector = connect((state: UIState) => ({
  uploading: getUploading(state),
  awaitingSourcemaps: getAwaitingSourcemaps(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(LoadingScreen);

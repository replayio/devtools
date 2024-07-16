import { ReactNode, useEffect, useState } from "react";

import LoadingScreen from "ui/components/shared/LoadingScreen";

export function DevToolsDynamicLoadingMessage() {
  const [message, setMessage] = useState<ReactNode>("Loading...");

  useEffect(() => {
    const changeMessage = () => {
      const randomIndex = Math.floor(Math.random() * FILLER_PHRASES.length);
      setMessage(FILLER_PHRASES[randomIndex]);
    };

    const phraseTimeoutId = setTimeout(changeMessage, 8000);
    const stalledTimeoutId = setTimeout(() => {
      setMessage(LONG_WAIT_MESSAGE);
    }, LONG_WAIT_DURATION);

    return () => {
      clearTimeout(phraseTimeoutId);
      clearTimeout(stalledTimeoutId);
    };
  }, []);

  return <LoadingScreen message={message} />;
}

const FILLER_PHRASES = [
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
  "Spinning the time dials...",
  "Avoiding temporal ripples...",
  "Dodging paradoxical time loops...",
  "Routing power to the warp coils...",
  "Preparing the transporter room...",
  "Leaping into another time period...",
  "Ensuring we're not seen by our past selves...",
  "Finding the right hourglass grain...",
  "Warming up the Epoch...",
  "Reversing the polarity of the JavaScript flow...",
  "Wrapping time loops in async functions...",
  "Implementing the Grandfather Paradox resolver...",
  "Patching the Bootstrap Paradox...",
  "Initiating time garbage collection to prevent memory leaks...",
  "Setting breakpoints in the space-time continuum...",
  "Debugging the time dilation formula...",
  "Applying middleware to the Fourth Dimension...",
  "Preventing cross-origin requests to the past...",
  "Running Cron job for temporal recalibration...",
  "Loading Schrödinger's CSS (both formatted and not until observed)...",
  "Wrapping dimensions in higher-order components...",
  "Throwing promise to future self (hope they catch it)...",
  "Flattening the time-space array...",
  "Chrono-optimizing the runtime environment...",
  "Checking quantum entanglement of state variables...",
  "Compiling tachyonic antitelephone scripts...",
];

const LONG_WAIT_MESSAGE = (
  <div>
    <p>This is taking longer than expected.</p>
    <p>
      <a href="http://replay.io/discord" target="discord">
        Contact us on Discord
      </a>
    </p>
  </div>
);

const LONG_WAIT_DURATION = 20_000;

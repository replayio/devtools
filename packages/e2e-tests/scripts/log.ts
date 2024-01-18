import chalk from "chalk";
import { dots } from "cli-spinners";
import logUpdate from "log-update";

let currentAnimatedLog: (() => void) | null = null;

export function logAnimated(initialText: string) {
  if (currentAnimatedLog != null) {
    currentAnimatedLog();
    console.error("Cannot log two animated texts at once");
  }

  let index = 0;
  let text = initialText;

  const update = () => {
    const frame = dots.frames[++index % dots.frames.length];

    logUpdate(`${chalk.yellowBright(frame)} ${text}`);
  };

  const intervalId = setInterval(update, dots.interval);

  currentAnimatedLog = () => {
    currentAnimatedLog = null;
    clearInterval(intervalId);
    logUpdate(`${chalk.greenBright("✓")} ${text}`);
    logUpdate.done();
  };

  return {
    completeLog: () => {
      if (currentAnimatedLog != null) {
        currentAnimatedLog();
        currentAnimatedLog = null;
      }
    },
    updateLog: (updatedText: string) => {
      text = updatedText;
    },
  };
}

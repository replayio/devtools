import { isDemo } from "ui/utils/environment";
import { ThreadFront } from "protocol/thread";
import { REPLAY_DEMO_URL } from "ui/components/shared/FirstReplayModal/FirstReplayModal";

export async function setupDemo() {
  if (!isDemo()) {
    return;
  }
  const cx = app.selectors.getContext();

  app.actions.setViewMode("dev");

  await ThreadFront.ensureProcessed("executionIndexed");
  await app.actions.selectSource(cx, "o15");
  await app.actions.addBreakpoint(
    cx,
    { sourceId: "o15", line: 8, column: undefined },
    { logValue: '"Radius", radius' },
    false,
    true
  );

  app.actions.filterUpdate("error", false);

  let root = document.documentElement;
  root.style.setProperty("--editor-header-height", "0px");
  root.style.setProperty("--editor-footer-height", "0px");
}

export function isDemoReplay(recording) {
  return recording?.url === REPLAY_DEMO_URL;
}

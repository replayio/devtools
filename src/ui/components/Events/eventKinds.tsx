import type { ReplayEvent } from "ui/state/app";

export const EVENT_KINDS: { [key: string]: EventKind } = {
  keydown: { icon: "keyboard", label: "Key Down", key: "event.keyboard.keydown" },
  keyup: { icon: "keyboard", label: "Key Up", key: "event.keyboard.keyup" },
  keypress: { icon: "keyboard", label: "Key Press", key: "event.keyboard.keypress" },
  mousedown: { icon: "ads_click", label: "Click", key: "event.mouse.click" },
  navigation: { icon: "navigation", label: "Navigation" },
};

type Kind = keyof typeof EVENT_KINDS;
type EventKind = { icon: EventKindIcon; label: EventKindLabel; key?: EventKindKey };
type EventKindIcon = "keyboard" | "ads_click" | "navigation";
type EventKindLabel = "Key Down" | "Key Up" | "Key Press" | "Click" | "Navigation";
export type EventKindKey =
  | "event.keyboard.keydown"
  | "event.keyboard.keyup"
  | "event.keyboard.keypress"
  | "event.mouse.click";

export const getReplayEvent = (kind: Kind) => EVENT_KINDS[kind];
export const getEventLabel = (event: ReplayEvent) => {
  const { kind } = event;
  const { label } = getReplayEvent(kind);

  if (kind === "navigation") {
    const url = new URL(event.url);
    return <span title={event.url}>{url.host}</span>;
  }

  if ("key" in event) {
    return `${label} ${event.key}`;
  }

  return label;
};

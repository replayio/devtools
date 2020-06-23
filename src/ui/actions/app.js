export function updateTheme(theme) {
  return { type: "update_theme", theme };
}
export function updateTooltip(tooltip) {
  return { type: "update_tooltip", tooltip };
}

export function setSplitConsole(open) {
  return { type: "set_split_console", splitConsole: open };
}

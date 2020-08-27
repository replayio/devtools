export function updateTheme(theme) {
  return { type: "update_theme", theme };
}

export function setSplitConsole(open) {
  return { type: "set_split_console", splitConsole: open };
}

export function setSelectedPanel(panel) {
  return { type: "set_selected_panel", panel };
}

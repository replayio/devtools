export default function onEscape({
  activeSearch,
  closeActiveSearch,
  closeQuickOpen,
  shortcutsModalEnabled,
  toggleShortcutsModal,
  toggleSplitConsole,
  splitConsoleOpen,
}) {
  let anyTrue = activeSearch || quickOpenEnabled || shortcutsModalEnabled;
  if (activeSearch) {
    closeActiveSearch();
  }

  if (quickOpenEnabled) {
    closeQuickOpen();
  }

  if (shortcutsModalEnabled) {
    toggleShortcutsModal();
  }

  if (!anyTrue) {
    e.preventDefault();
    toggleSplitConsole(!splitConsoleOpen);
  }
}

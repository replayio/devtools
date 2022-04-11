import { useEffect } from "react";
import KeyShortcuts from "devtools/client/shared/key-shortcuts";

import { connect, ConnectedProps } from "react-redux";
import { UIState } from "ui/state";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import * as dbgActions from "devtools/client/debugger/src/actions/ui";
import { trackEvent } from "ui/utils/telemetry";
import { deselectSource } from "devtools/client/debugger/src/actions/sources/select";
import { getCommandPaletteInput } from "./CommandPalette/SearchInput";
import { getSelectedSource } from "devtools/client/debugger/src/reducers/sources";
import { isEditableElement, addGlobalShortcut, removeGlobalShortcut } from "ui/utils/key-shortcuts";

function KeyboardShortcuts({
  showCommandPaletteInEditor,
  setSelectedPrimaryPanel,
  focusFullTextInput,
  setViewMode,
  selectedSource,
  toolboxLayout,
  toggleCommandPalette,
  toggleFocusMode,
  togglePaneCollapse,
  viewMode,
  toggleTheme,
}: PropsFromRedux) {
  const openFullTextSearch = (e: KeyboardEvent) => {
    e.preventDefault();
    if (viewMode !== "dev") {
      setViewMode("dev");
    }
    trackEvent("key_shortcut.full_text_search");
    setSelectedPrimaryPanel("search");
    focusFullTextInput(true);
  };
  const toggleLeftSidebar = (e: KeyboardEvent) => {
    e.preventDefault();

    trackEvent("key_shortcut.toggle_left_sidebar");
    togglePaneCollapse();
  };
  const togglePalette = (e: KeyboardEvent) => {
    e.preventDefault();
    trackEvent("key_shortcut.show_command_palette");

    if (viewMode === "dev" && !selectedSource && toolboxLayout === "ide") {
      // Show the command palette in the editor
      showCommandPaletteInEditor();
    } else {
      toggleCommandPalette();
    }

    const paletteInput = getCommandPaletteInput();
    if (paletteInput) {
      paletteInput.focus();
    }
  };
  const onToggleTheme = (e: KeyboardEvent) => {
    if (!e.target || !isEditableElement(e.target)) {
      e.preventDefault();
      toggleTheme();
    }
  };
  const toggleEditFocusMode = (e: KeyboardEvent) => {
    if (!e.target || !isEditableElement(e.target)) {
      e.preventDefault();
      toggleFocusMode();
    }
  };

  // The shortcuts have to be reassigned every time the dependencies change,
  // otherwise we end up with a stale prop.
  useEffect(() => {
    addGlobalShortcut("CmdOrCtrl+Shift+F", openFullTextSearch);
    addGlobalShortcut("CmdOrCtrl+B", toggleLeftSidebar);
    addGlobalShortcut("CmdOrCtrl+K", togglePalette);
    addGlobalShortcut("Shift+T", onToggleTheme);
    addGlobalShortcut("Shift+F", toggleEditFocusMode);

    return () => {
      removeGlobalShortcut("CmdOrCtrl+Shift+F", openFullTextSearch);
      removeGlobalShortcut("CmdOrCtrl+B", toggleLeftSidebar);
      removeGlobalShortcut("CmdOrCtrl+K", togglePalette);
      removeGlobalShortcut("Shift+T", onToggleTheme);
      removeGlobalShortcut("Shift+F", toggleEditFocusMode);
    };
  }, [viewMode, selectedSource]);

  return null;
}

const connector = connect(
  (state: UIState) => ({
    selectedPrimaryPanel: selectors.getSelectedPrimaryPanel(state),
    selectedSource: getSelectedSource(state),
    viewMode: selectors.getViewMode(state),
    toolboxLayout: selectors.getToolboxLayout(state),
  }),
  {
    focusFullTextInput: dbgActions.focusFullTextInput,
    setSelectedPrimaryPanel: actions.setSelectedPrimaryPanel,
    setViewMode: actions.setViewMode,
    togglePaneCollapse: actions.togglePaneCollapse,
    toggleCommandPalette: actions.toggleCommandPalette,
    toggleFocusMode: actions.toggleFocusMode,
    showCommandPaletteInEditor: deselectSource,
    toggleTheme: actions.toggleTheme,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(KeyboardShortcuts);

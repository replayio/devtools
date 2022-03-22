import { useEffect } from "react";
import KeyShortcuts from "devtools/client/shared/key-shortcuts";
import { usesWindow } from "../../ssr";
import { connect, ConnectedProps } from "react-redux";
import { UIState } from "ui/state";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import * as dbgActions from "devtools/client/debugger/src/actions/ui";
import { trackEvent } from "ui/utils/telemetry";
import { deselectSource } from "devtools/client/debugger/src/actions/sources/select";
import { getCommandPaletteInput } from "./CommandPalette/SearchInput";
import { getSelectedSource } from "devtools/client/debugger/src/reducers/sources";

function setupShortcuts() {
  return usesWindow(win => {
    if (!win) {
      return null;
    }
    return new KeyShortcuts({ window: win, target: win.document });
  });
}

const globalShortcuts = setupShortcuts();

function KeyboardShortcuts({
  showCommandPaletteInEditor,
  setSelectedPrimaryPanel,
  focusFullTextInput,
  setViewMode,
  selectedSource,
  toolboxLayout,
  toggleCommandPalette,
  togglePaneCollapse,
  viewMode,
}: PropsFromRedux) {
  const addShortcut = (key: string, callback: (e: KeyboardEvent) => void) => {
    if (!globalShortcuts) {
      return;
    }
    globalShortcuts.on(key, callback);
  };
  const removeShortcut = (key: string, callback: (e: KeyboardEvent) => void) => {
    if (!globalShortcuts) {
      return;
    }
    globalShortcuts.off(key, callback);
  };

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

  // The shortcuts have to be reassigned every time the dependencies change,
  // otherwise we end up with a stale prop.
  useEffect(() => {
    addShortcut("CmdOrCtrl+Shift+F", openFullTextSearch);
    addShortcut("CmdOrCtrl+B", toggleLeftSidebar);
    addShortcut("CmdOrCtrl+K", togglePalette);

    return () => {
      removeShortcut("CmdOrCtrl+Shift+F", openFullTextSearch);
      removeShortcut("CmdOrCtrl+B", toggleLeftSidebar);
      removeShortcut("CmdOrCtrl+K", togglePalette);
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
    showCommandPaletteInEditor: deselectSource,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(KeyboardShortcuts);

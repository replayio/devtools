import React, { useEffect, useMemo } from "react";

import { connect, ConnectedProps } from "react-redux";
import { UIState } from "ui/state";
import { UIThunkAction } from "ui/actions";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import * as dbgActions from "devtools/client/debugger/src/actions/ui";
import { toggleQuickOpen, closeQuickOpen } from "devtools/client/debugger/src/actions/quick-open";
import { getActiveSearch, getQuickOpenEnabled } from "devtools/client/debugger/src/selectors";
import { trackEvent } from "ui/utils/telemetry";
import { deselectSource } from "devtools/client/debugger/src/actions/sources/select";
import { getCommandPaletteInput } from "./CommandPalette/SearchInput";
import { getSelectedSource } from "devtools/client/debugger/src/reducers/sources";
import { isEditableElement, addGlobalShortcut, removeGlobalShortcut } from "ui/utils/key-shortcuts";

const closeOpenModalsOnEscape = (e: KeyboardEvent): UIThunkAction => {
  return (dispatch, getState) => {
    const state = getState();

    // Do these checks in a thunk to avoid subscribing to the state values
    const activeSearchEnabled = getActiveSearch(state);
    const quickOpenEnabled = getQuickOpenEnabled(state);

    if (activeSearchEnabled || quickOpenEnabled) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (activeSearchEnabled) {
      dispatch(dbgActions.closeActiveSearch());
    }

    if (quickOpenEnabled) {
      dispatch(closeQuickOpen());
    }
  };
};

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
  toggleQuickOpen,
  closeOpenModalsOnEscape,
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

  const toggleQuickOpenModal = (e: KeyboardEvent, query = "", project = false) => {
    e.preventDefault();
    e.stopPropagation();

    toggleQuickOpen(query, project);
  };

  const toggleFunctionQuickOpenModal = (e: KeyboardEvent) => {
    toggleQuickOpenModal(e, "@");
  };

  const toggleProjectFunctionQuickOpenModal = (e: KeyboardEvent) => {
    toggleQuickOpenModal(e, "@", true);
  };

  const toggleLineQuickOpenModal = (e: KeyboardEvent) => {
    toggleQuickOpenModal(e, ":");
  };

  const globalKeyboardShortcuts = useMemo(() => {
    // The shortcuts have to be reassigned every time the dependencies change,
    // otherwise we end up with a stale prop.

    const shortcuts: Record<string, (e: KeyboardEvent) => void> = {
      "CmdOrCtrl+Shift+F": openFullTextSearch,
      "CmdOrCtrl+B": toggleLeftSidebar,
      "CmdOrCtrl+K": togglePalette,

      // Should be ignored when an editable element is focused
      "Shift+T": onToggleTheme,
      "Shift+F": toggleEditFocusMode,

      // Quick Open-related toggles
      "CmdOrCtrl+Shift+P": toggleQuickOpenModal,
      // We apparently accept this with or without a Shift key currently
      "CmdOrCtrl+P": toggleQuickOpenModal,
      // Can pre-fill the dialog with specific filter prefixes
      "CmdOrCtrl+Shift+O": toggleFunctionQuickOpenModal,
      "CmdOrCtrl+O": toggleProjectFunctionQuickOpenModal,
      "CmdOrCtrl+G": toggleLineQuickOpenModal,

      Escape: closeOpenModalsOnEscape,
    };

    return shortcuts;
    // TODO We're getting "hooks exhaustive deps" warnings here
    // due to the callbacks, but the code is valid as-is.
  }, [viewMode, selectedSource]);

  useEffect(() => {
    for (let [keyCombo, eventHandler] of Object.entries(globalKeyboardShortcuts)) {
      addGlobalShortcut(keyCombo, eventHandler);
    }

    return () => {
      for (let [keyCombo, eventHandler] of Object.entries(globalKeyboardShortcuts)) {
        removeGlobalShortcut(keyCombo, eventHandler);
      }
    };
  }, [globalKeyboardShortcuts]);

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
    toggleQuickOpen,
    closeOpenModalsOnEscape,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(KeyboardShortcuts);

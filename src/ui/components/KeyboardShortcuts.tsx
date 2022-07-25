import { useEffect, useMemo } from "react";

import { connect, ConnectedProps } from "react-redux";
import { useFeature } from "ui/hooks/settings";
import { UIState } from "ui/state";
import { UIThunkAction } from "ui/actions";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";
import { getSelectedSource } from "ui/reducers/sources";
import * as dbgActions from "devtools/client/debugger/src/actions/ui";
import { toggleQuickOpen, closeQuickOpen } from "devtools/client/debugger/src/actions/quick-open";
import { getActiveSearch, getQuickOpenEnabled } from "devtools/client/debugger/src/selectors";
import { trackEvent } from "ui/utils/telemetry";
import { deselectSource } from "devtools/client/debugger/src/actions/sources/select";
import { getCommandPaletteInput } from "./CommandPalette/SearchInput";
import { isEditableElement, addGlobalShortcut, removeGlobalShortcut } from "ui/utils/key-shortcuts";
import { useGetRecordingId } from "ui/hooks/recordings";
import useAuth0 from "ui/utils/useAuth0";

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
  createFrameComment,
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
  toggleThemeAction,
  toggleQuickOpen,
  closeOpenModalsOnEscape,
}: PropsFromRedux) {
  const recordingId = useGetRecordingId();
  const { isAuthenticated } = useAuth0();
  const { value: protocolTimeline, update: updateProtocolTimeline } =
    useFeature("protocolTimeline");
  const globalKeyboardShortcuts = useMemo(() => {
    const openFullTextSearch = (e: KeyboardEvent) => {
      e.preventDefault();
      if (viewMode !== "dev") {
        setViewMode("dev");
      }
      trackEvent("key_shortcut.full_text_search");
      setSelectedPrimaryPanel("search");
      focusFullTextInput(true);
    };

    const toggleEditFocusMode = (e: KeyboardEvent) => {
      if (!e.target || !isEditableElement(e.target)) {
        e.preventDefault();
        toggleFocusMode();
      }
    };

    const toggleFunctionQuickOpenModal = (e: KeyboardEvent) => {
      toggleQuickOpenModal(e, "@");
    };

    const toggleLeftSidebar = (e: KeyboardEvent) => {
      e.preventDefault();

      trackEvent("key_shortcut.toggle_left_sidebar");
      togglePaneCollapse();
    };

    const toggleLineQuickOpenModal = (e: KeyboardEvent) => {
      toggleQuickOpenModal(e, ":");
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

    const toggleProjectFunctionQuickOpenModal = (e: KeyboardEvent) => {
      toggleQuickOpenModal(e, "@", true);
    };

    const toggleQuickOpenModal = (e: KeyboardEvent, query = "", project = false) => {
      e.preventDefault();
      e.stopPropagation();

      toggleQuickOpen(query, project);
    };

    const addComment = (e: KeyboardEvent) => {
      // Un-authenticated users can't comment on Replays.
      if (!isAuthenticated) {
        return;
      }

      if (!e.target || !isEditableElement(e.target)) {
        e.preventDefault();
        createFrameComment(null, recordingId);
      }
    };

    const toggleTheme = (e: KeyboardEvent) => {
      if (!e.target || !isEditableElement(e.target)) {
        e.preventDefault();
        toggleThemeAction();
      }
    };

    const toggleProtocolTimeline = (e: KeyboardEvent) => {
      if (!e.target || !isEditableElement(e.target)) {
        e.preventDefault();
        updateProtocolTimeline(!protocolTimeline);
      }
    };

    const shortcuts: Record<string, (e: KeyboardEvent) => void> = {
      "CmdOrCtrl+Shift+F": openFullTextSearch,
      "CmdOrCtrl+B": toggleLeftSidebar,
      "CmdOrCtrl+K": togglePalette,

      // Should be ignored when an editable element is focused
      "Shift+C": addComment,
      "Shift+T": toggleTheme,
      "Shift+F": toggleEditFocusMode,

      // Quick Open-related toggles
      "CmdOrCtrl+Shift+P": toggleQuickOpenModal,
      // We apparently accept this with or without a Shift key currently
      "CmdOrCtrl+P": toggleQuickOpenModal,
      // Can pre-fill the dialog with specific filter prefixes
      "CmdOrCtrl+Shift+O": toggleFunctionQuickOpenModal,
      "CmdOrCtrl+O": toggleProjectFunctionQuickOpenModal,
      "CmdOrCtrl+G": toggleLineQuickOpenModal,

      "~": toggleProtocolTimeline,

      Escape: closeOpenModalsOnEscape,
    };

    return shortcuts;
  }, [
    isAuthenticated,
    showCommandPaletteInEditor,
    setSelectedPrimaryPanel,
    focusFullTextInput,
    protocolTimeline,
    setViewMode,
    selectedSource,
    toolboxLayout,
    toggleCommandPalette,
    toggleFocusMode,
    togglePaneCollapse,
    updateProtocolTimeline,
    viewMode,
    toggleThemeAction,
    toggleQuickOpen,
    closeOpenModalsOnEscape,
    createFrameComment,
    recordingId,
  ]);

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
    toolboxLayout: selectors.getToolboxLayout(state),
    viewMode: selectors.getViewMode(state),
  }),
  {
    createFrameComment: actions.createFrameComment,
    focusFullTextInput: dbgActions.focusFullTextInput,
    setSelectedPrimaryPanel: actions.setSelectedPrimaryPanel,
    setViewMode: actions.setViewMode,
    togglePaneCollapse: actions.togglePaneCollapse,
    toggleCommandPalette: actions.toggleCommandPalette,
    toggleFocusMode: actions.toggleFocusMode,
    showCommandPaletteInEditor: deselectSource,
    toggleThemeAction: actions.toggleTheme,
    toggleQuickOpen,
    closeOpenModalsOnEscape,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(KeyboardShortcuts);

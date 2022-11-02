import { useEffect, useMemo } from "react";
import { ConnectedProps, connect } from "react-redux";

import { closeQuickOpen, toggleQuickOpen } from "devtools/client/debugger/src/actions/quick-open";
import * as dbgActions from "devtools/client/debugger/src/actions/ui";
import { getActiveSearch, getQuickOpenEnabled } from "devtools/client/debugger/src/selectors";
import { UIThunkAction } from "ui/actions";
import { actions } from "ui/actions";
import { useGetRecordingId } from "ui/hooks/recordings";
import { useFeature } from "ui/hooks/settings";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";
import { addGlobalShortcut, isEditableElement, removeGlobalShortcut } from "ui/utils/key-shortcuts";
import { trackEvent } from "ui/utils/telemetry";
import useAuth0 from "ui/utils/useAuth0";

import { getCommandPaletteInput } from "./CommandPalette/SearchInput";

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
  setSelectedPrimaryPanel,
  focusFullTextInput,
  setViewMode,
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

      toggleCommandPalette();

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
      "Alt+Shift+T": toggleTheme,
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
    setSelectedPrimaryPanel,
    focusFullTextInput,
    protocolTimeline,
    setViewMode,
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
    toggleThemeAction: actions.toggleTheme,
    toggleQuickOpen,
    closeOpenModalsOnEscape,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(KeyboardShortcuts);

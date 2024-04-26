import { useEffect, useMemo } from "react";
import { ConnectedProps, connect } from "react-redux";

import { closeQuickOpen, toggleQuickOpen } from "devtools/client/debugger/src/actions/quick-open";
import * as dbgActions from "devtools/client/debugger/src/actions/ui";
import { getActiveSearch, getQuickOpenEnabled } from "devtools/client/debugger/src/selectors";
import { SHOW_GLOBAL_SEARCH_EVENT_TYPE } from "replay-next/components/search-files/SearchFiles";
import { createTypeDataForVisualComment } from "replay-next/components/sources/utils/comments";
import { useNag } from "replay-next/src/hooks/useNag";
import { Nag } from "shared/graphql/types";
import { getSystemColorScheme } from "shared/theme/getSystemColorScheme";
import { useGraphQLUserData } from "shared/user-data/GraphQL/useGraphQLUserData";
import { userData } from "shared/user-data/GraphQL/UserData";
import { UIThunkAction, actions } from "ui/actions";
import { useGetRecordingId } from "ui/hooks/recordings";
import { selectors } from "ui/reducers";
import { getAccessToken } from "ui/reducers/app";
import { getSelectedSourceId } from "ui/reducers/sources";
import { useAppSelector } from "ui/setup/hooks";
import { UIState } from "ui/state";
import { addGlobalShortcut, isEditableElement, removeGlobalShortcut } from "ui/utils/key-shortcuts";
import { trackEvent } from "ui/utils/telemetry";

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
  viewMode,
  toggleQuickOpen,
  closeOpenModalsOnEscape,
  jumpToPreviousPause,
  jumpToNextPause,
}: PropsFromRedux) {
  const recordingId = useGetRecordingId();
  const isAuthenticated = !!useAppSelector(getAccessToken);
  const [, dismissFindFileNag] = useNag(Nag.FIND_FILE);

  const selectedSourceId = useAppSelector(getSelectedSourceId);

  const [protocolTimeline] = useGraphQLUserData("feature_protocolTimeline");
  const globalKeyboardShortcuts = useMemo(() => {
    const openFullTextSearch = (e: KeyboardEvent) => {
      e.preventDefault();
      if (viewMode !== "dev") {
        setViewMode("dev");
      }
      trackEvent("key_shortcut.full_text_search");
      setSelectedPrimaryPanel("search");
      focusFullTextInput(true);

      window.dispatchEvent(new CustomEvent(SHOW_GLOBAL_SEARCH_EVENT_TYPE));
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

    const toggleGoToLine = (e: KeyboardEvent) => {
      if (selectedSourceId) {
        toggleQuickOpenModal(e, ":");
      }
    };

    const toggleQuickOpenModal = (e: KeyboardEvent, query = "", project = false) => {
      dismissFindFileNag();

      e.preventDefault();
      e.stopPropagation();
      toggleQuickOpen(query, project);
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

    const addComment = async (e: KeyboardEvent) => {
      // Un-authenticated users can't comment on Replays.
      if (!isAuthenticated) {
        return;
      }

      if (!e.target || !isEditableElement(e.target)) {
        e.preventDefault();

        const image = document.getElementById("graphics");
        const typeData = image ? await createTypeDataForVisualComment(image, null, null) : null;

        createFrameComment(null, recordingId, typeData);
      }
    };

    const toggleTheme = (e: KeyboardEvent) => {
      if (!e.target || !isEditableElement(e.target)) {
        e.preventDefault();

        let theme = userData.get("global_theme");
        if (theme === "system") {
          theme = getSystemColorScheme();
        }
        userData.set("global_theme", theme === "dark" ? "light" : "dark");
      }
    };

    const toggleProtocolTimeline = (e: KeyboardEvent) => {
      if (!e.target || !isEditableElement(e.target)) {
        e.preventDefault();
        userData.set("feature_protocolTimeline", !protocolTimeline);
      }
    };

    const jumpToPreviousPauseWrapper = (e: KeyboardEvent) => {
      if (!e.target || !isEditableElement(e.target)) {
        e.preventDefault();
        jumpToPreviousPause();
      }
    };

    const jumpToNextPauseWrapper = (e: KeyboardEvent) => {
      if (!e.target || !isEditableElement(e.target)) {
        e.preventDefault();
        jumpToNextPause();
      }
    };

    const shortcuts: Record<string, (e: KeyboardEvent) => void> = {
      "CmdOrCtrl+Shift+F": openFullTextSearch,
      "CmdOrCtrl+K": togglePalette,

      // Should be ignored when an editable element is focused
      "Shift+C": addComment,
      "Alt+Shift+T": toggleTheme,
      "Shift+F": toggleEditFocusMode,

      // Quick Open-related toggles
      "CmdOrCtrl+Shift+P": toggleQuickOpenModal,
      "CmdOrCtrl+P": toggleQuickOpenModal,

      // Go to line
      "Ctrl+K": toggleGoToLine,

      // Can pre-fill the dialog with specific filter prefixes
      "CmdOrCtrl+Shift+O": toggleFunctionQuickOpenModal,
      "CmdOrCtrl+O": toggleProjectFunctionQuickOpenModal,
      "CmdOrCtrl+[": jumpToPreviousPauseWrapper,
      "CmdOrCtrl+]": jumpToNextPauseWrapper,
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
    viewMode,
    toggleQuickOpen,
    closeOpenModalsOnEscape,
    createFrameComment,
    recordingId,
    jumpToPreviousPause,
    jumpToNextPause,
    dismissFindFileNag,
    selectedSourceId,
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
    toggleCommandPalette: actions.toggleCommandPalette,
    toggleFocusMode: actions.toggleFocusMode,
    toggleQuickOpen,
    closeOpenModalsOnEscape,
    jumpToPreviousPause: actions.jumpToPreviousPause,
    jumpToNextPause: actions.jumpToNextPause,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(KeyboardShortcuts);

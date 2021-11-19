import { useEffect } from "react";
import KeyShortcuts from "devtools/client/shared/key-shortcuts";
import { usesWindow } from "ssr";
import { connect, ConnectedProps } from "react-redux";
import { UIState } from "ui/state";
import { selectors } from "ui/reducers";
import { actions } from "ui/actions";

function setupShortcuts() {
  return usesWindow(win => {
    if (!win) return null;
    return new KeyShortcuts({ window: win, target: win.document });
  });
}

const globalShortcuts = setupShortcuts();

function KeyboardShortcuts({ viewMode, setSelectedPrimaryPanel, setViewMode }: PropsFromRedux) {
  const openFileSearch = () => {
    if (viewMode !== "dev") {
      setViewMode("dev");
    }

    setSelectedPrimaryPanel("search");
  };

  useEffect(() => {
    if (!globalShortcuts) return;

    globalShortcuts.on("CmdOrCtrl+Shift+F", openFileSearch);
  }, []);

  return null;
}

const connector = connect(
  (state: UIState) => ({
    selectedPrimaryPanel: selectors.getSelectedPrimaryPanel(state),
    viewMode: selectors.getViewMode(state),
  }),
  { setSelectedPrimaryPanel: actions.setSelectedPrimaryPanel, setViewMode: actions.setViewMode }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(KeyboardShortcuts);

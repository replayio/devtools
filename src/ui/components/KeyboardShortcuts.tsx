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

function KeyboardShortcuts({ setSelectedPrimaryPanel }: PropsFromRedux) {
  useEffect(() => {
    if (!globalShortcuts) return;

    globalShortcuts.on("CmdOrCtrl+Shift+F", () => setSelectedPrimaryPanel("search"));
  }, []);

  return null;
}

const connector = connect(
  (state: UIState) => ({
    selectedPrimaryPanel: selectors.getSelectedPrimaryPanel(state),
  }),
  { setSelectedPrimaryPanel: actions.setSelectedPrimaryPanel }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(KeyboardShortcuts);

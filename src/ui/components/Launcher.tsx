import React from "react";
import { connect, ConnectedProps } from "react-redux";
import Modal from "ui/components/shared/NewModal";
import { useGetUserSettings } from "ui/hooks/settings";
import { UIState } from "ui/state";
import { formatKeyShortcut } from "devtools/client/debugger/src/utils/text";

const SHORTCUTS = [
  { label: "Go to file", key: "CmdOrCtrl+P" },
  { label: "Search functions", key: "CmdOrCtrl+O" },
  { label: "Find in files", key: "CmdOrCtrl+Shift+F" },
  // { label: "Show all shortcuts", key: "CmdOrCtrl+/" },
];

function Launcher({}: PropsFromRedux) {
  const [showLauncher, setShowLauncher] = React.useState(true);
  const { userSettings, loading } = useGetUserSettings();

  if (loading || !showLauncher) {
    return null;
  }

  return (
    <Modal
      options={{ maskTransparency: "translucent" }}
      blurMask={false}
      onMaskClick={() => setShowLauncher(false)}
    >
      <div
        className="relative flex flex-col bg-white rounded-lg overflow-hidden p-8 shadow-lg space-y-4"
        style={{ width: "460px" }}
      >
        {SHORTCUTS.map(({ label, key }, i) => (
          <button
            className="flex justify-between px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            key={i}
          >
            <div>{label}</div>
            <div>{formatKeyShortcut(key)}</div>
          </button>
        ))}
      </div>
    </Modal>
  );
}

const connector = connect((state: UIState) => ({}));
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(Launcher);

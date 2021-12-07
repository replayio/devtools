import React from "react";
import { connect, ConnectedProps } from "react-redux";
import Modal from "ui/components/shared/NewModal";
import { useGetUserSettings } from "ui/hooks/settings";
import { UIState } from "ui/state";
import { formatKeyShortcut } from "devtools/client/debugger/src/utils/text";
import Checkbox from "./shared/Forms/Checkbox";
import ReplayLogo from "./shared/ReplayLogo";

const SHORTCUTS = [
  { label: "Show sources", key: "CmdOrCtrl+P" },
  { label: "Find a file", key: "CmdOrCtrl+O" },
  { label: "Find a function", key: "CmdOrCtrl+Shift+F" },
  { label: "Just let me at it", key: "CmdOrCtrl+G+T+F+O" },
  // { label: "Show all shortcuts", key: "CmdOrCtrl+/" },
];
// const SHORTCUTS = [
//   { label: "Go to file", key: "CmdOrCtrl+P" },
//   { label: "Search functions", key: "CmdOrCtrl+O" },
//   { label: "Find in files", key: "CmdOrCtrl+Shift+F" },
//   // { label: "Show all shortcuts", key: "CmdOrCtrl+/" },
// ];

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
        className="relative flex flex-col bg-white rounded-lg p-4 shadow-lg space-y-4"
        style={{ width: "360px" }}
      >
        <div className="self-center flex flex-col items-center space-y-4 text-xl py-4">
          <ReplayLogo size="md" />
          <div className="flex flex-col space-y-1 items-center">
            <div>Welcome to Replay's DevTools</div>
            <div className="text-xs">Where would you like to start?</div>
          </div>
        </div>
        <div className="flex flex-col px-4 space-y-2 text-sm">
          {SHORTCUTS.map(({ label, key }, i) => (
            <button
              className="flex justify-between px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              key={i}
            >
              <div>{label}</div>
              <div className="text-gray-400">{formatKeyShortcut(key)}</div>
            </button>
          ))}
        </div>
        <label className="flex space-x-1 items-center" htmlFor="show-launcher">
          <Checkbox id="show-launcher" />
          <div className="text-xs select-none">Show this window on launch</div>
        </label>
      </div>
    </Modal>
  );
}

const connector = connect((state: UIState) => ({}));
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(Launcher);

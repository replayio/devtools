import { RefObject } from "react";
import { ImperativePanelHandle } from "react-resizable-panels";

import MaterialIcon from "ui/components/shared/MaterialIcon";

interface ToolboxButtonProps {
  title?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}

export const ToolboxButton = ({ children, title, onClick = () => {} }: ToolboxButtonProps) => {
  return (
    <button
      className="toolbox-options flex items-center p-2 text-iconColor hover:text-gray-600"
      title={title}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export const ShowVideoButton = ({
  videoPanelCollapsed,
  videoPanelRef,
}: {
  videoPanelCollapsed: Boolean;
  videoPanelRef: RefObject<ImperativePanelHandle>;
}) => {
  const onClick = () => {
    const panel = videoPanelRef.current;
    if (panel) {
      if (videoPanelCollapsed) {
        panel.expand();
      } else {
        panel.collapse();
      }
    }
  };

  return (
    <ToolboxButton title={videoPanelCollapsed ? "Show Video" : "Hide Video"} onClick={onClick}>
      <MaterialIcon>{videoPanelCollapsed ? "videocam_on" : "videocam_off"}</MaterialIcon>
    </ToolboxButton>
  );
};

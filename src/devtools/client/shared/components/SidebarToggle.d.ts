import { FunctionComponent } from "react";

interface SidebarToggleProps {
  collapsed: boolean;
  collapsePaneTitle: string;
  expandPaneTitle: string;
  onClick(): void;
  alignRight?: boolean;
  canVerticalSplit?: boolean;
}

declare const SidebarToggle: FunctionComponent<SidebarToggleProps>;
export = SidebarToggle;

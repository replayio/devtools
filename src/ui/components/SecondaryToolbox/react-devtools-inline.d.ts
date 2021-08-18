declare module "react-devtools-inline/frontend" {
  import { ReactElement } from "react";

  export interface ReactDevToolsProps {
    browserTheme: string;
    enabledInspectedElementContextMenu: boolean;
    overrideTab: string;
    showTabBar: boolean;
  }
  export type ReactDevTools = ReactElement<ReactDevToolsProps>;

  export interface Target {
    postMessage(message: any, targetOrigin: string, transferable?: any[]): void;
  }
  export interface Wall {
    listen(listener: (msg: any) => void): () => void;
    send(event: string, payload: any): void;
  }
  export interface Bridge {}
  export interface Store {}

  export function createBridge(target: Target, wall: Wall): Bridge;
  export function createStore(bridge: Bridge): Store;
  export function initialize(
    target: Target,
    bridgeAndStore: { bridge: Bridge; store: Store }
  ): typeof ReactDevTools;
}

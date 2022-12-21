export type PanelId = string;

export type Panel = {
  defaultWeight: number;
  id: PanelId;
  maxWeight: number;
  minWeight: number;
};

export type ResizeHandler = {
  idAfter: PanelId;
  idBefore: PanelId;
};

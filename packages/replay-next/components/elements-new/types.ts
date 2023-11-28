import { ObjectId } from "@replayio/protocol";

export type Attributes = { [key: string]: string };

export type Node = {
  attributes: Attributes;
  children: Node[];
  nodeType: number;
  parentObject: Node | null;
  objectId: ObjectId;
  tagName: string;
};

export type ItemDisplayMode = "collapsed" | "empty" | "head" | "tail";

export type Item = {
  attributes: Attributes;
  depth: number;
  displayMode: ItemDisplayMode;
  displayName: string;
  nodeType: number;
  objectId: ObjectId;
};

export type Metadata = Node & {
  depth: number;
  isExpanded: boolean;
  weight: number;
};

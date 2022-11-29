import type { Spread } from "lexical";
import { SerializedTextNode } from "lexical";

export type SerializedMentionsTextNode = Spread<
  {
    text: string;
    type: "mentions-item";
    version: 1;
  },
  SerializedTextNode
>;

export type TeamMember = {
  name: string;
  username: string;
};

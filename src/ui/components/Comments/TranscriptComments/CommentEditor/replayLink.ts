import { EditorState } from "prosemirror-state";
import { Node, mergeAttributes, nodeInputRule, PasteRule, markPasteRule } from "@tiptap/core";

export interface ReplayLinkOptions {
  HTMLAttributes: Record<string, any>;
}

export const inputRegex = /(https:\/\/app.replay.io\/recording\/(.*)\??.*)/g;

const getAttributes = (match: string[]) => {
  const [href, , recordingId] = match;
  return {
    href,
    recordingId,
  };
};

// More info at:
// https://www.notion.so/replayio/TipTap-Editor-0021afbf0c0e458793eba4c98cbbb47e#5a47e9da0c5d4fd1bd57436b0a48294c
export const ReplayLink = Node.create<ReplayLinkOptions>({
  name: "Replay-link",

  priority: 100,

  defaultOptions: {
    HTMLAttributes: {
      class: "text-primaryAccentText hover:text-primaryAccentLegacyHover",
      rel: "nofollow",
      target: "_blank",
    },
  },

  addAttributes() {
    return {
      href: { default: null },
      recordingId: { default: null },
      text: "text",
      content: "content",
    };
  },

  atom: true,
  group: "inline",
  inline: true,

  parseHTML() {
    return [{ tag: "a[href]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const firstPart = node.attrs.recordingId?.split("-")?.[0] || "";
    return [
      "a",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      `replay#${firstPart}`,
    ];
  },

  addInputRules() {
    return [
      nodeInputRule({
        find: inputRegex,
        type: this.type,
        getAttributes,
      }),
    ];
  },

  addPasteRules() {
    return [
      {
        find: inputRegex,
        handler: ({
          state,
          range,
          match,
        }: {
          state: EditorState;
          range: { from: number; to: number };
          match: string[];
        }) => {
          // If this method is getting called it's because our matcher worked.
          // So we should shove a Replay Link node into where this match was.
          // Thankfully, ProseMirror editors have a nice little `replaceWith`
          // function that basically does just that. I was majorly guided by
          // https://Replay.com/ueberdosis/tiptap/blob/main/packages/core/src/inputRules/nodeInputRule.ts
          const attributes = getAttributes(match);
          const { tr } = state;
          const start = range.from;
          let end = range.to;

          tr.replaceWith(start, end, this.type.create(attributes));
        },
      },
    ];
  },
});

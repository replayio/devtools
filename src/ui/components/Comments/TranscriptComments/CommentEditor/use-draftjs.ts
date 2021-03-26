import type { EditorPlugin } from "@draft-js-plugins/editor";
import type { EmojiPlugin } from "@draft-js-plugins/emoji";

import "draft-js/dist/Draft.css";
import "@draft-js-plugins/emoji/lib/plugin.css";
import "@draft-js-plugins/mention/lib/plugin.css";

export interface LazyLoadDraftConfig {
  modules: {
    DraftJS: any;
    Editor: any;
  };
  emojiPlugin: EmojiPlugin;
  mentionPlugin: EditorPlugin & {
    MentionSuggestions: React.ComponentType<any>;
  };
}

let config: LazyLoadDraftConfig;

function useDraftJS() {
  function load() {
    if (config) return Promise.resolve(config);
    return Promise.all([
      import("draft-js"),
      import("@draft-js-plugins/editor"),
      import("@draft-js-plugins/emoji"),
      import("@draft-js-plugins/mention"),
    ]).then(
      ([
        DraftJS,
        Editor,
        { default: createEmojiPlugin, defaultTheme: defaultEmojiTheme },
        { default: createMentionPlugin, defaultTheme: defaultMentionTheme },
      ]) => {
        const cfg: LazyLoadDraftConfig = {
          modules: {
            DraftJS,
            Editor,
          },
          emojiPlugin: createEmojiPlugin({
            theme: {
              ...defaultEmojiTheme,
              emojiSuggestions: `${defaultEmojiTheme.emojiSuggestions} pluginPopover`,
            },
          }),
          mentionPlugin: createMentionPlugin({
            entityMutability: "IMMUTABLE",
            theme: {
              ...defaultMentionTheme,
              mentionSuggestions: `${defaultMentionTheme.mentionSuggestions} pluginPopover`,
            },
          }),
        };

        config = cfg;

        return cfg;
      }
    );
  }

  return load;
}

export default useDraftJS;

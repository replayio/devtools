import { ReactRenderer } from "@tiptap/react";
import tippy, { Instance, Props } from "tippy.js";
import { getOwnersAndCollaborators } from "ui/hooks/recordings";
import { getRecordingId } from "ui/utils/environment";
import { MentionList } from "./MentionList";

export default (_users: string[]) => ({
  items: async (query: string) => {
    const recordingId = getRecordingId();
    return getOwnersAndCollaborators(recordingId!).then(({ collaborators, recording }) =>
      [
        ...collaborators
          .map(c => c.user)
          .filter(Boolean)
          .map(user => user.name),
        recording?.user?.name,
      ]
        .filter((item?: string) => item?.toLowerCase().startsWith(query.toLowerCase()))
        .slice(0, 5)
    );
  },
  render: () => {
    let reactRenderer: ReactRenderer;
    let popup: Instance<Props>[];

    return {
      onStart: (props: any) => {
        reactRenderer = new ReactRenderer(MentionList, {
          props,
          editor: props.editor,
        });

        popup = tippy("body", {
          appendTo: () => document.body,
          content: reactRenderer.element,
          getReferenceClientRect: props.clientRect,
          interactive: true,
          placement: "bottom-start",
          showOnCreate: true,
          trigger: "manual",
        });
      },
      onUpdate(props: any) {
        if (!props.editor.isEditable) {
          return;
        }
        reactRenderer.updateProps(props);

        popup[0].setProps({
          getReferenceClientRect: props.clientRect,
        });
      },
      onKeyDown(props: any) {
        if (props.event.key === "Escape") {
          popup[0].hide();

          return true;
        }

        return (reactRenderer.ref as any).onKeyDown(props);
      },
      onExit() {
        popup[0].destroy();
        reactRenderer.destroy();
      },
    };
  },
});

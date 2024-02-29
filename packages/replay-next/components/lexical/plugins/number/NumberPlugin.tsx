import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $rootTextContent } from "@lexical/text";
import { mergeRegister } from "@lexical/utils";
import {
  $createTextNode,
  COMMAND_PRIORITY_LOW,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
  TextNode,
} from "lexical";
import { useEffect, useRef } from "react";

import { parseNumberFromTextContent } from "replay-next/components/lexical/plugins/number/utils/parseNumberFromTextContent";
import { updateEditorValue } from "replay-next/components/lexical/plugins/number/utils/updateEditorValue";

import { UpdateListener } from "lexical/LexicalEditor";

export default function NumberPlugin({
  defaultValue,
  maxValue,
  minValue,
  step,
}: {
  defaultValue: number;
  maxValue?: number;
  minValue?: number;
  step: number;
}): null {
  const [editor] = useLexicalComposerContext();

  const committedValuesRef = useRef<{
    defaultValue: number;
    maxValue?: number;
    minValue?: number;
    step: number;
  }>({
    defaultValue,
    maxValue,
    minValue,
    step,
  });
  useEffect(() => {
    committedValuesRef.current.defaultValue = defaultValue;
    committedValuesRef.current.maxValue = maxValue;
    committedValuesRef.current.minValue = minValue;
    committedValuesRef.current.step = step;
  });

  useEffect(() => {
    function onArrowDownCommand(event: KeyboardEvent) {
      const { defaultValue, maxValue, minValue, step } = committedValuesRef.current;

      if (minValue == null) {
        return false;
      }

      let result = false;

      editor.update(() => {
        let number = parseNumberFromTextContent({
          defaultValue,
          maxValue,
          minValue,
          step,
          textContent: $rootTextContent(),
        });

        if (number > minValue) {
          number = Math.max(minValue, number - step);

          updateEditorValue(editor, number);

          event.preventDefault();

          result = true;
        }
      });

      return result;
    }

    function onArrowUpCommand(event: KeyboardEvent) {
      const { defaultValue, maxValue, minValue, step } = committedValuesRef.current;

      if (maxValue == null) {
        return false;
      }

      let result = false;

      editor.update(() => {
        let number = parseNumberFromTextContent({
          defaultValue,
          maxValue,
          minValue,
          step,
          textContent: $rootTextContent(),
        });

        if (number < maxValue) {
          number = Math.min(maxValue, number + step);

          updateEditorValue(editor, number);

          event.preventDefault();

          result = true;
        }
      });

      return result;
    }

    function onTextNodeTransform(node: TextNode) {
      const { defaultValue, maxValue, minValue, step } = committedValuesRef.current;

      if (minValue == null && maxValue == null) {
        return;
      } else if (!node.isAttached()) {
        return false;
      }

      const textContent = node.getTextContent() ?? "";
      const number = parseNumberFromTextContent({
        defaultValue,
        maxValue,
        minValue,
        step,
        textContent,
      });

      const stringValue = "" + number;
      if (stringValue !== textContent) {
        const newNode = $createTextNode(stringValue);
        node.replace(newNode);
      }
    }

    function onUpdate({ editorState, prevEditorState }: Parameters<UpdateListener>[0]) {
      const value = editorState.read(() => {
        return $rootTextContent();
      });
      if (value === "") {
        const prevValue = prevEditorState.read(() => {
          return $rootTextContent();
        });

        if (prevValue !== "") {
          editor.update(() => {
            editor.setEditorState(prevEditorState);
          });
        }
      }
    }

    return mergeRegister(
      editor.registerCommand(KEY_ARROW_DOWN_COMMAND, onArrowDownCommand, COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_ARROW_UP_COMMAND, onArrowUpCommand, COMMAND_PRIORITY_LOW),
      editor.registerNodeTransform(TextNode, onTextNodeTransform),
      editor.registerUpdateListener(onUpdate)
    );
  }, [editor]);

  return null;
}

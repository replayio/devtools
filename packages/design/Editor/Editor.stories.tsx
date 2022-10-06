import { Meta } from "@storybook/react";
import { Editor } from "design";

export default {
  title: "Components/Editor",
  component: Editor,
} as Meta;

export function BasicUsage() {
  return (
    <div>
      <Editor />
    </div>
  );
}

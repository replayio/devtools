import { Meta, Story } from "@storybook/react";
import { SourceOutline } from "devtools/client/debugger/src/components/SourceOutline/SourceOutline";
import React, { ComponentProps } from "react";

import symbols from "../fixtures/symbols";
import "devtools/client/debugger/src/components/SourceOutline/Outline.css";
import "devtools/client/debugger/src/components/shared/PreviewFunction.css";

export default {
  argTypes: {},
  component: SourceOutline,
  title: "Soure Outline/Outline",
} as Meta;

const Template: Story<ComponentProps<typeof SourceOutline>> = args => (
  <div className="h-80 w-80 border-2 p-2">
    <SourceOutline {...args} />
  </div>
);

export const Basic = Template.bind({});

Basic.args = {
  cursorPosition: {
    column: 2,
    line: 264,
    sourceId: "pp123",
  },
  selectedSource: {
    id: "pp123",
    url: "pretty-source.js",
  },
  symbols,
};

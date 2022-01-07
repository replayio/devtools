import React, { ComponentProps } from "react";

import { Meta, Story } from "@storybook/react";
import { SourceOutline } from "devtools/client/debugger/src/components/SourceOutline/SourceOutline";
import symbols from "../fixtures/symbols";
import "devtools/client/debugger/src/components/SourceOutline/Outline.css";
import "devtools/client/debugger/src/components/shared/PreviewFunction.css";

export default {
  title: "Soure Outline/Outline",
  component: SourceOutline,
  argTypes: {},
} as Meta;

const Template: Story<ComponentProps<typeof SourceOutline>> = args => (
  <div className="border-2 p-2 h-80 w-80">
    <SourceOutline {...args} />
  </div>
);

export const Basic = Template.bind({});

Basic.args = {
  cursorPosition: {
    sourceId: "pp123",
    line: 264,
    column: 2,
  },
  selectedSource: {
    id: "pp123",
    url: "pretty-source.js",
  },
  symbols,
};

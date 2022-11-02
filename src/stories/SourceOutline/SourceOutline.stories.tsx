import "devtools/client/debugger/src/components/SourceOutline/Outline.css";
import "devtools/client/debugger/src/components/shared/PreviewFunction.css";
import { Meta, Story } from "@storybook/react";
import React, { ComponentProps } from "react";

import { SourceOutline } from "devtools/client/debugger/src/components/SourceOutline/SourceOutline";
import { SymbolDeclarations } from "devtools/client/debugger/src/reducers/ast";

import symbols from "../fixtures/symbols";

export default {
  title: "Soure Outline/Outline",
  component: SourceOutline,
  argTypes: {},
} as Meta;

const Template: Story<ComponentProps<typeof SourceOutline>> = args => (
  <div className="h-80 w-80 border-2 p-2">
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
  // @ts-expect-error missing a bunch of fields
  selectedSource: {
    id: "pp123",
    url: "pretty-source.js",
  },
  symbols: {
    id: "some-source-id",
    status: "loaded" as any,
    symbols: symbols as unknown as SymbolDeclarations,
  },
};

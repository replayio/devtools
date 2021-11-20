import React, { ComponentProps } from "react";

import { Meta, Story } from "@storybook/react";
import { SourceOutline } from "../../devtools/client/debugger/src/components/PrimaryPanes/SourceOutline";

export default {
  title: "Soure Outline/Outline",
  component: SourceOutline,
  argTypes: {
    onSelectLocation: {
      action: "location selected",
    },
  },
} as Meta;

const Template: Story<ComponentProps<typeof SourceOutline>> = args => (
  <div className="border-2 p-2">
    <SourceOutline {...args} style={{ height: 400 }} />
  </div>
);

export const Basic = Template.bind({});

Basic.args = {
  symbols: {
    functions: [
      {
        name: "filterOutlineItem",
        klass: null,
        location: { start: { line: 36, column: 26 }, end: { line: 48, column: 1 } },
        parameterNames: ["name", "filter"],
      },
      {
        name: "isVisible",
        klass: null,
        location: { start: { line: 51, column: 0 }, end: { line: 57, column: 1 } },
        parameterNames: ["element", "parent"],
      },
      {
        name: "constructor",
        klass: "Outline",
        location: { start: { line: 62, column: 2 }, end: { line: 66, column: 3 } },
        parameterNames: ["props"],
      },
      {
        name: "componentDidUpdate",
        klass: "Outline",
        location: { start: { line: 68, column: 2 }, end: { line: 87, column: 3 } },
        parameterNames: ["prevProps", "prevState"],
      },
      {
        name: "setFocus",
        klass: "Outline",
        location: { start: { line: 89, column: 2 }, end: { line: 94, column: 3 } },
        parameterNames: ["cursorPosition"],
      },
      {
        name: "selectItem",
        klass: "Outline",
        location: { start: { line: 96, column: 2 }, end: { line: 109, column: 3 } },
        parameterNames: ["selectedItem"],
      },
      {
        name: "onContextMenu",
        klass: "Outline",
        location: { start: { line: 111, column: 2 }, end: { line: 143, column: 3 } },
        parameterNames: ["event", "func"],
      },
      {
        name: "click",
        klass: "Outline",
        location: { start: { line: 132, column: 13 }, end: { line: 139, column: 7 } },
        parameterNames: [],
      },
      {
        name: "updateFilter",
        klass: "Outline",
        location: { start: { line: 145, column: 17 }, end: { line: 147, column: 3 } },
        parameterNames: ["filter"],
      },
      {
        name: "renderPlaceholder",
        klass: "Outline",
        location: { start: { line: 149, column: 2 }, end: { line: 153, column: 3 } },
        parameterNames: [],
      },
      {
        name: "renderLoading",
        klass: "Outline",
        location: { start: { line: 155, column: 2 }, end: { line: 163, column: 3 } },
        parameterNames: [],
      },
      {
        name: "renderFunction",
        klass: "Outline",
        location: { start: { line: 165, column: 2 }, end: { line: 191, column: 3 } },
        parameterNames: ["func"],
      },
      {
        name: "anonymous",
        klass: "Outline",
        location: { start: { line: 174, column: 13 }, end: { line: 178, column: 9 } },
        parameterNames: ["el"],
      },
      {
        name: "anonymous",
        klass: "Outline",
        location: { start: { line: 179, column: 17 }, end: { line: 182, column: 9 } },
        parameterNames: [],
      },
      {
        name: "anonymous",
        klass: "Outline",
        location: { start: { line: 183, column: 23 }, end: { line: 183, column: 55 } },
        parameterNames: ["e"],
      },
      {
        name: "renderClassHeader",
        klass: "Outline",
        location: { start: { line: 193, column: 2 }, end: { line: 199, column: 3 } },
        parameterNames: ["klass"],
      },
      {
        name: "renderClassFunctions",
        klass: "Outline",
        location: { start: { line: 201, column: 2 }, end: { line: 237, column: 3 } },
        parameterNames: ["klass", "functions"],
      },
      {
        name: "anonymous",
        klass: "Outline",
        location: { start: { line: 209, column: 37 }, end: { line: 209, column: 64 } },
        parameterNames: ["func"],
      },
      {
        name: "anonymous",
        klass: "Outline",
        location: { start: { line: 210, column: 44 }, end: { line: 210, column: 72 } },
        parameterNames: ["func"],
      },
      {
        name: "anonymous",
        klass: "Outline",
        location: { start: { line: 211, column: 43 }, end: { line: 211, column: 64 } },
        parameterNames: ["c"],
      },
      {
        name: "anonymous",
        klass: "Outline",
        location: { start: { line: 219, column: 13 }, end: { line: 223, column: 9 } },
        parameterNames: ["el"],
      },
      {
        name: "anonymous",
        klass: "Outline",
        location: { start: { line: 228, column: 19 }, end: { line: 228, column: 46 } },
        parameterNames: [],
      },
      {
        name: "anonymous",
        klass: "Outline",
        location: { start: { line: 233, column: 30 }, end: { line: 233, column: 63 } },
        parameterNames: ["func"],
      },
      {
        name: "renderFunctions",
        klass: "Outline",
        location: { start: { line: 239, column: 2 }, end: { line: 262, column: 3 } },
        parameterNames: ["functions"],
      },
      {
        name: "anonymous",
        klass: "Outline",
        location: { start: { line: 241, column: 37 }, end: { line: 241, column: 55 } },
        parameterNames: ["func"],
      },
      {
        name: "anonymous",
        klass: "Outline",
        location: { start: { line: 243, column: 6 }, end: { line: 243, column: 97 } },
        parameterNames: ["func"],
      },
      {
        name: "anonymous",
        klass: "Outline",
        location: { start: { line: 247, column: 6 }, end: { line: 247, column: 66 } },
        parameterNames: ["func"],
      },
      {
        name: "anonymous",
        klass: "Outline",
        location: { start: { line: 258, column: 28 }, end: { line: 258, column: 61 } },
        parameterNames: ["func"],
      },
      {
        name: "anonymous",
        klass: "Outline",
        location: { start: { line: 259, column: 21 }, end: { line: 259, column: 78 } },
        parameterNames: ["klass"],
      },
      {
        name: "testing",
        klass: "Test",
        location: { start: { line: 259, column: 21 }, end: { line: 259, column: 78 } },
        parameterNames: ["klass"],
      },
      {
        name: "renderFooter",
        klass: "Outline",
        location: { start: { line: 264, column: 2 }, end: { line: 277, column: 3 } },
        parameterNames: [],
      },
      {
        name: "render",
        klass: "Outline",
        location: { start: { line: 279, column: 2 }, end: { line: 306, column: 3 } },
        parameterNames: [],
      },
      {
        name: "anonymous",
        klass: "Outline",
        location: { start: { line: 291, column: 54 }, end: { line: 291, column: 86 } },
        parameterNames: ["func"],
      },
      {
        name: "mapStateToProps",
        klass: null,
        location: { start: { line: 309, column: 24 }, end: { line: 326, column: 1 } },
        parameterNames: ["state"],
      },
      {
        name: "getFunctionText",
        klass: null,
        location: { start: { line: 318, column: 21 }, end: { line: 324, column: 5 } },
        parameterNames: ["line"],
      },
    ],
    classes: [
      {
        name: "Outline",
        location: { start: { line: 59, column: 7 }, end: { line: 307, column: 1 } },
      },
      {
        name: "Test",
        location: { start: { line: 59, column: 7 }, end: { line: 307, column: 1 } },
      },
    ],
    loading: false,
  },
};

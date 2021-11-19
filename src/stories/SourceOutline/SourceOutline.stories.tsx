import React, { ComponentProps } from "react";

import { Meta, Story } from "@storybook/react";

const SourceOutline = () => <div>cool story, bro</div>;

export default {
  title: "Soure Outline/Outline",
  component: SourceOutline,
} as Meta;

const Template: Story<ComponentProps<typeof SourceOutline>> = args => <SourceOutline />;

export const Basic = Template.bind({});

import React, { ComponentProps } from "react";

import { Story, Meta } from "@storybook/react";

import Status from "ui/components/NetworkMonitor/Status";

export default {
  title: "Network Monitor/Status",
  component: Status,
} as Meta;

const Template: Story<ComponentProps<typeof Status>> = args => <Status {...args} />;

export const Success = Template.bind({});
Success.args = { value: 200 };

export const Failure = Template.bind({});
Failure.args = { value: 500 };

export const Ignored = Template.bind({});
Ignored.args = { value: 301 };

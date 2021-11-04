import React, { ComponentProps } from "react";

import { Story, Meta } from "@storybook/react";

import Status from "ui/components/NetworkMonitor/Status";

export default {
  title: "Network Monitor/Status",
  component: Status,
} as Meta;

const store = {};

const Template: Story<ComponentProps<typeof Status>> = args => <Status {...args} />;

export const Success = Template.bind({});
Success.args = {
  status: 200,
  family: "SUCCESS",
};

export const Failure = Template.bind({});
Failure.args = {
  status: 500,
  family: "FAILURE",
};

export const Ignored = Template.bind({});
Ignored.args = {
  status: 301,
  family: "IGNORED",
};

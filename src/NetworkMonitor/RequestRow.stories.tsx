import React, { ComponentProps } from "react";

import { Story, Meta } from "@storybook/react";

import RequestRow from "ui/components/NetworkMonitor/RequestRow";

export default {
  title: "Network Monitor/Request Row",
  component: RequestRow,
} as Meta;

const store = {};

const Template: Story<ComponentProps<typeof RequestRow>> = args => <RequestRow {...args} />;

export const Success = Template.bind({});
Success.args = {
  events: [],
};

import { Story, Meta } from "@storybook/react";
import React, { ComponentProps } from "react";
import NetworkMonitor from "ui/components/NetworkMonitor";

import { requestProps } from "./utils";

export default {
  component: NetworkMonitor,
  title: "Network Monitor/Network Monitor",
} as Meta;

const Template: Story<ComponentProps<typeof NetworkMonitor>> = args => <NetworkMonitor {...args} />;

const requests = [
  requestProps("1", "https://app.replay.io/graphql", 200),
  requestProps("2", "https://app.replay.io/graphql", 500, "POST"),
  requestProps("3", "https://www.replay.io", 301),
  requestProps("4", "https://app.replay.io/graphql", 400),
];

export const Basic = Template.bind({});

Basic.args = {
  currentTime: 3,
  events: requests.flatMap(r => r.events),
  requests: requests.map(r => r.info),
};

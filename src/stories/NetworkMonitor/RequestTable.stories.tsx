import React, { ComponentProps } from "react";

import { Story, Meta } from "@storybook/react";

import RequestTable from "ui/components/NetworkMonitor/RequestTable";
import { requestProps } from "./utils";

export default {
  title: "Network Monitor/Request Table",
  component: RequestTable,
} as Meta;

const store = {};

const Template: Story<ComponentProps<typeof RequestTable>> = args => <RequestTable {...args} />;

export const Loaded = Template.bind({});
const requests = [
  requestProps("1", "https://app.replay.io/graphql", 200),
  requestProps("2", "https://app.replay.io/graphql", 500, "POST"),
  requestProps("3", "https://www.replay.io", 301),
  requestProps("4", "https://app.replay.io/graphql", 400),
];
Loaded.args = {
  currentTime: 3,
  events: requests.flatMap(r => r.events),
  requests: requests.map(r => r.info),
};

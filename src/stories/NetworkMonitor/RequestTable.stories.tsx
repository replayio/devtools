import { Story, Meta } from "@storybook/react";
import React, { ComponentProps } from "react";
import RequestTable from "ui/components/NetworkMonitor/RequestTable";

import { requestSummary } from "./utils";

export default {
  component: RequestTable,
  title: "Network Monitor/Request Table",
} as Meta;

const Template: Story<ComponentProps<typeof RequestTable>> = args => <RequestTable {...args} />;

export const Loaded = Template.bind({});

const requests = [
  requestSummary("1", "https://app.replay.io/graphql", 200),
  requestSummary("2", "https://app.replay.io/graphql", 500, "POST"),
  requestSummary("3", "https://www.replay.io", 301),
  requestSummary("4", "https://app.replay.io/graphql", 400),
];

Loaded.args = {
  currentTime: 3,
  data: requests,
  seek: (point: string, time: number, hasFrames: boolean, pauseId?: string | undefined) => false,
};

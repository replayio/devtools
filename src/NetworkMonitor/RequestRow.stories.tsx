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
  events: [
    {
      event: {
        kind: "request",
        requestUrl: "https://replay.io",
        requestMethod: "GET",
        requestHeaders: [],
        requestCause: "app.js:31",
      },
      id: "1",
      time: 0,
    },
    {
      event: {
        kind: "response",
        responseFromCache: false,
        responseHeaders: [],
        responseProtocolVersion: "1",
        responseStatus: 200,
        responseStatusText: "success",
      },
      id: "2",
      time: 0,
    },
  ],
};

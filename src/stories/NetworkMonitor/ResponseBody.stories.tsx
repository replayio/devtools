import React, { ComponentProps } from "react";
import { Story, Meta } from "@storybook/react";
import { _ResponseBody as ResponseBody } from "ui/components/NetworkMonitor/ResponseBody";
import { requestSummary } from "./utils";

export default {
  title: "Network Monitor/Response Body",
  component: ResponseBody,
} as Meta;

const Template: Story<ComponentProps<typeof ResponseBody>> = args => <ResponseBody {...args} />;

export const Basic = Template.bind({});

const request = requestSummary("1", "https://app.replay.io/graphql", 200);

Basic.args = {
  request,
  responseBodyParts: [
    {
      length: 16,
      offset: 0,
      value: "eyJqc29uIjogImRhdGEifQ==",
    },
  ],
};

export const Text = Template.bind({});

const textRequest = requestSummary("1", "https://app.replay.io/graphql", 200, "GET", "text/plain");

Text.args = {
  request: textRequest,
  responseBodyParts: [
    {
      length: 16,
      offset: 0,
      value: "eyJqc29uIjogImRhdGEifQ==",
    },
  ],
};

export const Multipart = Template.bind({});

const multipartRequest = requestSummary(
  "1",
  "https://app.replay.io/graphql",
  200,
  "GET",
  "application/json"
);

Multipart.args = {
  request: multipartRequest,
  responseBodyParts: [
    {
      length: 7,
      offset: 0,
      value: "eyJqc29uIjo=",
    },
    {
      length: 8,
      offset: 0,
      value: "ICJkYXRhIn0=",
    },
  ],
};

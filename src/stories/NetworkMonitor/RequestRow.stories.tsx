import React, { ComponentProps } from "react";

import { Story, Meta } from "@storybook/react";

import RequestRow from "ui/components/NetworkMonitor/RequestRow";
import { EventsFilter } from "ui/components/Views/NonDevView";
import { eventsFor } from "./utils";

export default {
  title: "Network Monitor/Request Row",
  component: RequestRow,
} as Meta;

const store = {};

const Template: Story<ComponentProps<typeof RequestRow>> = args => <RequestRow {...args} />;

export const Success = Template.bind({});
Success.args = { events: eventsFor("https://replay.io", 200) };
export const Failure = Template.bind({});
Failure.args = { events: eventsFor("https://replay.io", 500) };
export const Ignored = Template.bind({});
Ignored.args = { events: eventsFor("https://replay.io", 301) };

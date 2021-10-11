import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";

import { SubscriptionDetailsView } from "ui/components/shared/WorkspaceSettingsModal/SubscriptionDetailsView";

export default {
  title: "Example/SubscriptionDetailsView",
  component: SubscriptionDetailsView,
} as ComponentMeta<typeof SubscriptionDetailsView>;

const Template: ComponentStory<typeof SubscriptionDetailsView> = args => (
  <SubscriptionDetailsView {...args} />
);

export const LoggedIn = Template.bind({});
LoggedIn.args = {};

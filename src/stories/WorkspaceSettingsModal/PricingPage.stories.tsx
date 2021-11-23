import React, { ComponentProps } from "react";

import { Story, Meta } from "@storybook/react";

import { WorkspaceSubscriptionStatus } from "ui/types";
import { PricingPage } from "ui/components/shared/WorkspaceSettingsModal/PricingPage";

export default {
  title: "Workspace Settings Modal/Plan Details",
  component: PricingPage,
} as Meta;

const Template: Story<ComponentProps<typeof PricingPage>> = args => <PricingPage {...args} />;

export const Team = Template.bind({});

Team.args = {
  subscription: {
    billingSchedule: "monthly",
    createdAt: new Date().toISOString(),
    createdBy: { name: "test", id: "test", internal: false, picture: "" },
    displayName: "Team",
    effectiveFrom: "2021-11-23T03:09:12.082Z",
    effectiveUntil: "2021-12-23T03:09:12.000Z",
    id: "1",
    paymentMethods: [],
    seatCount: 5,
    seatPrice: 20,
    status: WorkspaceSubscriptionStatus.Trial,
    trial: true,
    trialEnds: "2021-12-23T03:09:12.000Z",
    plan: {
      createdAt: new Date().toISOString(),
      id: "1",
      key: "team-v1",
      name: "team",
    },
  },
};

export const Organization = Template.bind({});

Organization.args = {
  subscription: {
    billingSchedule: "monthly",
    createdAt: new Date().toISOString(),
    createdBy: { name: "test", id: "test", internal: false, picture: "" },
    displayName: "Organization",
    effectiveFrom: "2021-11-23T03:09:12.082Z",
    effectiveUntil: "2021-12-23T03:09:12.000Z",
    id: "1",
    paymentMethods: [],
    seatCount: 10,
    seatPrice: 75,
    status: WorkspaceSubscriptionStatus.Trial,
    trial: true,
    trialEnds: "2021-12-23T03:09:12.000Z",
    plan: {
      createdAt: new Date().toISOString(),
      id: "1",
      key: "org-v1",
      name: "org",
    },
  },
};

export const BetaTester = Template.bind({});

BetaTester.args = {
  subscription: {
    createdAt: new Date().toISOString(),
    createdBy: { name: "test", id: "test", internal: false, picture: "" },
    displayName: "Beta Tester Appreciation",
    effectiveFrom: "2021-11-23T03:09:12.082Z",
    effectiveUntil: "2021-12-23T03:09:12.000Z",
    id: "1",
    paymentMethods: [],
    seatCount: 10,
    seatPrice: 75,
    status: WorkspaceSubscriptionStatus.Trial,
    trial: true,
    trialEnds: "2021-12-23T03:09:12.000Z",
    plan: {
      createdAt: new Date().toISOString(),
      id: "1",
      key: "beta-v1",
      name: "beta",
    },
  },
};

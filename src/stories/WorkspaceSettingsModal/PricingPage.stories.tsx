import { Story, Meta } from "@storybook/react";
import React, { ComponentProps } from "react";
import { PricingPage } from "ui/components/shared/WorkspaceSettingsModal/PricingPage";
import { WorkspaceSubscriptionStatus } from "ui/types";

export default {
  component: PricingPage,
  title: "Workspace Settings Modal/Plan Details",
} as Meta;

const Template: Story<ComponentProps<typeof PricingPage>> = args => <PricingPage {...args} />;

export const Team = Template.bind({});

Team.args = {
  subscription: {
    billingSchedule: "monthly",
    createdAt: new Date().toISOString(),
    createdBy: { id: "test", internal: false, name: "test", picture: "" },
    discount: 0,
    displayName: "Team",
    effectiveFrom: "2021-11-23T03:09:12.082Z",
    effectiveUntil: "2021-12-23T03:09:12.000Z",
    id: "1",
    paymentMethods: [],
    plan: {
      createdAt: new Date().toISOString(),
      id: "1",
      key: "team-v1",
      name: "team",
    },
    seatCount: 5,
    seatPrice: 20,
    status: WorkspaceSubscriptionStatus.Trial,
    trial: true,
    trialEnds: "2021-12-23T03:09:12.000Z",
  },
};

export const Organization = Template.bind({});

Organization.args = {
  subscription: {
    billingSchedule: "monthly",
    createdAt: new Date().toISOString(),
    createdBy: { id: "test", internal: false, name: "test", picture: "" },
    discount: 0,
    displayName: "Organization",
    effectiveFrom: "2021-11-23T03:09:12.082Z",
    effectiveUntil: "2021-12-23T03:09:12.000Z",
    id: "1",
    paymentMethods: [],
    plan: {
      createdAt: new Date().toISOString(),
      id: "1",
      key: "org-v1",
      name: "org",
    },
    seatCount: 10,
    seatPrice: 75,
    status: WorkspaceSubscriptionStatus.Trial,
    trial: true,
    trialEnds: "2021-12-23T03:09:12.000Z",
  },
};

export const BetaTester = Template.bind({});

BetaTester.args = {
  subscription: {
    billingSchedule: null,
    createdAt: new Date().toISOString(),
    createdBy: { id: "test", internal: false, name: "test", picture: "" },
    discount: 0,
    displayName: "Beta Tester Appreciation",
    effectiveFrom: "2021-11-23T03:09:12.082Z",
    effectiveUntil: "2021-12-23T03:09:12.000Z",
    id: "1",
    paymentMethods: [],
    plan: {
      createdAt: new Date().toISOString(),
      id: "1",
      key: "beta-v1",
      name: "beta",
    },
    seatCount: 10,
    seatPrice: 75,
    status: WorkspaceSubscriptionStatus.Trial,
    trial: true,
    trialEnds: "2021-12-23T03:09:12.000Z",
  },
};

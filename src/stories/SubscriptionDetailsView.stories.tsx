import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";

import { WorkspaceSubscriptionContainer } from "ui/components/shared/WorkspaceSettingsModal/WorkspaceSubscriptionContainer";

export default {
  title: "Example/WorkspaceSubscription",
  component: WorkspaceSubscriptionContainer,
} as ComponentMeta<typeof WorkspaceSubscriptionContainer>;

const Template: ComponentStory<typeof WorkspaceSubscriptionContainer> = args => (
  <div className="settings-modal settings-modal-large">
    <div className="modal-container">
      <div className="modal-content text-sm">
        <main className="text-sm">
          <WorkspaceSubscriptionContainer {...args} />
        </main>
      </div>
    </div>
  </div>
);

export const Trialing = Template.bind({});
Trialing.args = {
  setView: () => {},
  workspaceId: "",
  view: "details",
  subscription: {
    __typename: "WorkspaceSubscription",
    id: "d3M6NGYxYzcwOGEtMmJlMC00YWY4LTg5NDQtMmI1ZjhiNTA1MTBh",
    createdAt: "2021-10-07T04:10:16.520Z",
    effectiveFrom: "2021-10-07T04:10:17.649Z",
    effectiveUntil: "null",
    status: "trialing",
    trialEnds: "2021-11-06T04:10:17.000Z",
    seatCount: 1,
    paymentMethods: [],
    plan: {
      __typename: "Plan",
      key: "team-v1",
    },
  },
};

export const BetaV1 = Template.bind({});
BetaV1.args = {
  setView: () => {},
  workspaceId: "",
  view: "details",
  subscription: {
    __typename: "WorkspaceSubscription",
    id: "d3M6NGYxYzcwOGEtMmJlMC00YWY4LTg5NDQtMmI1ZjhiNTA1MTBh",
    createdAt: "2021-10-07T04:10:16.520Z",
    effectiveFrom: "2021-10-07T04:10:17.649Z",
    effectiveUntil: "null",
    status: "trialing",
    trialEnds: "2021-11-06T04:10:17.000Z",
    seatCount: 1,
    paymentMethods: [],
    plan: {
      __typename: "Plan",
      key: "beta-v1",
    },
  },
};

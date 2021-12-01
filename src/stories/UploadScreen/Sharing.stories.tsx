import React, { ComponentProps } from "react";

import { Story, Meta } from "@storybook/react";
import Sharing from "ui/components/UploadScreen/Sharing";
import { getDefaultOrganizationSettings } from "ui/utils/org";

export default {
  title: "UploadScreen/Sharing",
  component: Sharing,
} as Meta;

const Template: Story<ComponentProps<typeof Sharing>> = args => (
  <Sharing {...args} setSelectedWorkspaceId={console.log} setIsPublic={console.log} />
);

export const OnlyMyLibrary = Template.bind({});

OnlyMyLibrary.args = {
  workspaces: [],
  selectedWorkspaceId: "My Library",
  isPublic: false,
};

export const OnlyOrganization = Template.bind({});

OnlyOrganization.args = {
  isPublic: false,
  selectedWorkspaceId: "org1",
  workspaces: [
    {
      id: "org1",
      name: "Organization",
      isOrganization: true,
      settings: getDefaultOrganizationSettings(),
      isDomainLimitedCode: false,
      domain: "domain.com",
      hasPaymentMethod: false,
      invitationCode: "",
    },
  ],
};

export const OrgLibraryDisabled = Template.bind({});

OrgLibraryDisabled.args = {
  isPublic: false,
  selectedWorkspaceId: "org1",
  workspaces: [
    {
      id: "org1",
      name: "Organization",
      isOrganization: true,
      settings: {
        features: {
          user: {
            library: false,
          },
          recording: {
            public: true,
          },
        },
        motd: null,
      },
      isDomainLimitedCode: false,
      domain: "domain.com",
      hasPaymentMethod: false,
      invitationCode: "",
    },
  ],
};

export const OrgPublicDisabled = Template.bind({});

OrgPublicDisabled.args = {
  isPublic: false,
  selectedWorkspaceId: "org1",
  workspaces: [
    {
      id: "org1",
      name: "Organization",
      isOrganization: true,
      settings: {
        features: {
          user: {
            library: true,
          },
          recording: {
            public: false,
          },
        },
        motd: null,
      },
      isDomainLimitedCode: false,
      domain: "domain.com",
      hasPaymentMethod: false,
      invitationCode: "",
    },
  ],
};

export const OrgLibraryAndPublicDisabled = Template.bind({});

OrgLibraryAndPublicDisabled.args = {
  isPublic: false,
  selectedWorkspaceId: "org1",
  workspaces: [
    {
      id: "org1",
      name: "Organization",
      isOrganization: true,
      settings: {
        features: {
          user: {
            library: false,
          },
          recording: {
            public: false,
          },
        },
        motd: null,
      },
      isDomainLimitedCode: false,
      domain: "domain.com",
      hasPaymentMethod: false,
      invitationCode: "",
    },
  ],
};

export const NoOrgs = Template.bind({});

NoOrgs.args = {
  isPublic: false,
  selectedWorkspaceId: "team2",
  workspaces: [
    {
      id: "team1",
      name: "Team 1",
      isOrganization: true,
      settings: getDefaultOrganizationSettings(),
      isDomainLimitedCode: false,
      domain: "domain.com",
      hasPaymentMethod: false,
      invitationCode: "",
    },
    {
      id: "team2",
      name: "Team 2",
      isOrganization: true,
      settings: getDefaultOrganizationSettings(),
      isDomainLimitedCode: false,
      domain: "domain.com",
      hasPaymentMethod: false,
      invitationCode: "",
    },
  ],
};

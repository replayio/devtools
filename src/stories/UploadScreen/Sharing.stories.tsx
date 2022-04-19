import { Story, Meta } from "@storybook/react";
import React, { ComponentProps } from "react";
import Sharing from "ui/components/UploadScreen/Sharing";
import { getDefaultOrganizationSettings } from "ui/utils/org";

export default {
  component: Sharing,
  title: "UploadScreen/Sharing",
} as Meta;

const Template: Story<ComponentProps<typeof Sharing>> = args => (
  <Sharing {...args} setSelectedWorkspaceId={console.log} setIsPublic={console.log} />
);

export const OnlyMyLibrary = Template.bind({});

OnlyMyLibrary.args = {
  isPublic: false,
  selectedWorkspaceId: "My Library",
  workspaces: [],
};

export const OnlyOrganization = Template.bind({});

OnlyOrganization.args = {
  isPublic: false,
  selectedWorkspaceId: "org1",
  workspaces: [
    {
      domain: "domain.com",
      hasPaymentMethod: false,
      id: "org1",
      invitationCode: "",
      isDomainLimitedCode: false,
      isOrganization: true,
      name: "Organization",
      settings: getDefaultOrganizationSettings(),
    },
  ],
};

export const OrgLibraryDisabled = Template.bind({});

OrgLibraryDisabled.args = {
  isPublic: false,
  selectedWorkspaceId: "org1",
  workspaces: [
    {
      domain: "domain.com",
      hasPaymentMethod: false,
      id: "org1",
      invitationCode: "",
      isDomainLimitedCode: false,
      isOrganization: true,
      name: "Organization",
      settings: {
        features: {
          recording: {
            public: true,
          },
          user: {
            autoJoin: null,
            library: false,
          },
        },
        motd: null,
      },
    },
  ],
};

export const OrgPublicDisabled = Template.bind({});

OrgPublicDisabled.args = {
  isPublic: false,
  selectedWorkspaceId: "org1",
  workspaces: [
    {
      domain: "domain.com",
      hasPaymentMethod: false,
      id: "org1",
      invitationCode: "",
      isDomainLimitedCode: false,
      isOrganization: true,
      name: "Organization",
      settings: {
        features: {
          recording: {
            public: false,
          },
          user: {
            autoJoin: null,
            library: true,
          },
        },
        motd: null,
      },
    },
  ],
};

export const OrgLibraryAndPublicDisabled = Template.bind({});

OrgLibraryAndPublicDisabled.args = {
  isPublic: false,
  selectedWorkspaceId: "org1",
  workspaces: [
    {
      domain: "domain.com",
      hasPaymentMethod: false,
      id: "org1",
      invitationCode: "",
      isDomainLimitedCode: false,
      isOrganization: true,
      name: "Organization",
      settings: {
        features: {
          recording: {
            public: false,
          },
          user: {
            autoJoin: null,
            library: false,
          },
        },
        motd: null,
      },
    },
  ],
};

export const NoOrgs = Template.bind({});

NoOrgs.args = {
  isPublic: false,
  selectedWorkspaceId: "team2",
  workspaces: [
    {
      domain: "domain.com",
      hasPaymentMethod: false,
      id: "team1",
      invitationCode: "",
      isDomainLimitedCode: false,
      isOrganization: true,
      name: "Team 1",
      settings: getDefaultOrganizationSettings(),
    },
    {
      domain: "domain.com",
      hasPaymentMethod: false,
      id: "team2",
      invitationCode: "",
      isDomainLimitedCode: false,
      isOrganization: true,
      name: "Team 2",
      settings: getDefaultOrganizationSettings(),
    },
  ],
};

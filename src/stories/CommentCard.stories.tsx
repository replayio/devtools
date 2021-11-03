import React, { ComponentProps } from "react";

import { Story, Meta } from "@storybook/react";

import { CommentCard } from "ui/components/Comments/TranscriptComments/CommentCard";

export default {
  title: "CommentCard",
  component: CommentCard,
} as Meta;

const store = {};

const Template: Story<ComponentProps<typeof CommentCard>> = args => <CommentCard {...args} />;

export const FirstStory = Template.bind({});
FirstStory.args = {
  comment: {
    content: "This is a comment",
    createdAt: new Date().toISOString(),
    hasFrames: false,
    id: "1",
    point: "12345",
    position: null,
    recordingId: "1",
    replies: [],
    sourceLocation: null,
    time: 0,
    updatedAt: new Date().toISOString(),
    user: {
      id: "1",
      internal: false,
      name: "Test User",
      picture:
        "https://lh3.googleusercontent.com/a-/AOh14Ghw9LGVvSNe3vyArbqPQlX-fF23dNgO2GPH5iqaLQ=s96-c",
    },
  },
  comments: [],
};

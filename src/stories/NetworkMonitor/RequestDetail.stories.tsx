import React, { ComponentProps } from "react";

import { Story, Meta } from "@storybook/react";

import RequestDetails from "ui/components/NetworkMonitor/RequestDetails";
import { requestProps } from "./utils";

export default {
  title: "Network Monitor/Request Details",
  component: RequestDetails,
} as Meta;

const Template: Story<ComponentProps<typeof RequestDetails>> = args => (
  <div style={{ height: "300px", overflow: "hidden" }}>
    <RequestDetails {...args} />
  </div>
);

const request = requestProps("1", "https://app.replay.io/graphql", 200);

export const Basic = Template.bind({});

Basic.args = {
  request: {
    domain: "assets.website-files.com",
    end: 984,
    id: "1",
    requestHeaders: [
      { name: "Host", value: "assets.website-files.com" },
      {
        name: "User-Agent",
        value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.16; rv:86.0) Gecko/20100101 Firefox/86.0",
      },
      {
        name: "Accept",
        value: "application/font-woff2;q=1.0,application/font-woff;q=0.9,*/*;q=0.8",
      },
      { name: "Accept-Language", value: "en-US,en;q=0.5" },
      { name: "Accept-Encoding", value: "identity" },
      {
        name: "Referer",
        value:
          "https://assets.website-files.com/613b96978e0f483f60fbb8c0/css/replay-new.2b6f812de.min.css",
      },
      { name: "Origin", value: "https://www.replay.io" },
    ],
    responseHeaders: [
      { name: "content-type", value: "application/octet-stream" },
      { name: "content-length", value: "34616" },
      { name: "date", value: "Sun, 31 Oct 2021 02:21:10 GMT" },
      { name: "access-control-allow-origin", value: "*" },
      { name: "access-control-allow-methods", value: "GET, HEAD" },
      { name: "access-control-max-age", value: "3000" },
      { name: "last-modified", value: "Fri, 10 Sep 2021 17:32:10 GMT" },
      { name: "etag", value: '"788e7c705c377d9e08875341f0e860cb"' },
      { name: "x-amz-server-side-encryption", value: "AES256" },
      { name: "cache-control", value: "max-age=31536000, must-revalidate" },
      { name: "x-amz-version-id", value: "fBeMx982MEOHJMFLP04t2lw.U.zSo4X1" },
      { name: "accept-ranges", value: "bytes" },
      { name: "server", value: "AmazonS3" },
      {
        name: "vary",
        value: "Origin,Access-Control-Request-Headers,Access-Control-Request-Method",
      },
      { name: "x-cache", value: "Hit from cloudfront" },
      { name: "via", value: "1.1 063a9ddbb93cf698306df937132cd318.cloudfront.net (CloudFront)" },
      { name: "x-amz-cf-pop", value: "SFO5-C1" },
      { name: "x-amz-cf-id", value: "QS6mG12CzDHHvoioQG6iRZYbDdju5-BSCkQOxrIIrmldKkXVoqLSCw==" },
      { name: "age", value: "936035" },
      { name: "X-Firefox-Spdy", value: "h2" },
    ],
    method: "GET",
    name: "613b96978e0f48b736fbb935_SpaceGrotesk-Bold.woff2",
    point: { point: "1947111322047004550402308086694092", time: 984 },
    queryParams: [],
    triggerPoint: undefined,
    status: 200,
    start: 984,
    time: 166,
    url: "https://assets.website-files.com/613b96978e0f483f60fbb8c0/613b96978e0f48b736fbb935_SpaceGrotesk-Bold.woff2",
  },
};

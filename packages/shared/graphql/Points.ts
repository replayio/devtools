import { gql } from "@apollo/client";
import { Location, RecordingId } from "@replayio/protocol";

import { Badge } from "shared/client/types";
import { Point } from "shared/client/types";
import { PointBehavior } from "shared/client/types";
import { Point as ClientPoint } from "shared/client/types";
import { AddPoint } from "shared/graphql/generated/AddPoint";
import { GetPoints } from "shared/graphql/generated/GetPoints";
import {
  AddPointInput,
  DeletePointInput,
  UpdatePointInput,
} from "shared/graphql/generated/globalTypes";
import { GraphQLClientInterface } from "shared/graphql/GraphQLClient";
import { UserInfo } from "shared/graphql/types";

export const ADD_POINT_QUERY = gql`
  mutation AddPoint($input: AddPointInput!) {
    addPoint(input: $input) {
      success
    }
  }
`;

export const DELETE_POINT_QUERY = gql`
  mutation DeletePoint($input: DeletePointInput!) {
    deletePoint(input: $input) {
      success
    }
  }
`;

export const GET_POINTS_QUERY = gql`
  query GetPoints($recordingId: UUID!) {
    recording(uuid: $recordingId) {
      uuid
      points {
        badge
        column
        condition
        content
        createdAt
        key
        line
        sourceId
        user {
          id
          name
          picture
        }
      }
    }
  }
`;

export const UPDATE_POINT_QUERY = gql`
  mutation UpdatePointContent($input: UpdatePointInput!) {
    updatePoint(input: $input) {
      success
    }
  }
`;

export async function addPoint(
  graphQLClient: GraphQLClientInterface,
  accessToken: string,
  point: ClientPoint
) {
  const { columnIndex, createdAt, lineNumber, user, ...rest } = point;
  const input: AddPointInput = {
    column: columnIndex,
    line: lineNumber,
    ...rest,
  };

  await graphQLClient.send<AddPoint>(
    {
      operationName: "AddPoint",
      query: ADD_POINT_QUERY,
      variables: {
        input,
      },
    },
    accessToken
  );
}

export async function deletePoint(
  graphQLClient: GraphQLClientInterface,
  accessToken: string,
  point: Point
) {
  const input: DeletePointInput = {
    key: point.key,
  };

  await graphQLClient.send(
    {
      operationName: "DeletePoint",
      query: DELETE_POINT_QUERY,
      variables: { input },
    },
    accessToken
  );
}

export async function getPoints(
  graphQLClient: GraphQLClientInterface,
  recordingId: RecordingId,
  accessToken: string | null
): Promise<ClientPoint[]> {
  const response = await graphQLClient.send<GetPoints>(
    {
      operationName: "GetPoints",
      query: GET_POINTS_QUERY,
      variables: { recordingId },
    },
    accessToken
  );

  const points = response?.recording?.points;

  return (
    points?.map(point => {
      return {
        badge: point.badge as Badge,
        columnIndex: point.column,
        condition: point.condition,
        content: point.content!,
        createdAt: new Date(point.createdAt),
        key: point.key,
        lineNumber: point.line,
        recordingId,
        sourceId: point.sourceId,
        user: point.user,
      };
    }) ?? []
  );
}

export async function updatePoint(
  graphQLClient: GraphQLClientInterface,
  accessToken: string,
  point: ClientPoint
) {
  const input: UpdatePointInput = {
    badge: point.badge,
    condition: point.condition,
    content: point.content,
    key: point.key,
  };

  await graphQLClient.send<GetPoints>(
    {
      operationName: "UpdatePointContent",
      query: UPDATE_POINT_QUERY,
      variables: { input },
    },
    accessToken
  );
}

// Point ID is a virtual attribute;
// It only exists on the client, to simplify equality checks and PointBehavior mapping.
// It is a composite of the source location, created-by user, and recording.
export function createPointKey(
  recordingId: RecordingId,
  userId: string | null,
  location: Location
): string {
  return JSON.stringify({
    column: location.column,
    line: location.line,
    recordingId,
    sourceId: location.sourceId,
    userId: userId,
  });
}

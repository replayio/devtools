import { gql } from "@apollo/client";
import { Location, RecordingId } from "@replayio/protocol";

import { Badge, PointBehavior } from "shared/client/types";
import { Point as ClientPoint } from "shared/client/types";
import { GetPoints } from "shared/graphql/generated/GetPoints";
import { GraphQLClientInterface } from "shared/graphql/GraphQLClient";

import { Point } from "./types";

export const ADD_POINT_QUERY = gql`
  mutation AddPoint($input: AddPointInput!) {
    addPoint(input: $input) {
      success
      point {
        id
      }
    }
  }
`;

export const DELETE_POINT_QUERY = gql`
  mutation DeletePoint($commentId: ID!) {
    deletePoint(input: { id: $commentId }) {
      success
    }
  }
`;

export const GET_POINTS_QUERY = gql`
  query GetPoints($recordingId: UUID!) {
    recording(uuid: $recordingId) {
      uuid
      points {
        id
        user {
          id
        }
        badge
        condition
        content
        createdAt
        location
        shouldBreak
        shouldLog
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
  point: Omit<Point, "id">
) {
  await graphQLClient.send(
    {
      operationName: "AddPoint",
      query: ADD_POINT_QUERY,
      variables: {
        input: point,
      },
    },
    accessToken
  );
}

export async function deletePoint(
  graphQLClient: GraphQLClientInterface,
  accessToken: string,
  id: string
) {
  await graphQLClient.send(
    {
      operationName: "DeletePoint",
      query: DELETE_POINT_QUERY,
      variables: { id },
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
        condition: point.condition,
        content: point.content!,
        createdByUserId: point.user?.id!,
        createdAtTime: new Date(point.createdAt).getTime(),
        id: point.id,
        location: point.location as Location,
        recordingId,
        shouldBreak: point.shouldBreak as PointBehavior,
        shouldLog: point.shouldLog as PointBehavior,
      };
    }) ?? []
  );
}

export async function updatePoint(
  graphQLClient: GraphQLClientInterface,
  accessToken: string,
  point: Point
) {
  await graphQLClient.send<GetPoints>(
    {
      operationName: "UpdatePointContent",
      query: UPDATE_POINT_QUERY,
      variables: point,
    },
    accessToken
  );
}

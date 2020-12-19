import { RecordingId } from "@recordreplay/protocol";
import { gql, useQuery, useMutation, ApolloError } from "@apollo/client";

interface Comment {
  content: "string";
  created_at: "string";
  has_frames: "boolean";
  id: "string";
  point: "string";
  recording_id: "string";
  time: "number";
  updated_at: "string";
  user_id: "string";
  __typename: "string";
}

const GET_COMMENTS = gql`
  query GetComments($recordingId: uuid) {
    comments(where: { recording_id: { _eq: $recordingId } }) {
      id
      content
      created_at
      recording_id
      user_id
      updated_at
      time
      point
      has_frames
    }
  }
`;

const ADD_COMMENT = gql`
  mutation MyMutation($object: comments_insert_input! = {}) {
    insert_comments_one(object: $object) {
      id
    }
  }
`;

const UPDATE_COMMENT_CONTENT = gql`
  mutation UpdateCommentContent($newContent: String, $commentId: uuid) {
    update_comments(_set: { content: $newContent }, where: { id: { _eq: $commentId } }) {
      returning {
        id
        content
      }
    }
  }
`;

const DELETE_COMMENT = gql`
  mutation DeleteComment($commentId: uuid) {
    delete_comments(where: { id: { _eq: $commentId } }) {
      returning {
        id
      }
    }
  }
`;

export function useGetComments(
  recordingId: RecordingId
): { comments: [Comment]; loading: boolean; error?: ApolloError } {
  const { data, loading, error } = useQuery(GET_COMMENTS, {
    variables: { recordingId },
  });

  return { comments: data?.comments, loading, error };
}

export function useAddComment(callback: Function) {
  const [addComment] = useMutation(ADD_COMMENT, {
    onCompleted: data => {
      const { id } = data.insert_comments_one;
      callback(id);
    },
    refetchQueries: ["GetComments"],
  });

  return addComment;
}

export function useUpdateComment(callback: Function) {
  const [updateCommentContent] = useMutation(UPDATE_COMMENT_CONTENT, {
    onCompleted: () => callback(),
  });

  return updateCommentContent;
}

export function useDeleteComment(callback: Function) {
  const [deleteComment] = useMutation(DELETE_COMMENT, {
    refetchQueries: ["GetComments"],
  });

  return deleteComment;
}

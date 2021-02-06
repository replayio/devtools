import { RecordingId } from "@recordreplay/protocol";
import { gql, useQuery, useMutation, ApolloError } from "@apollo/client";
import { Comment } from "ui/state/app";

const GET_COMMENTS = gql`
  query GetComments($recordingId: uuid) {
    comments(
      where: { recording_id: { _eq: $recordingId }, _and: { parent_id: { _is_null: true } } }
    ) {
      id
      content
      created_at
      updated_at
      user_id
      has_frames
      time
      point
      position
      user {
        picture
        name
        auth_id
      }
      replies(order_by: { created_at: asc }) {
        id
        content
        created_at
        updated_at
        user_id
        has_frames
        time
        point
        position
        user {
          picture
          name
          auth_id
        }
      }
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
  mutation UpdateCommentContent($newContent: String, $commentId: uuid, $position: jsonb) {
    update_comments(
      _set: { content: $newContent, position: $position }
      where: { id: { _eq: $commentId } }
    ) {
      returning {
        id
        content
        position
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

const DELETE_COMMENT_REPLIES = gql`
  mutation DeleteCommentReplies($parentId: uuid) {
    delete_comments(where: { parent_id: { _eq: $parentId } }) {
      returning {
        id
      }
    }
  }
`;

export function useGetComments(
  recordingId: RecordingId
): { comments: Comment[]; loading: boolean; error?: ApolloError } {
  const { data, loading, error } = useQuery(GET_COMMENTS, {
    variables: { recordingId },
    pollInterval: 5000,
  });

  // This gives us some basic logging for when there's a problem
  // while fetching the comments.
  if (error) {
    console.error("Apollo error while fetching comments:", error);
  }

  return { comments: data?.comments || [], loading, error };
}

export function useAddComment(callback: Function = () => {}) {
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

export function useDeleteCommentReplies(callback: Function) {
  const [deleteCommentReplies] = useMutation(DELETE_COMMENT_REPLIES, {
    refetchQueries: ["GetComments"],
  });

  return deleteCommentReplies;
}

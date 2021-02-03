import { RecordingId } from "@recordreplay/protocol";
import { gql, useQuery, useMutation, ApolloError } from "@apollo/client";
import { Comment } from "ui/state/app";

const GET_COMMENTS = gql`
  query GetComments($recordingId: uuid) {
    comments(where: { recording_id: { _eq: $recordingId } }) {
      id
      content
      created_at
      recording_id
      parent_id
      user_id
      user {
        picture
        name
        auth_id
      }
      updated_at
      time
      point
      has_frames
      position
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
  mutation UpdateCommentContent($newContent: String, $commentId: uuid, $position: String) {
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

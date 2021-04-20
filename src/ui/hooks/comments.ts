import { RecordingId } from "@recordreplay/protocol";
import { gql, useQuery, useMutation, ApolloError } from "@apollo/client";
import { query } from "ui/utils/apolloClient";
import { Comment } from "ui/state/comments";

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

const NO_COMMENTS: Comment[] = [];

export function useGetComments(
  recordingId: RecordingId
): { comments: Comment[]; loading: boolean; error?: ApolloError } {
  const { data, loading, error } = useQuery(
    gql`
      fragment commentFields on comments {
        id
        content
        created_at
        updated_at
        user_id
        has_frames
        source_location
        time
        parent_id
        point
        position
        user {
          picture
          name
          id
        }
      }
      query GetComments($recordingId: uuid) {
        comments(
          where: { recording_id: { _eq: $recordingId }, _and: { parent_id: { _is_null: true } } }
        ) {
          ...commentFields
          replies(order_by: { created_at: asc }) {
            ...commentFields
          }
        }
      }
    `,
    {
      variables: { recordingId },
      pollInterval: 5000,
    }
  );

  if (error) {
    console.error("Apollo error while fetching comments:", error);
  }

  return { comments: data?.comments || NO_COMMENTS, loading, error };
}

export function useAddComment(callback: Function = () => {}) {
  const [addComment, { error }] = useMutation(
    gql`
      mutation AddComment($object: comments_insert_input! = {}) {
        insert_comments_one(object: $object) {
          id
        }
      }
    `,
    {
      onCompleted: data => {
        const { id } = data.insert_comments_one;
        callback(id);
      },
      refetchQueries: ["GetComments"],
    }
  );

  if (error) {
    console.error("Apollo error while adding a comment:", error);
  }

  return addComment;
}

export function useUpdateComment(callback: Function) {
  const [updateCommentContent, { error }] = useMutation(UPDATE_COMMENT_CONTENT, {
    onCompleted: () => callback(),
  });

  if (error) {
    console.error("Apollo error while updating a comment:", error);
  }

  return updateCommentContent;
}

export function useDeleteComment() {
  const [deleteComment, { error }] = useMutation(
    gql`
      mutation DeleteComment($id: uuid!) {
        update_comments_by_pk(pk_columns: { id: $id }, _set: { deleted_at: "now()" }) {
          id
        }
      }
    `,
    {
      refetchQueries: ["GetComments"],
    }
  );

  if (error) {
    console.error("Apollo error while deleting a comment:", error);
  }

  return deleteComment;
}

export function useDeleteCommentReplies() {
  const [deleteCommentReplies, { error }] = useMutation(
    gql`
      mutation DeleteCommentReplies($parentId: uuid) {
        update_comments(where: { parent_id: { _eq: $parentId } }, _set: { deleted_at: "now()" }) {
          affected_rows
        }
      }
    `,
    {
      refetchQueries: ["GetComments"],
    }
  );

  if (error) {
    console.error("Apollo error while deleting a comment's replies:", error);
  }

  return deleteCommentReplies;
}

export async function getFirstComment(
  recordingId: string
): Promise<{ time: number; point: string; has_frames: boolean } | undefined> {
  const firstCommentResult = await query({
    query: gql`
      query GetFirstCommentTime($recordingId: uuid) {
        comments(
          where: { recording_id: { _eq: $recordingId }, _and: { parent_id: { _is_null: true } } }
          order_by: { time: asc }
          limit: 1
        ) {
          time
          point
          has_frames
        }
      }
    `,
    variables: { recordingId },
  });

  return firstCommentResult?.data?.comments?.[0];
}

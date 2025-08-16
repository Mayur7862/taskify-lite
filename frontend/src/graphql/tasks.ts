import { gql } from "@apollo/client";

export const TASKS = gql`
  query Tasks($projectId: ID!) {
    tasks(projectId: $projectId) {
      id
      title
      description
      status
      assigneeEmail
      dueDate
      createdAt
      comments {
        id
        content
        authorEmail
        createdAt
      }
    }
  }
`;

export const CREATE_TASK = gql`
  mutation CreateTask(
    $projectId: ID!
    $title: String!
    $status: String!
    $description: String
    $assigneeEmail: String
    $dueDate: DateTime
  ) {
    createTask(
      projectId: $projectId
      title: $title
      status: $status
      description: $description
      assigneeEmail: $assigneeEmail
      dueDate: $dueDate
    ) {
      ok
      task {
        id
        title
        description
        status
        assigneeEmail
        dueDate
        createdAt
      }
    }
  }
`;

export const UPDATE_TASK = gql`
  mutation UpdateTask(
    $id: ID!
    $title: String
    $status: String
    $description: String
    $assigneeEmail: String
    $dueDate: DateTime
  ) {
    updateTask(
      id: $id
      title: $title
      status: $status
      description: $description
      assigneeEmail: $assigneeEmail
      dueDate: $dueDate
    ) {
      ok
      task {
        id
        title
        description
        status
        assigneeEmail
        dueDate
        createdAt
        comments {
          id
          content
          authorEmail
          createdAt
        }
      }
    }
  }
`;

export const ADD_COMMENT = gql`
  mutation AddComment($taskId: ID!, $content: String!, $authorEmail: String!) {
    addComment(taskId: $taskId, content: $content, authorEmail: $authorEmail) {
      ok
      comment {
        id
        content
        authorEmail
        createdAt
      }
    }
  }
`;

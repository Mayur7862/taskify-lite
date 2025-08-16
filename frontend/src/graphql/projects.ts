import { gql } from "@apollo/client";

export const LIST_PROJECTS = gql`
  query Projects {
    projects {
      id
      name
      description
      status
      dueDate
      taskCount
      completedTasks
    }
  }
`;

export const CREATE_PROJECT = gql`
  mutation CreateProject($name: String!, $status: String!, $description: String, $dueDate: Date) {
    createProject(name: $name, description: $description, status: $status, dueDate: $dueDate) {
      ok
      project {
        id
        name
        description
        status
        dueDate
        taskCount
        completedTasks
      }
    }
  }
`;

// export const UPDATE_PROJECT = gql`
//   mutation UpdateProject($id: ID!, $name: String, $status: String, $description: String, $dueDate: Date) {
//     updateProject(id: $id, name: $name, description: $description, status: $status, dueDate: $dueDate) {
//       ok
//       project {
//         id
//         name
//         description
//         status
//         dueDate
//         taskCount
//         completedTasks
//       }
//     }
//   }
// `;

import { gql } from "@apollo/client";

export const LIST_ORGS = gql`
  query Organizations {
    organizations {
      id
      name
      slug
      contactEmail
    }
  }
`;

export const CREATE_ORG = gql`
  mutation CreateOrganization($name: String!, $contactEmail: String!, $slug: String) {
    createOrganization(name: $name, contactEmail: $contactEmail, slug: $slug) {
      ok
      organization {
        id
        name
        slug
        contactEmail
      }
    }
  }
`;

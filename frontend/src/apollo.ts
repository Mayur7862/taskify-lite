import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";

const httpLink = createHttpLink({
  uri: "http://localhost:8000/graphql/",
});

const orgLink = setContext((_, { headers }) => {
  const orgSlug = localStorage.getItem("orgSlug") || "";
  const next: Record<string, string> = { ...(headers as Record<string, string>) };
  if (orgSlug) next["X-Org-Slug"] = orgSlug;
  return { headers: next };
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) graphQLErrors.forEach(e => console.error("[GraphQL]", e.message));
  if (networkError) console.error("[Network]", networkError);
});

export const client = new ApolloClient({
  link: errorLink.concat(orgLink).concat(httpLink),
  cache: new InMemoryCache(),
});

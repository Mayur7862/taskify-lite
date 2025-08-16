import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";

const httpLink = createHttpLink({
  uri: "http://localhost:8000/graphql/",
});

const orgLink = setContext((_, { headers }) => {
  const orgSlug = localStorage.getItem("orgSlug") || "";
  const nextHeaders: Record<string, string> = { ...(headers as Record<string, string>) };
  // Only send the custom header when we actually have a value
  if (orgSlug) nextHeaders["X-Org-Slug"] = orgSlug;
  return { headers: nextHeaders };
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    for (const err of graphQLErrors) console.error("[GraphQL error]", err.message);
  }
  if (networkError) console.error("[Network error]", networkError);
});

export const client = new ApolloClient({
  link: errorLink.concat(orgLink).concat(httpLink),
  cache: new InMemoryCache(),
});

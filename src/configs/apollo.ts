import {
    ApolloClientOptions,
    ApolloLink,
    HttpLink,
    InMemoryCache,
    NormalizedCacheObject,
} from '@apollo/client';
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';

const GRAPHQL_ENDPOINT = import.meta.env.APP_GRAPHQL_ENDPOINT;

// Utility to read the CSRF token from cookies
function getCSRFCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()!.split(';').shift() || null;
    return null;
}

// Add CSRF header to all requests
const csrfLink = new ApolloLink((operation, forward) => {
    const token = getCSRFCookie('TC_CMS-DEV-CSRFTOKEN');
    if (token) {
        operation.setContext(({ headers = {} }) => ({
            headers: {
                ...headers,
                'x-csrftoken': token,
            },
        }));
    }
    return forward(operation);
});

const httpLink = new HttpLink({
    uri: GRAPHQL_ENDPOINT,
    credentials: 'include',
});

const uploadLink = createUploadLink({
    uri: GRAPHQL_ENDPOINT,
    credentials: 'include',
});

const link: ApolloLink = ApolloLink.from([
    csrfLink,
    ApolloLink.split(
        (operation) => operation.getContext().hasUpload,
        uploadLink,
        httpLink,
    ),
]);
const apolloOptions: ApolloClientOptions<NormalizedCacheObject> = {
    link,
    cache: new InMemoryCache(),
    defaultOptions: {
        watchQuery: {
            fetchPolicy: 'network-only',
            nextFetchPolicy: 'cache-only',
            errorPolicy: 'all',
        },
        query: {
            fetchPolicy: 'network-only',
            errorPolicy: 'all',
        },
    },
};

export default apolloOptions;

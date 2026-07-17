import {
    defineConfig,
    overrideDefineForWebAppServe,
    Schema,
} from '@togglecorp/vite-plugin-validate-env';

const webAppServeEnabled = process.env.WEB_APP_SERVE_ENABLED?.toLowerCase() === 'true';
if (webAppServeEnabled) {
    // eslint-disable-next-line no-console
    console.warn('Building application for web-app-serve');
}
const overrideDefine = webAppServeEnabled
    ? overrideDefineForWebAppServe
    : undefined;

export default defineConfig({
    overrideDefine,
    validator: 'builtin',
    schema: {
        // NOTE: APP_TITLE is a default (overridable) var. It is consumed at build
        // time by Vite's `%APP_TITLE%` HTML replacement in index.html; the final
        // Dockerfile stage bakes a default ("CMS") and it stays runtime-overridable.
        APP_TITLE: Schema.string(),

        // Dynamic (per-deployment) endpoint, consumed via import.meta.env in
        // src/configs/apollo.ts. Runtime placeholder under web-app-serve.
        APP_GRAPHQL_ENDPOINT: Schema.string(),

        // NOTE: APP_GRAPHQL_CODEGEN_ENDPOINT is intentionally NOT in this schema.
        // It is a build-time-only input, read via process.env in codegen.ts to
        // point graphql-codegen at the backend schema file. It has no
        // `import.meta.env` consumer, so it cannot be a web-app-serve runtime
        // placeholder. Set it as a build-stage ENV in the Dockerfile instead.
    },
});

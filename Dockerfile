# -------------------------- Dev ---------------------------------------
FROM node:22-bookworm AS dev

RUN apt-get update -y \
    && apt-get install -y --no-install-recommends \
        git bash g++ make \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable

WORKDIR /code
RUN git config --global --add safe.directory /code

COPY package.json pnpm-lock.yaml /code/
# NOTE: Activates the pnpm version pinned in package.json "packageManager"
RUN corepack prepare --activate


# -------------------------- web-app-serve - Builder ------------------------
FROM dev AS web-app-serve-build

RUN pnpm install --frozen-lockfile

COPY . .

# NOTE: Dynamic env variables
# These env variables can be dynamically defined in the web-app-serve container
# at runtime. The build-time values below only need to be valid for env.ts schema
# validation; overrideDefineForWebAppServe replaces them with runtime placeholders.
# See the "schema" field in "./env.ts".
#
# APP_TITLE is also consumed at build time by Vite's `%APP_TITLE%` HTML
# replacement in index.html (overrideDefine only rewrites `import.meta.env.*` in
# JS). Use the raw web-app-serve placeholder marker as the build value so the
# served index.html carries a runtime placeholder too (same trick as JS keys).
ENV APP_TITLE=WEB_APP_SERVE_PLACEHOLDER__APP_TITLE
ENV APP_GRAPHQL_ENDPOINT=https://web-app-serve-placeholder.com/graphql/

# NOTE: APP_GRAPHQL_CODEGEN_ENDPOINT is a build-time-only input, read via
# process.env in codegen.ts (graphql-codegen) — not an import.meta.env consumer,
# so it is not a runtime placeholder. It points at the backend submodule schema.
ENV APP_GRAPHQL_CODEGEN_ENDPOINT=./backend/schema.graphql

# NOTE: WEB_APP_SERVE_ENABLED=true swaps the above build-time values for
# web-app-serve runtime placeholders. See "overrideDefine" in "./env.ts".
# `pnpm build` runs `generate:type` first via the prebuild hook.
RUN WEB_APP_SERVE_ENABLED=true pnpm build


# ---------------------------------------------------------------------
# Final image using web-app-serve
FROM ghcr.io/toggle-corp/web-app-serve:v0.1.2 AS web-app-serve

LABEL maintainer="Togglecorp Dev"
LABEL org.opencontainers.image.source="https://github.com/capn-nepal/website-cms"

# Env for apply-config script (base image only presets DESTINATION_DIRECTORY)
ENV APPLY_CONFIG__SOURCE_DIRECTORY=/code/build/

COPY --from=web-app-serve-build /code/build "$APPLY_CONFIG__SOURCE_DIRECTORY"

# Ship a hardened custom apply-config (grep ^APP_) instead of the base image's
# stock default-app-apply-config.sh. The stock script only substitutes vars that
# are SET and never blanks unfilled markers, so an unset var leaked the literal
# WEB_APP_SERVE_PLACEHOLDER__* marker into the bundle — visibly so for APP_TITLE,
# which appears as `%APP_TITLE%` in index.html (<title>, noscript). Our script
# escapes sed metachars (values with &/|/\ substitute literally, no crash),
# resolves unfilled quoted-JS placeholders to `undefined` (falsy), and warns on
# stderr about every leftover marker. See ./web-app-serve/apply-config.sh.
COPY ./web-app-serve/apply-config.sh /web-app-serve/app-apply-config.sh
RUN chmod +x /web-app-serve/app-apply-config.sh
ENV APPLY_CONFIG__APPLY_CONFIG_PATH=/web-app-serve/app-apply-config.sh

# NOTE: APP_TITLE is a default (overridable) var — it has a sensible shared
# default ("CMS") but stays runtime-overridable. Bake the default as an ENV here
# in the final stage; apply-config substitutes it at startup like any other var,
# so deployments need not set it, yet can override it. (The build stage sets
# APP_TITLE to the raw placeholder marker so index.html carries a runtime slot.)
ENV APP_TITLE="CMS"

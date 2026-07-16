#!/bin/env bash

set -xe

# Substitute WEB_APP_SERVE_PLACEHOLDER__<VAR> markers with runtime values.
# Based on the base image's default-app-apply-config.sh (which handles ^APP_),
# but hardened with two conventions the stock script lacks:
#   1. sed replacement metacharacters are escaped so values substitute literally;
#   2. unfilled placeholders are resolved to JS `undefined` (quoted JS markers
#      only) and every leftover is warned about on stderr.
# Shipped despite the APP_ prefix because %APP_TITLE% in index.html is
# user-visible: an unset var would otherwise leak the literal marker onto the
# page. (APP_TITLE has a baked default in the Dockerfile final stage so the loop
# always fills it; the warning below just flags the accident of it ever being
# unset — the quoted-JS rewrite intentionally does not touch that unquoted
# index.html marker.)
while IFS='=' read -r KEY VALUE; do
    # Escape sed replacement metacharacters (\, & and the | delimiter) so
    # URLs/tokens containing them substitute literally
    ESCAPED_VALUE=$(printf '%s' "$VALUE" | sed -e 's/[\\&|]/\\&/g')
    find "$DESTINATION_DIRECTORY" -type f \
        -exec sed -i "s|\<WEB_APP_SERVE_PLACEHOLDER__$KEY\>|$ESCAPED_VALUE|g" {} +
done < <(env | grep '^APP_')

# Resolve unfilled placeholders to real JS `undefined` (falsy) instead of
# leaking the literal marker (a truthy string) into the bundle. The
# overrideDefineForWebAppServe emits the marker JSON-stringified (quoted), so
# consuming the surrounding quotes turns `"WEB_APP_SERVE_PLACEHOLDER__APP_X"`
# into a bare `undefined`. Warn about every placeholder we had to blank this way
# (including unquoted occurrences such as index.html that the rewrite leaves in
# place — the fix for those is a baked default in the Dockerfile final stage).
LEFTOVER_PLACEHOLDERS=$(grep -rho 'WEB_APP_SERVE_PLACEHOLDER__APP_[A-Za-z0-9_]*' "$DESTINATION_DIRECTORY" | sort -u)
if [ -n "$LEFTOVER_PLACEHOLDERS" ]; then
    echo "WARNING: the following placeholders had no runtime value and were replaced with 'undefined':" >&2
    printf '%s\n' "$LEFTOVER_PLACEHOLDERS" | sed 's/^/  - /' >&2
fi
find "$DESTINATION_DIRECTORY" -type f \
    -exec sed -i 's|"WEB_APP_SERVE_PLACEHOLDER__APP_[A-Za-z0-9_]*"|undefined|g' {} +

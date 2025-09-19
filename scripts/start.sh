#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_ROOT=$(dirname "$SCRIPT_DIR")
cd "$PROJECT_ROOT"

printf '%s\n' 'Applying Prisma migrations...'
npx prisma migrate deploy

SERVER_ENTRY=""
if [ -f "build/server.cjs" ]; then
  SERVER_ENTRY="build/server.cjs"
elif [ -f "build/server.js" ]; then
  SERVER_ENTRY="build/server.js"
else
  printf '%s\n' 'Error: expected build/server.cjs or build/server.js to exist after build step.' >&2
  exit 1
fi

printf 'Starting application with %s\n' "$SERVER_ENTRY"
exec node "$SERVER_ENTRY"

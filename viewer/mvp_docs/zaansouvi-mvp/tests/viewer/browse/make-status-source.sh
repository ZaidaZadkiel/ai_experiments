#!/bin/bash
# Makes the source with every file status that mvp2.json uses (RUN-35, UI-48): a hidden file, a link inside and one
# outside the source, a read-only and an unreadable file, node_modules and .git (skipped as wholes, RUN-34b), and
# test-source-mvp2's app.ts and shapes.ts. Recreated from scratch every time, outside the project, so a backup of the
# project never meets the unreadable file.
# Usage: make-status-source.sh [<folder>]   (default /tmp/zaansouvi-status-source, the path mvp2.json adds)
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
SRC="$(cd "$HERE/../../../test-source-mvp2/src" && pwd)"
T="${1:-/tmp/zaansouvi-status-source}"

if [ -e "$T" ]; then chmod -R u+rwX "$T"; rm -rf "$T"; fi
mkdir -p "$T/src" "$T/.git" "$T/node_modules/pkg"
cp "$SRC/app.ts" "$SRC/shapes.ts" "$T/src/"
printf '# notes\n' > "$T/.notes.md"
printf 'ref: main\n' > "$T/.git/HEAD"
printf 'x\n' > "$T/node_modules/pkg/index.js"
printf 'fixed\n' > "$T/readonly.txt";   chmod 444 "$T/readonly.txt"
printf 'secret\n' > "$T/unreadable.txt"; chmod 000 "$T/unreadable.txt"
ln -s src/app.ts "$T/link-in.ts"
ln -s /etc/hostname "$T/link-out"
echo "$T"

#!/bin/sh
set -eu

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

base_ref="${DOCPACT_BASE_REF:-origin/main}"
head_ref="${DOCPACT_HEAD_REF:-HEAD}"

while [ "$#" -gt 0 ]; do
  case "$1" in
    --base)
      base_ref="$2"
      shift 2
      ;;
    --head)
      head_ref="$2"
      shift 2
      ;;
    *) shift ;;
  esac
done

base_sha="$(git merge-base "$head_ref" "$base_ref")"
head_sha="$(git rev-parse "$head_ref")"
report_path="${TMPDIR:-/tmp}/portal-docpact-gate-$$.json"
trap 'rm -f "$report_path"' EXIT HUP INT TERM

scripts/docpact validate-config --root "$repo_root" --strict
scripts/docpact lint \
  --root "$repo_root" \
  --base "$base_sha" \
  --head "$head_sha" \
  --mode enforce \
  --output "$report_path"

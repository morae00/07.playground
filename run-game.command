#!/bin/zsh
set -e

cd "$(dirname "$0")"

if [ -d "release/mac-arm64/Blackline Survivor.app" ]; then
  open "release/mac-arm64/Blackline Survivor.app"
elif [ -d "release/mac/Blackline Survivor.app" ]; then
  open "release/mac/Blackline Survivor.app"
else
  npm run electron
fi

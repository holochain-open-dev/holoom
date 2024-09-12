#! /bin/bash
set -e
npm install ./packages/types ./packages/authority ./packages/client ./packages/sandbox

# Link installed modules to volume for latest changes
cd ./packages/types
npm link
cd ../authority
npm link
cd ../client
npm link
cd ../sandbox
npm link
cd ../..
npm link @holoom/types
npm link @holoom/authority
npm link @holoom/client
npm link @holoom/sandbox

npx tsx watch ./agent.ts
